package app.ner.reader;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.GZIPInputStream;

/** Small request-level ad/tracker blocker. Not a full browser engine, but blocks known hosts. */
public final class AdBlock {
    private static final String TAG = "NerAdBlock";
    private final Set<String> hosts = new HashSet<>();
    private volatile boolean ready;

    public AdBlock(Context context) {
        new Thread(() -> {
            try (GZIPInputStream gz = new GZIPInputStream(context.getAssets().open("adblock/hosts.txt.gz"));
                 BufferedReader r = new BufferedReader(new InputStreamReader(gz, "UTF-8"))) {
                String line;
                while ((line = r.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty()) hosts.add(line);
                }
                ready = true;
                Log.d(TAG, "Loaded " + hosts.size() + " blocked hosts");
            } catch (Exception e) {
                Log.w(TAG, "Could not load filter list", e);
            }
        }, "ner-adblock-load").start();
    }

    public boolean isBlocked(String url) {
        if (!ready || url == null) return false;
        try {
            Uri u = Uri.parse(url);
            String host = u.getHost();
            if (host == null) return false;
            host = host.toLowerCase();
            if (hosts.contains(host)) return true;
            int dot = host.indexOf('.');
            while (dot >= 0) {
                String parent = host.substring(dot + 1);
                if (hosts.contains(parent)) return true;
                dot = host.indexOf('.', dot + 1);
            }
            String path = u.getPath();
            if (path != null) {
                String p = path.toLowerCase();
                if (p.contains("/ads/") || p.contains("/adserver") || p.contains("/pagead/")) return true;
                if ((host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com"))
                        && (p.contains("/api/stats/ads") || p.contains("/get_midroll") || p.contains("/ptracking") || p.contains("/pagead/"))) {
                    return true;
                }
            }
        } catch (Exception ignored) { }
        return false;
    }
}
