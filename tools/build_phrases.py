#!/usr/bin/env python3
"""Build offline phrase packs: idioms, proverbs, sayings, chengyu and fixed expressions.

Usage:
  python3 tools/build_phrases.py            # all languages
  python3 tools/build_phrases.py fr zh      # some languages

Reads English Wiktionary extracts from kaikki.org (CC BY-SA 3.0), the
`phrase`, `proverb` and `prep_phrase` parts of speech. Downloads are cached in
data/raw/phrases/. Writes app/assets/dict/phrases/<code>.json.gz:

  {"meta": {...}, "phrases": {key: {"w", "tr", "k", "g", "t"}}}

key  normalised lookup key (tokens joined by one space; no spaces for CJK/Thai)
w    headword as written
tr   reading (pinyin for Chinese, otherwise romanisation/IPA when present)
k    kind: "proverb", "idiom" (incl. chengyu) or "phrase"
g    up to three English glosses
t    match tokens for spaced scripts; "*" = someone/something slot,
     "#poss" = possessive, "#refl" = reflexive pronoun
"""
import gzip, json, re, sys, unicodedata, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data/raw/phrases"
OUT = ROOT / "app/assets/dict/phrases"

LANGS = {
    "he": "Hebrew", "en": "English", "hu": "Hungarian", "ar": "Arabic", "es": "Spanish",
    "fr": "French", "de": "German", "it": "Italian", "pt": "Portuguese", "nl": "Dutch",
    "sv": "Swedish", "da": "Danish", "no": "Norwegian Bokmål", "fi": "Finnish",
    "pl": "Polish", "ru": "Russian", "uk": "Ukrainian", "el": "Greek", "tr": "Turkish",
    "zh": "Chinese", "yue": "Chinese", "ja": "Japanese", "ko": "Korean",
    "vi": "Vietnamese", "id": "Indonesian", "th": "Thai",
}
POS = ["phrase", "proverb", "prep_phrase"]
# Multi-word idioms filed under an ordinary part of speech (pleuvoir des cordes,
# tout à fait, give up). Only lines whose headword has a space are kept.
MULTI_POS = ["verb", "adv", "intj", "adj"]
UNSPACED = {"zh", "yue", "ja", "th"}

# Must stay in step with Dict.java (phraseTokens).
ELISION = {
    "fr": ["jusqu'", "lorsqu'", "puisqu'", "quoiqu'", "qu'", "l'", "d'", "j'", "n'", "s'", "c'", "m'", "t'"],
    "it": ["dell'", "all'", "dall'", "nell'", "sull'", "coll'", "quell'", "bell'", "un'", "l'", "d'", "c'", "s'", "m'", "t'", "v'"],
}
SLOTS = {
    "en": {"someone", "somebody", "something", "sb", "sth", "someplace", "somewhere"},
    "fr": {"qqn", "qqch", "qn", "qch", "quelqu'un", "quelque_chose"},
    "es": {"alguien", "algo"}, "it": {"qualcuno", "qualcosa", "qlcu", "qlco"},
    "pt": {"alguém", "algo", "algum"}, "de": {"jemand", "jemanden", "jemandem", "jemandes", "etwas", "jmd", "jmdn", "jmdm", "etw"},
    "nl": {"iemand", "iets"}, "sv": {"någon", "något"}, "da": {"nogen", "noget"}, "no": {"noen", "noe"},
    "pl": {"ktoś", "coś", "kogoś", "komuś", "czegoś", "czymś", "kimś"},
    "ru": {"кто-либо", "что-либо", "кого-либо", "кому-либо", "чего-либо", "чему-либо", "кем-либо", "чем-либо", "кто-то", "что-то", "кого-то", "кому-то"},
    "uk": {"хтось", "щось", "когось", "комусь", "чогось"},
}
POSS = {
    "en": {"one's", "my", "your", "his", "her", "its", "our", "their", "someone's", "somebody's"},
    "fr": {"mon", "ton", "son", "notre", "votre", "leur", "ma", "ta", "sa", "mes", "tes", "ses", "nos", "vos", "leurs"},
    "es": {"mi", "tu", "su", "mis", "tus", "sus", "nuestro", "nuestra", "vuestro", "vuestra"},
    "it": {"mio", "tuo", "suo", "mia", "tua", "sua", "miei", "tuoi", "suoi", "mie", "tue", "sue", "nostro", "vostro", "loro"},
    "pt": {"meu", "teu", "seu", "minha", "tua", "sua", "nosso", "nossa", "vosso"},
    "de": {"sein", "seine", "seinen", "seinem", "seiner", "mein", "meine", "meinen", "meinem", "dein", "deine", "ihr", "ihre", "ihren", "ihrem", "unser", "euer"},
    "nl": {"zijn", "haar", "mijn", "jouw", "je", "ons", "onze", "hun"},
}
REFL = {
    "en": {"oneself", "myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves"},
    "fr": {"se", "s'", "me", "m'", "te", "t'", "nous", "vous"},
    "es": {"se", "me", "te", "nos", "os"}, "it": {"si", "mi", "ti", "ci", "vi"},
    "pt": {"se", "me", "te", "nos", "vos"}, "de": {"sich", "mich", "dich", "mir", "dir", "uns", "euch"},
}

MARKS = re.compile(r"[֑-ְ֯-ׇً-ٰٟۖ-ۭ]")
WORD = re.compile(r"[\w'\-]+", re.UNICODE)
ALT = re.compile(r"^(alternative|alternate|simplified|traditional|obsolete|archaic|dated|nonstandard|rare|eye dialect|misspelling|abbreviation|initialism|clipping|short) (form|spelling|letter-case form)s? of\b", re.I)


def norm(s):
    s = unicodedata.normalize("NFC", s or "").lower()
    s = s.replace("’", "'").replace("ʼ", "'").replace("`", "'")
    return MARKS.sub("", s).strip()


def tokens(lang, text):
    out = []
    text = norm(text).replace("quelque chose", "quelque_chose")
    for m in WORD.finditer(text):
        tok = m.group(0).strip("-'") if not m.group(0).endswith("'") else m.group(0).lstrip("-'")
        if not tok:
            continue
        for p in ELISION.get(lang, ()):
            if tok.startswith(p) and len(tok) > len(p):
                out.append(p)
                tok = tok[len(p):]
                break
        out.append(tok)
    return out


def canonical(lang, toks):
    res = []
    for t in toks:
        if t in SLOTS.get(lang, ()):
            if res and res[-1] == "*":
                continue
            res.append("*")
        elif t in POSS.get(lang, ()):
            res.append("#poss")
        elif t in REFL.get(lang, ()):
            res.append("#refl")
        else:
            res.append(t)
    return res


WORD_FIELD = re.compile(rb'"word": "((?:[^"\\]|\\.)*)"')


def fetch(name, pos, multi_only=False):
    """Download one kaikki POS file into the cache. With multi_only, the file is
    streamed and only multi-word headwords are kept (verb files run to 300+ MB)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    flat = name.replace(" ", "")
    path = CACHE / f"{flat}-{pos}{'.multi' if multi_only else ''}.jsonl"
    if path.exists():
        return path
    url = "https://kaikki.org/dictionary/{}/pos-{}/kaikki.org-dictionary-{}-by-pos-{}.jsonl".format(
        urllib.parse.quote(name), pos, urllib.parse.quote(flat), pos)
    try:
        with urllib.request.urlopen(url, timeout=120) as r, open(str(path) + ".part", "wb") as f:
            if multi_only:
                for line in r:
                    m = WORD_FIELD.search(line, 0, 4000)
                    if m and b" " in m.group(1):
                        f.write(line)
            else:
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk:
                        break
                    f.write(chunk)
    except Exception as e:
        print(f"  skip {name} {pos}: {e}", file=sys.stderr)
        path.write_bytes(b"")
        return path
    Path(str(path) + ".part").rename(path)
    return path


def kind_of(d):
    pos = d.get("pos")
    cats = []
    for c in d.get("categories") or []:
        cats.append((c.get("name") if isinstance(c, dict) else c) or "")
    for s in d.get("senses") or []:
        for c in s.get("categories") or []:
            cats.append((c.get("name") if isinstance(c, dict) else c) or "")
    tags = {t for s in d.get("senses") or [] for t in s.get("tags") or []}
    low = " ".join(cats).lower()
    if pos == "proverb" or "proverb" in low or "xiehouyu" in low:
        return "proverb"
    if "chengyu" in low or "idiomatic" in tags or "idiom" in low or "yojijukugo" in low or "four-character" in low:
        return "idiom"
    return "phrase"


def reading(d, lang):
    if lang in ("zh", "yue"):
        want = "Jyutping" if lang == "yue" else "Pinyin"
        for s in d.get("sounds") or []:
            tags = s.get("tags") or []
            if s.get("zh_pron") and want in tags and ("Mandarin" in tags or lang == "yue"):
                return s["zh_pron"]
        return ""
    for f in d.get("forms") or []:
        if "romanization" in (f.get("tags") or []):
            return f.get("form", "")
    for s in d.get("sounds") or []:
        if s.get("ipa"):
            return s["ipa"].strip("/[]")
    return ""


def build(code):
    name = LANGS[code]
    phrases, aliases = {}, {}
    # Two very common words ("word is", "need to") make a misleading card more
    # often than a useful one; such pairs are kept only when marked idiomatic.
    ranks = {}
    pack_path = ROOT / "app/assets/dict" / f"{code}.json.gz"
    if pack_path.exists():
        pack = json.load(gzip.open(pack_path))
        for k, e in pack.get("entries", {}).items():
            ranks[k] = e.get("rank") or 10**9
        for f, lemma in pack.get("forms", {}).items():
            ranks.setdefault(f, ranks.get(lemma, 10**9))

    def common(tok):
        return tok.startswith("#") or 0 < ranks.get(tok, 10**9) <= 300
    sources = [(pos, False) for pos in POS]
    if code not in UNSPACED:
        sources += [(pos, True) for pos in MULTI_POS]
    for pos, multi_only in sources:
        path = fetch(name, pos, multi_only)
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    d = json.loads(line)
                except Exception:
                    continue
                word = d.get("word", "")
                if not word or len(word) > 80:
                    continue
                glosses, alt = [], None
                for s in d.get("senses") or []:
                    if s.get("form_of") and "form-of" in (s.get("tags") or []):
                        # "present participle of rain cats and dogs": the inflection
                        # is matched through the lemma, so point at the base phrase.
                        alt = alt or s["form_of"][0].get("word", "")
                        continue
                    for g in s.get("glosses") or []:
                        g = re.sub(r"\s+", " ", g).strip(" ,;:")
                        if not g or g.startswith("Used other than figuratively"):
                            continue
                        if ALT.match(g):
                            for a in s.get("alt_of") or s.get("form_of") or []:
                                alt = alt or a.get("word", "").split(" /")[0].split("/")[0].strip()
                            continue
                        if g not in glosses:
                            glosses.append(g)
                unspaced = code in UNSPACED
                if unspaced:
                    if code in ("zh", "yue") and not re.search(r"[㐀-鿿]", word):
                        continue
                    keys = [norm(word).replace(" ", "")]
                    for fm in d.get("forms") or []:
                        tags = fm.get("tags") or []
                        if "Simplified-Chinese" in tags or "Traditional-Chinese" in tags:
                            keys.append(norm(fm.get("form", "")).replace(" ", ""))
                    keys = [k for k in dict.fromkeys(keys) if len(k) >= 2]
                    toks = None
                else:
                    toks = canonical(code, tokens(code, word))
                    while toks and toks[0] == "*":
                        toks = toks[1:]
                    while toks and toks[-1] == "*":
                        toks = toks[:-1]
                    if len(toks) < 2 or all(t in ("*", "#poss", "#refl") for t in toks):
                        continue
                    if len(toks) == 2 and kind_of(d) == "phrase" and all(common(t) for t in toks):
                        continue
                    keys = [" ".join(toks)]
                if not keys:
                    continue
                if not glosses:
                    if alt:
                        for k in keys:
                            aliases[k] = alt
                    continue
                item = {"w": word, "k": kind_of(d), "g": glosses[:3]}
                tr = reading(d, code)
                if tr:
                    item["tr"] = tr
                if toks:
                    item["t"] = toks
                for k in keys:
                    old = phrases.get(k)
                    if old is None:
                        phrases[k] = item
                    elif old["k"] == "phrase" and item["k"] != "phrase":
                        old["k"] = item["k"]
    for k, target in aliases.items():
        if k in phrases:
            continue
        tkey = norm(target).replace(" ", "") if code in UNSPACED else " ".join(canonical(code, tokens(code, target)))
        if tkey in phrases:
            phrases[k] = dict(phrases[tkey])
            if code not in UNSPACED:
                phrases[k]["t"] = k.split(" ")
    # Dict.java reads the matching rules from the pack so they live in one place.
    meta = {"id": code, "count": len(phrases), "unspaced": code in UNSPACED,
            "elision": ELISION.get(code, []), "slots": sorted(SLOTS.get(code, ())),
            "poss": sorted(POSS.get(code, ())), "refl": sorted(REFL.get(code, ())),
            "sources": ["English Wiktionary via kaikki.org, CC BY-SA 3.0"]}
    raw = json.dumps({"meta": meta, "phrases": phrases}, ensure_ascii=False, separators=(",", ":")).encode()
    OUT.mkdir(parents=True, exist_ok=True)
    with gzip.open(OUT / f"{code}.json.gz", "wb", compresslevel=9) as f:
        f.write(raw)
    kinds = {}
    for v in phrases.values():
        kinds[v["k"]] = kinds.get(v["k"], 0) + 1
    print(f"{code}: {len(phrases)} {kinds} gz={(OUT / f'{code}.json.gz').stat().st_size / 1024:.0f}KB", flush=True)


if __name__ == "__main__":
    for code in (sys.argv[1:] or list(LANGS)):
        build(code)
