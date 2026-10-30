package app.ner.reader;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Small, atomic, file-backed store for the user's vocabulary and settings. */
public final class Store {
    private static final String TAG = "NerStore";
    private static final String FILE = "state.json";
    private final File file;

    public Store(Context context) {
        this.file = new File(context.getFilesDir(), FILE);
    }

    public synchronized String load() {
        if (!file.exists()) return "{}";
        try (FileInputStream in = new FileInputStream(file)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            String s = out.toString("UTF-8");
            new JSONObject(s);
            return s;
        } catch (Exception e) {
            Log.w(TAG, "Could not read state", e);
            return "{}";
        }
    }

    public synchronized boolean save(String json) {
        try {
            new JSONObject(json);
            File tmp = new File(file.getParentFile(), FILE + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
                out.getFD().sync();
            }
            if (!tmp.renameTo(file)) {
                try (FileOutputStream out = new FileOutputStream(file)) {
                    out.write(json.getBytes(StandardCharsets.UTF_8));
                }
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
            }
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Could not write state", e);
            return false;
        }
    }

    /** Update one word from the page reader, preserving the rest of the state. */
    public synchronized JSONObject updateWord(String lang, String key, String form,
                                              String display, String tr, String pos,
                                              String meaning, String meaningBase, int grade) {
        JSONObject root;
        try {
            root = new JSONObject(load());
        } catch (JSONException e) {
            root = new JSONObject();
        }
        try {
            JSONObject words = root.optJSONObject("words");
            if (words == null) {
                words = new JSONObject();
                root.put("words", words);
            }
            String id = lang + ":" + key;
            JSONObject w = words.optJSONObject(id);
            boolean isNew = w == null;
            if (w == null) w = new JSONObject();
            w.put("lang", lang);
            w.put("key", key);
            w.put("form", form == null || form.isEmpty() ? key : form);
            w.put("display", display == null || display.isEmpty() ? key : display);
            w.put("tr", tr == null ? "" : tr);
            w.put("pos", pos == null ? "" : pos);
            if (meaning != null && !meaning.isEmpty()) w.put("meaning", meaning);
            if (meaningBase != null && !meaningBase.isEmpty()) w.put("meaningBase", meaningBase);
            w.put("grade", grade);
            long now = System.currentTimeMillis();
            if (isNew) w.put("added", now);
            w.put("seen", w.optInt("seen", 0) + 1);
            w.put("lastSeen", now);
            words.put(id, w);

            if (isNew) {
                JSONObject stats = root.optJSONObject("stats");
                if (stats == null) { stats = new JSONObject(); root.put("stats", stats); }
                String day = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                JSONObject d = stats.optJSONObject(day);
                if (d == null) { d = new JSONObject(); stats.put(day, d); }
                d.put("added", d.optInt("added", 0) + 1);
            }
            save(root.toString());
            return w;
        } catch (JSONException e) {
            Log.w(TAG, "Could not update word", e);
            return new JSONObject();
        }
    }

    public synchronized void addRead(int count) {
        if (count <= 0) return;
        try {
            JSONObject root = new JSONObject(load());
            JSONObject stats = root.optJSONObject("stats");
            if (stats == null) { stats = new JSONObject(); root.put("stats", stats); }
            String day = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            JSONObject d = stats.optJSONObject(day);
            if (d == null) { d = new JSONObject(); stats.put(day, d); }
            d.put("read", d.optInt("read", 0) + count);
            root.put("stats", stats);
            save(root.toString());
        } catch (JSONException e) {
            Log.w(TAG, "Could not add read count", e);
        }
    }

    public synchronized void addListening(int seconds) {
        if (seconds <= 0) return;
        try {
            JSONObject root = new JSONObject(load());
            JSONObject stats = root.optJSONObject("stats");
            if (stats == null) { stats = new JSONObject(); root.put("stats", stats); }
            String day = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            JSONObject d = stats.optJSONObject(day);
            if (d == null) { d = new JSONObject(); stats.put(day, d); }
            d.put("listened", d.optInt("listened", 0) + seconds);
            root.put("stats", stats);
            save(root.toString());
        } catch (JSONException e) {
            Log.w(TAG, "Could not add listening time", e);
        }
    }

    public synchronized JSONObject stateObject() {
        try {
            return new JSONObject(load());
        } catch (JSONException e) {
            return new JSONObject();
        }
    }
}
