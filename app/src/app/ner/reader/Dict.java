package app.ner.reader;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;

/**
 * On-device dictionary packs. A pack is gzip-compressed JSON with:
 *   entries: headword -> {w, tr, pos, g:[glosses], h:[Hebrew definitions], rank}
 *   forms:   inflected form -> headword
 * A phrase pack (dict/phrases/<lang>.json.gz, from tools/build_phrases.py) adds
 * idioms, proverbs, chengyu and fixed expressions:
 *   phrases: key -> {w, tr, k:kind, g:[glosses], t:[match tokens]}
 * Packs are streamed into plain objects: the Chinese pack has 100k entries, and
 * a JSONObject tree of it does not fit a phone's heap.
 */
public final class Dict {
    private static final String TAG = "NerDict";
    private final AssetManager assets;
    private final Object lock = new Object();
    private Map<String, Entry> entries;
    private Map<String, String> forms;
    private String loadedLang;
    private Map<String, Integer> segmentRank;
    private int segmentMaxLen = 1;

    private static final Pattern PHRASE_WORD = Pattern.compile("[\\p{L}\\p{M}\\p{N}_'’ʼ\\-]+");
    private static final Pattern SENTENCE_END = Pattern.compile("[.!?;:…。！？\n]");
    // "third-person singular imperfect indicative of pleuvoir", "past participle of poser"
    private static final Pattern FORM_OF = Pattern.compile(
            "(?:inflection|participle|plural|singular|indicative|subjunctive|imperative|conditional|preterite|"
                    + "infinitive|gerund|feminine|masculine|comparative|superlative|form|tense|person)\\b[^:;]*? of ([^\\s,;:()]+)$");
    private static final Pattern GRAMMAR_NOTE = Pattern.compile("^(first|second|third)[-/ ]|person (singular|plural)|^(plural|singular) of ");
    private static final String[] NO_STRINGS = new String[0];

    private String phraseLang;
    private Map<String, PhraseEntry> phrases = new HashMap<>();
    private boolean phraseUnspaced;
    private int phraseMaxLen;
    private Map<String, List<Phrase>> phraseIndex = new HashMap<>();
    private String[] elision = NO_STRINGS;
    private Set<String> possSet = new HashSet<>();
    private Set<String> reflSet = new HashSet<>();
    private final Map<String, String> lemmaCache = new HashMap<>();

    private static final class Entry {
        String w, tr, pos;
        String[] g = NO_STRINGS, h = NO_STRINGS;
        int rank = Integer.MAX_VALUE;
    }

    private static final class PhraseEntry {
        String w, tr, kind = "phrase";
        String[] g = NO_STRINGS, t = NO_STRINGS;
    }

    private static final class Phrase {
        String key;
        String[] toks;
        String[] lemmas;
    }

    private static final class Tok {
        int start, end;
        String canon, lemma;
        boolean brk; // a sentence ends between the previous token and this one
    }

    public Dict(Context context) {
        this.assets = context.getAssets();
    }

    public void preload(String lang) {
        try {
            ensure(lang);
        } catch (Exception e) {
            Log.w(TAG, "Preload failed for " + lang, e);
        }
        try {
            ensurePhrases(lang);
        } catch (Exception e) {
            Log.w(TAG, "Phrase preload failed for " + lang, e);
        }
    }

    /* ---------------- loading ---------------- */

    private static JsonReader open(InputStream raw) throws Exception {
        return new JsonReader(new InputStreamReader(
                new BufferedInputStream(new GZIPInputStream(raw, 65536), 65536), StandardCharsets.UTF_8));
    }

    private static String[] strings(JsonReader r) throws Exception {
        if (r.peek() != JsonToken.BEGIN_ARRAY) { r.skipValue(); return NO_STRINGS; }
        List<String> out = new ArrayList<>(4);
        r.beginArray();
        while (r.hasNext()) {
            if (r.peek() == JsonToken.STRING) out.add(r.nextString()); else r.skipValue();
        }
        r.endArray();
        return out.isEmpty() ? NO_STRINGS : out.toArray(NO_STRINGS);
    }

    private static String string(JsonReader r) throws Exception {
        if (r.peek() == JsonToken.NULL) { r.nextNull(); return ""; }
        return r.nextString();
    }

    private static Entry readEntry(JsonReader r) throws Exception {
        Entry e = new Entry();
        r.beginObject();
        while (r.hasNext()) {
            switch (r.nextName()) {
                case "w": e.w = string(r); break;
                case "tr": e.tr = string(r); break;
                case "pos": e.pos = string(r).intern(); break;
                case "g": e.g = strings(r); break;
                case "h": e.h = strings(r); break;
                case "rank": e.rank = r.peek() == JsonToken.NUMBER ? r.nextInt() : skipInt(r); break;
                default: r.skipValue();
            }
        }
        r.endObject();
        return e;
    }

    private static int skipInt(JsonReader r) throws Exception { r.skipValue(); return Integer.MAX_VALUE; }

    private void ensure(String lang) throws Exception {
        synchronized (lock) {
            if (lang.equals(loadedLang) && entries != null) return;
            Map<String, Entry> en = new HashMap<>();
            Map<String, String> fm = new HashMap<>();
            entries = null;
            forms = null;
            segmentRank = null;
            try (InputStream raw = assets.open("dict/" + lang + ".json.gz"); JsonReader r = open(raw)) {
                r.beginObject();
                while (r.hasNext()) {
                    String name = r.nextName();
                    if ("entries".equals(name)) {
                        r.beginObject();
                        while (r.hasNext()) en.put(r.nextName(), readEntry(r));
                        r.endObject();
                    } else if ("forms".equals(name)) {
                        r.beginObject();
                        while (r.hasNext()) fm.put(r.nextName(), r.nextString());
                        r.endObject();
                    } else {
                        r.skipValue();
                    }
                }
                r.endObject();
            }
            entries = en;
            forms = fm;
            loadedLang = lang;
            lemmaCache.clear();
            segmentMaxLen = 1;
            if (lang.equals(phraseLang)) indexPhrases();
        }
    }

    private void ensurePhrases(String lang) throws Exception {
        synchronized (lock) {
            if (lang.equals(phraseLang)) return;
            phrases = new HashMap<>();
            phraseUnspaced = false;
            elision = NO_STRINGS;
            possSet = new HashSet<>();
            reflSet = new HashSet<>();
            segmentRank = null;
            try (InputStream raw = assets.open("dict/phrases/" + lang + ".json.gz"); JsonReader r = open(raw)) {
                r.beginObject();
                while (r.hasNext()) {
                    String name = r.nextName();
                    if ("meta".equals(name)) {
                        readPhraseMeta(r);
                    } else if ("phrases".equals(name)) {
                        r.beginObject();
                        while (r.hasNext()) phrases.put(r.nextName(), readPhrase(r));
                        r.endObject();
                    } else {
                        r.skipValue();
                    }
                }
                r.endObject();
            } catch (java.io.FileNotFoundException missing) {
                // No phrase pack for this language; words still work.
            }
            phraseLang = lang;
            indexPhrases();
        }
    }

    private void readPhraseMeta(JsonReader r) throws Exception {
        r.beginObject();
        while (r.hasNext()) {
            switch (r.nextName()) {
                case "unspaced": phraseUnspaced = r.nextBoolean(); break;
                case "elision": elision = strings(r); break;
                case "poss": possSet = new HashSet<>(Arrays.asList(strings(r))); break;
                case "refl": reflSet = new HashSet<>(Arrays.asList(strings(r))); break;
                default: r.skipValue();
            }
        }
        r.endObject();
    }

    private static PhraseEntry readPhrase(JsonReader r) throws Exception {
        PhraseEntry e = new PhraseEntry();
        r.beginObject();
        while (r.hasNext()) {
            switch (r.nextName()) {
                case "w": e.w = string(r); break;
                case "tr": e.tr = string(r); break;
                case "k": e.kind = string(r).intern(); break;
                case "g": e.g = strings(r); break;
                case "t": e.t = strings(r); break;
                default: r.skipValue();
            }
        }
        r.endObject();
        return e;
    }

    /** Index spaced phrases by first token (and its lemma, which needs the word pack). */
    private void indexPhrases() {
        phraseIndex = new HashMap<>();
        phraseMaxLen = 0;
        for (Map.Entry<String, PhraseEntry> me : phrases.entrySet()) {
            String k = me.getKey();
            if (phraseUnspaced) {
                phraseMaxLen = Math.max(phraseMaxLen, Math.min(24, k.length()));
                continue;
            }
            String[] t = me.getValue().t;
            if (t.length < 2 || "*".equals(t[0])) continue;
            Phrase ph = new Phrase();
            ph.key = k;
            ph.toks = t;
            ph.lemmas = new String[t.length];
            for (int i = 0; i < t.length; i++) {
                ph.lemmas[i] = t[i].startsWith("#") || "*".equals(t[i]) ? null : lemmaOf(t[i]);
            }
            index(t[0], ph);
            if (ph.lemmas[0] != null && !ph.lemmas[0].equals(t[0])) index(ph.lemmas[0], ph);
        }
    }

    private void index(String tok, Phrase ph) {
        List<Phrase> list = phraseIndex.get(tok);
        if (list == null) { list = new ArrayList<>(2); phraseIndex.put(tok, list); }
        list.add(ph);
    }

    /* ---------------- words ---------------- */

    private static String stripNiqqud(String s) {
        if (s == null) return "";
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= '֑' && c <= '֯') || (c >= 'ְ' && c <= 'ׇ')) continue;
            if (c == '־') continue; // maqaf
            out.append(c);
        }
        return out.toString().trim();
    }

    private Entry at(String key) {
        if (key == null || key.isEmpty() || entries == null) return null;
        return entries.get(key);
    }

    private String form(String key) {
        String f = forms == null || key == null ? null : forms.get(key);
        return f == null ? "" : f;
    }

    private static int rank(Entry e) {
        return e == null ? Integer.MAX_VALUE : e.rank;
    }

    /** Find the best headword, trying exact form, then common Hebrew prefixes. */
    private String resolve(String lang, String raw) {
        String key = "he".equals(lang) ? stripNiqqud(raw) : raw.trim().toLowerCase(Locale.ROOT)
                .replace('’', '\'').replace('ʼ', '\'');
        if (key.isEmpty()) return null;
        String found = resolveKey(lang, key);
        if (found != null || key.indexOf('\'') < 0) return found;
        // l'homme, dell'anno, John's: try the word without the elided article or 's.
        try { ensurePhrases(lang); } catch (Exception ignored) { }
        for (String p : elision) {
            if (key.startsWith(p) && key.length() - p.length() >= 2) {
                found = resolveKey(lang, key.substring(p.length()));
                if (found != null) return found;
            }
        }
        if (key.endsWith("'s") && key.length() > 3) return resolveKey(lang, key.substring(0, key.length() - 2));
        return null;
    }

    private String resolveKey(String lang, String key) {
        Entry direct = at(key);
        String formKey = form(key);
        Entry viaForm = at(formKey);
        if (direct != null || viaForm != null) {
            return rank(direct) <= rank(viaForm) ? key : formKey;
        }
        if ("he".equals(lang) && key.length() >= 3) {
            String[] prefixes = {"וכשה", "ושה", "כשה", "לכ", "בכ", "מכ", "וה", "שב", "כש", "לה", "מה", "הכ", "ו", "ב", "ל", "מ", "ה", "כ", "ש"};
            for (String p : prefixes) {
                if (key.startsWith(p) && key.length() - p.length() >= 2) {
                    String rest = key.substring(p.length());
                    Entry d2 = at(rest);
                    String f2 = form(rest);
                    Entry v2 = at(f2);
                    if (d2 != null || v2 != null) {
                        return rank(d2) <= rank(v2) ? rest : f2;
                    }
                }
            }
        }
        return null;
    }

    private String lemmaOf(String tok) {
        if (entries == null || tok == null || tok.isEmpty()) return null;
        String cached = lemmaCache.get(tok);
        if (cached != null) return cached.isEmpty() ? null : cached;
        String out = null;
        Entry e = entries.get(tok);
        if (e != null) {
            out = tok;
            Matcher m = e.g.length == 0 ? null : FORM_OF.matcher(e.g[0]);
            if (m != null && m.find() && entries.containsKey(m.group(1).toLowerCase(Locale.ROOT))) {
                out = m.group(1).toLowerCase(Locale.ROOT);
            }
        } else {
            String f = form(tok);
            if (!f.isEmpty()) out = f;
        }
        if (lemmaCache.size() > 50000) lemmaCache.clear();
        lemmaCache.put(tok, out == null ? "" : out);
        return out;
    }

    /* ---------------- segmentation ---------------- */

    private void buildSegmenter() {
        if (segmentRank != null) return;
        Map<String, Integer> ranks = new HashMap<>();
        int maxLen = 1;
        if (entries != null) {
            for (Map.Entry<String, Entry> me : entries.entrySet()) {
                String w = me.getKey();
                ranks.put(w, me.getValue().rank == Integer.MAX_VALUE ? 100000 : me.getValue().rank);
                if (w.length() > maxLen && w.length() <= 16) maxLen = w.length();
            }
        }
        if (forms != null) {
            for (Map.Entry<String, String> me : forms.entrySet()) {
                String f = me.getKey();
                if (f.length() > 16) continue;
                Entry e = entries == null ? null : entries.get(me.getValue());
                if (!ranks.containsKey(f)) ranks.put(f, e == null || e.rank == Integer.MAX_VALUE ? 100000 : e.rank);
                if (f.length() > maxLen) maxLen = f.length();
            }
        }
        // Chengyu and sayings win over splitting them into ordinary words.
        if (phraseUnspaced) {
            for (String k : phrases.keySet()) {
                if (k.length() < 3 || k.length() > 16) continue;
                ranks.put(k, 1);
                if (k.length() > maxLen) maxLen = k.length();
            }
        }
        segmentMaxLen = maxLen;
        segmentRank = ranks;
    }

    // Each word costs about -log(probability): log(rank) plus a fixed per-word
    // charge, so 生词 beats 生 + 词 although both halves are more frequent.
    private static long wordCost(int rank) {
        return Math.round(Math.log(Math.max(1, rank) + 1.0) * 1000) + 6000;
    }

    /**
     * Dictionary-driven segmentation for scripts where the WebView ICU data only
     * returns single characters (notably Chinese). Returns a JSON array of tokens.
     */
    public String segment(String lang, String text) {
        try {
            ensure(lang);
            ensurePhrases(lang);
            Map<String, Integer> ranks;
            int maxLen;
            synchronized (lock) {
                buildSegmenter();
                ranks = segmentRank;
                maxLen = segmentMaxLen;
            }
            if (ranks == null || ranks.isEmpty() || text == null || text.isEmpty()) return "[]";
            int n = text.length();
            long[] cost = new long[n + 1];
            int[] prev = new int[n + 1];
            Arrays.fill(cost, Long.MAX_VALUE / 4);
            cost[0] = 0;
            final long fallback = 30000; // a character outside the lexicon
            for (int i = 0; i < n; i++) {
                if (cost[i] >= Long.MAX_VALUE / 8) continue;
                char c = text.charAt(i);
                boolean letter = Character.isLetterOrDigit(c);
                Integer single = letter ? ranks.get(String.valueOf(c)) : null;
                long fc = !letter ? 1 : single != null ? wordCost(single) : fallback;
                if (cost[i] + fc < cost[i + 1]) { cost[i + 1] = cost[i] + fc; prev[i + 1] = i; }
                int max = Math.min(maxLen, n - i);
                for (int len = 2; len <= max; len++) {
                    Integer rank = ranks.get(text.substring(i, i + len));
                    if (rank == null) continue;
                    long wc = wordCost(rank);
                    if (cost[i] + wc < cost[i + len]) {
                        cost[i + len] = cost[i] + wc;
                        prev[i + len] = i;
                    }
                }
            }
            List<String> out = new ArrayList<>();
            int at = n;
            while (at > 0) {
                int p = prev[at];
                if (p < 0) p = at - 1;
                out.add(text.substring(p, at));
                at = p;
            }
            JSONArray arr = new JSONArray();
            for (int i = out.size() - 1; i >= 0; i--) arr.put(out.get(i));
            return arr.toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    /* ---------------- lookup ---------------- */

    private static JSONArray array(String[] values) {
        JSONArray a = new JSONArray();
        for (String v : values) a.put(v);
        return a;
    }

    public String lookup(String lang, String raw) {
        try {
            ensure(lang);
            JSONObject root = new JSONObject();
            root.put("word", raw);
            root.put("lang", lang);
            String key = resolve(lang, raw);
            JSONObject phrase = null;
            try {
                ensurePhrases(lang);
                if (phraseUnspaced) phrase = phraseEntry(phraseKey(raw), 0, raw.length());
            } catch (Exception ignored) { }
            if (phrase != null) root.put("phrase", phrase);
            if (key == null && phrase != null) {
                root.put("found", true);
                root.put("key", phrase.optString("key"));
                root.put("display", phrase.optString("w"));
                root.put("tr", phrase.optString("tr"));
                root.put("pos", phrase.optString("kind"));
                root.put("rank", 0);
                root.put("glosses", phrase.optJSONArray("g"));
                root.put("he", new JSONArray());
                root.put("meaning", phrase.optJSONArray("g").optString(0));
                root.put("meaningLang", "en");
                root.put("source", "English Wiktionary");
                return root.toString();
            }
            Entry e = at(key);
            if (e == null) {
                root.put("found", false);
                return root.toString();
            }
            // "cordes: plural of corde" — show corde's meaning and keep the note.
            String note = null;
            String lemma = lemmaOf(key);
            Entry base = lemma == null || lemma.equals(key) ? null : at(lemma);
            if (base != null && base.g.length > 0) {
                note = e.g.length > 0 ? e.g[0] : null;
                key = lemma;
                e = base;
            }
            root.put("found", true);
            root.put("key", key);
            root.put("display", e.w == null || e.w.isEmpty() ? key : e.w);
            root.put("tr", e.tr == null ? "" : e.tr);
            root.put("pos", e.pos == null ? "" : e.pos);
            root.put("rank", e.rank == Integer.MAX_VALUE ? 0 : e.rank);
            JSONArray glosses = new JSONArray();
            for (String g : e.g) {
                // Grammar notes merged in from other entries are not meanings.
                if (glosses.length() > 0 && (FORM_OF.matcher(g).find() || GRAMMAR_NOTE.matcher(g).find())) continue;
                glosses.put(g);
            }
            if (note != null) glosses.put(note);
            root.put("glosses", glosses);
            root.put("he", array(e.h));
            if (e.h.length > 0) {
                root.put("meaning", e.h[0]);
                root.put("meaningLang", "he");
            } else {
                root.put("meaning", e.g.length > 0 ? e.g[0] : "");
                root.put("meaningLang", "en");
            }
            root.put("source", "zh".equals(lang) || "yue".equals(lang) ? "CC-CEDICT" : "Wiktionary / FrequencyWords");
            return root.toString();
        } catch (Throwable e) {
            try {
                JSONObject root = new JSONObject();
                root.put("found", false);
                root.put("word", raw);
                root.put("error", e.getMessage() == null ? "lookup failed" : e.getMessage());
                return root.toString();
            } catch (JSONException ignored) {
                return "{\"found\":false}";
            }
        }
    }

    public String lookupForm(String lang, String raw) {
        return lookup(lang, raw);
    }

    /** Word lookup plus the saying or idiom (if any) that the tapped word sits in. */
    public String lookupAt(String lang, String raw, String text, int offset) {
        String base = lookup(lang, raw);
        try {
            JSONObject root = new JSONObject(base);
            JSONObject phrase = new JSONObject(phraseAt(lang, text, offset));
            if (phrase.optBoolean("found") && !phrase.optString("key").equals(root.optString("key"))) {
                root.put("phrase", phrase);
            }
            return root.toString();
        } catch (Exception e) {
            return base;
        }
    }

    /* ---------------- phrases ---------------- */

    /**
     * Find the longest known phrase in {@code text} that covers character {@code offset}.
     * Spaced scripts match token by token, allowing inflected forms (via the pack's
     * form table), any possessive/reflexive pronoun, and 1–3 words for a
     * someone/something slot, but never across the end of a sentence. Unspaced
     * scripts (Chinese, Japanese, Thai) match substrings, so a chengyu is found
     * whichever character was tapped.
     */
    public String phraseAt(String lang, String text, int offset) {
        try {
            if (text == null || text.isEmpty()) return "{\"found\":false}";
            try { ensure(lang); } catch (Exception ignored) { }
            ensurePhrases(lang);
            if (phrases.isEmpty()) return "{\"found\":false}";
            int from = Math.max(0, offset - 2000);
            int to = Math.min(text.length(), offset + 2000);
            String win = text.substring(from, to);
            int off = Math.max(0, Math.min(win.length() - 1, offset - from));
            JSONObject hit = phraseUnspaced ? unspacedAt(win, off) : spacedAt(win, off);
            if (hit == null) return "{\"found\":false}";
            hit.put("start", hit.optInt("start") + from);
            hit.put("end", hit.optInt("end") + from);
            return hit.toString();
        } catch (Exception e) {
            return "{\"found\":false}";
        }
    }

    private static String phraseKey(String raw) {
        return raw == null ? "" : stripMarks(raw.toLowerCase(Locale.ROOT)).replaceAll("\\s+", "");
    }

    private static String stripMarks(String s) {
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= '֑' && c <= 'ׇ') || (c >= 'ً' && c <= 'ٟ') || c == 'ٰ') continue;
            out.append(c == '’' || c == 'ʼ' ? '\'' : c);
        }
        return out.toString();
    }

    private JSONObject phraseEntry(String key, int start, int end) throws JSONException {
        PhraseEntry e = phrases.get(key);
        if (e == null) return null;
        JSONObject out = new JSONObject();
        out.put("found", true);
        out.put("key", key);
        // Chinese entries are headed in traditional script; show the form that was read.
        out.put("w", phraseUnspaced || e.w == null ? key : e.w);
        out.put("tr", e.tr == null ? "" : e.tr);
        out.put("kind", e.kind);
        out.put("g", array(e.g));
        out.put("start", start);
        out.put("end", end);
        return out;
    }

    private JSONObject unspacedAt(String text, int off) throws JSONException {
        String low = text.toLowerCase(Locale.ROOT);
        for (int len = Math.min(phraseMaxLen, low.length()); len >= 3; len--) {
            for (int s = Math.max(0, off - len + 1); s <= off && s + len <= low.length(); s++) {
                String k = low.substring(s, s + len);
                if (phrases.containsKey(k)) return phraseEntry(k, s, s + len);
            }
        }
        return null;
    }

    private List<Tok> phraseTokens(String text) {
        List<Tok> out = new ArrayList<>();
        Matcher m = PHRASE_WORD.matcher(text);
        int prevEnd = 0;
        while (m.find()) {
            boolean brk = !out.isEmpty() && SENTENCE_END.matcher(text.substring(prevEnd, m.start())).find();
            prevEnd = m.end();
            String raw = stripMarks(m.group().toLowerCase(Locale.ROOT));
            int s = m.start();
            int e = m.end();
            int lead = 0;
            while (lead < raw.length() && (raw.charAt(lead) == '-' || raw.charAt(lead) == '\'')) lead++;
            String t = raw.substring(lead);
            if (!t.endsWith("'")) while (t.endsWith("-") || t.endsWith("'")) t = t.substring(0, t.length() - 1);
            if (t.isEmpty()) continue;
            s += lead;
            int first = out.size();
            for (String p : elision) {
                if (t.startsWith(p) && t.length() > p.length()) {
                    out.add(tok(p, s, s + p.length()));
                    s += p.length();
                    t = t.substring(p.length());
                    break;
                }
            }
            out.add(tok(t, s, e));
            out.get(first).brk = brk;
        }
        return out;
    }

    private Tok tok(String t, int s, int e) {
        Tok k = new Tok();
        k.start = s;
        k.end = e;
        k.canon = possSet.contains(t) ? "#poss" : reflSet.contains(t) ? "#refl" : t;
        k.lemma = lemmaOf(t);
        if (k.lemma == null) k.lemma = t;
        return k;
    }

    private JSONObject spacedAt(String text, int off) throws JSONException {
        List<Tok> toks = phraseTokens(text);
        int at = -1;
        for (int i = 0; i < toks.size(); i++) {
            if (toks.get(i).start <= off) at = i;
            if (toks.get(i).end > off) break;
        }
        if (at < 0) return null;
        Phrase best = null;
        int bestStart = 0, bestEnd = 0;
        int[] end = new int[1];
        for (int i = Math.max(0, at - 14); i <= at; i++) {
            Tok t = toks.get(i);
            List<Phrase> cands = new ArrayList<>();
            List<Phrase> a = phraseIndex.get(t.canon);
            if (a != null) cands.addAll(a);
            List<Phrase> b = t.lemma.equals(t.canon) ? null : phraseIndex.get(t.lemma);
            if (b != null) cands.addAll(b);
            for (Phrase ph : cands) {
                if (!match(ph, 0, toks, i, end) || end[0] <= at) continue;
                if (best == null || ph.toks.length > best.toks.length
                        || (ph.toks.length == best.toks.length && end[0] - i < bestEnd - bestStart)) {
                    best = ph;
                    bestStart = i;
                    bestEnd = end[0];
                }
            }
        }
        if (best == null) return null;
        return phraseEntry(best.key, toks.get(bestStart).start, toks.get(bestEnd - 1).end);
    }

    private boolean match(Phrase ph, int pi, List<Tok> toks, int ti, int[] end) {
        if (pi == ph.toks.length) { end[0] = ti; return true; }
        String p = ph.toks[pi];
        if ("*".equals(p)) {
            for (int k = 1; k <= 3 && ti + k <= toks.size(); k++) {
                if (toks.get(ti + k - 1).brk) return false;
                if (match(ph, pi + 1, toks, ti + k, end)) return true;
            }
            return false;
        }
        if (ti >= toks.size()) return false;
        Tok t = toks.get(ti);
        if (pi > 0 && t.brk) return false;
        boolean same = p.equals(t.canon) || (ph.lemmas[pi] != null && ph.lemmas[pi].equals(t.lemma));
        return same && match(ph, pi + 1, toks, ti + 1, end);
    }
}
