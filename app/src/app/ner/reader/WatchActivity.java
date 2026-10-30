package app.ner.reader;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Locale;

public class WatchActivity extends Activity {
    private WebView web;
    private Store store;
    private AdBlock adBlock;
    private Dict dict;
    private TextToSpeech tts;
    private boolean ttsReady;
    private String url;
    private final Runnable watchDog = new Runnable() {
        @Override public void run() {
            if (web == null) return;
            web.evaluateJavascript("!!document.getElementById('ner-watch-host')", value -> {
                if (!"true".equals(value)) inject();
                if (web != null) web.postDelayed(this, 1500);
            });
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new Store(this);
        adBlock = new AdBlock(this);
        dict = new Dict(this);
        new Thread(() -> {
            String learn = "he";
            try {
                org.json.JSONObject st = new org.json.JSONObject(store.load());
                org.json.JSONObject settings = st.optJSONObject("settings");
                if (settings != null) learn = settings.optString("lang", "he");
            } catch (Exception ignored) { }
            dict.preload(learn);
        }).start();
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                tts.setLanguage(new Locale("he", "IL"));
            }
        });
        url = getIntent().getStringExtra("url");
        if (url == null || url.isEmpty()) { finish(); return; }

        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) window.setDecorFitsSystemWindows(false);
        else window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);

        web = new WebView(this);
        web.addJavascriptInterface(new SegBridge(), "NerSeg");
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        if (Build.VERSION.SDK_INT >= 29) s.setForceDark(WebSettings.FORCE_DARK_OFF);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);

        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage m) {
                android.util.Log.d("ShoreshWatch", m.message() + " @" + m.lineNumber());
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame() && adBlock.isBlocked(request.getUrl().toString())) {
                    return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
                }
                return null;
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handle(request.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String u) { return handle(Uri.parse(u)); }
            @Override
            public void onPageFinished(WebView view, String u) {
                inject();
                view.postDelayed(WatchActivity.this::inject, 1200);
            }
        });
        setContentView(wrapWeb(web, Color.BLACK));
        if (Build.VERSION.SDK_INT < 30) {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        } else {
            try { window.getDecorView().getWindowInsetsController().setSystemBarsAppearance(0, 8 | 16); } catch (Exception ignored) { }
        }
        web.loadUrl(url);
        web.postDelayed(watchDog, 2000);
    }

    private boolean handle(Uri uri) {
        if (uri == null) return true;
        if ("ner".equals(uri.getScheme())) {
            String host = uri.getHost();
            if ("close".equals(host)) finish();
            else if ("external".equals(host)) {
                String target = uri.getQueryParameter("url");
                if (target != null) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target))); } catch (Exception ignored) { }
                }
            } else if ("listen".equals(host)) {
                int sec = 5;
                try { sec = Integer.parseInt(uri.getQueryParameter("seconds")); } catch (Exception ignored) { }
                final int n = Math.max(1, Math.min(60, sec));
                new Thread(() -> store.addListening(n)).start();
            } else if ("back".equals(host)) {
                if (web.canGoBack()) web.goBack();
            } else if ("forward".equals(host)) {
                if (web.canGoForward()) web.goForward();
            } else if ("reload".equals(host)) {
                web.reload();
            } else if ("navigate".equals(host)) {
                String target = uri.getQueryParameter("url");
                if (target != null) web.loadUrl(target);
            } else if ("translate".equals(host)) {
                String text = uri.getQueryParameter("text");
                String to = uri.getQueryParameter("to");
                String rid = uri.getQueryParameter("rid");
                new Thread(() -> {
                    String translated = translateText(text == null ? "" : text, to == null ? "en" : to);
                    runOnUiThread(() -> web.evaluateJavascript(
                            "(window.__NerWatch && __NerWatch.translationResult) && __NerWatch.translationResult(" +
                                    JSONObject.quote(rid == null ? "" : rid) + "," +
                                    JSONObject.quote(translated == null ? "" : translated) + ");", null));
                }).start();
            } else if ("brave".equals(host)) {
                String target = uri.getQueryParameter("url");
                openBrave(target == null ? url : target);
            } else if ("lookup".equals(host)) {
                String word = uri.getQueryParameter("word");
                String rid = uri.getQueryParameter("rid");
                String l = uri.getQueryParameter("lang");
                String ctx = uri.getQueryParameter("ctx");
                String off = uri.getQueryParameter("off");
                new Thread(() -> {
                    String ll = l == null ? "he" : l;
                    String w = word == null ? "" : word;
                    String result = ctx == null || ctx.isEmpty() ? dict.lookup(ll, w)
                            : dict.lookupAt(ll, w, ctx, ReaderActivity.parseOffset(off));
                    runOnUiThread(() -> web.evaluateJavascript(
                            "(window.__NerWatch && __NerWatch.lookupResult) && __NerWatch.lookupResult(" +
                                    JSONObject.quote(rid == null ? "" : rid) + "," + result + ");", null));
                }).start();
            } else if ("grade".equals(host)) {
                String l = uri.getQueryParameter("lang");
                String key = uri.getQueryParameter("key");
                String form = uri.getQueryParameter("form");
                String display = uri.getQueryParameter("display");
                String tr = uri.getQueryParameter("tr");
                String pos = uri.getQueryParameter("pos");
                String meaning = uri.getQueryParameter("meaning");
                String meaningBase = uri.getQueryParameter("meaningBase");
                int g = 1;
                try { g = Integer.parseInt(uri.getQueryParameter("grade")); } catch (Exception ignored) { }
                final int grade = g;
                new Thread(() -> {
                    JSONObject w = store.updateWord(l == null ? "he" : l, key == null ? "" : key,
                            form, display, tr, pos, meaning, meaningBase, grade);
                    runOnUiThread(() -> web.evaluateJavascript(
                            "(window.__NerWatch && __NerWatch.gradeResult) && __NerWatch.gradeResult(" +
                                    JSONObject.quote(w == null ? "{}" : w.toString()) + ");", null));
                }).start();
            } else if ("speak".equals(host)) {
                String text = uri.getQueryParameter("text");
                String l = uri.getQueryParameter("lang");
                if (ttsReady && tts != null && text != null) {
                    tts.setLanguage("he".equals(l) ? new Locale("he", "IL") : Locale.forLanguageTag(l == null ? "he" : l));
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ner-watch");
                }
            }
            return true;
        }
        String scheme = uri.getScheme();
        if ("http".equals(scheme) || "https".equals(scheme)) return false;
        if ("intent".equals(scheme) || "youtube".equals(scheme) || "vnd.youtube".equals(scheme)
                || "market".equals(scheme)) return true;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
        return true;
    }

    private void openBrave(String target) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(target));
        i.setPackage("com.brave.browser");
        try { startActivity(i); }
        catch (Exception e) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target))); }
            catch (Exception ignored) { Toast.makeText(this, UiText.t(store, "לא נמצא דפדפן"), Toast.LENGTH_SHORT).show(); }
        }
    }

    private String asset(String path) {
        try (InputStream in = getAssets().open(path)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            return out.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    private String translateText(String text, String to) {
        try {
            URL url = new URL("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl="
                    + URLEncoder.encode(to, "UTF-8") + "&dt=t&q=" + URLEncoder.encode(text, "UTF-8"));
            HttpURLConnection c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(4000);
            c.setReadTimeout(6000);
            int code = c.getResponseCode();
            if (code != 200) return null;
            InputStream in = c.getInputStream();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            in.close();
            JSONArray root = new JSONArray(out.toString("UTF-8"));
            JSONArray parts = root.optJSONArray(0);
            StringBuilder sb = new StringBuilder();
            if (parts != null) {
                for (int i = 0; i < parts.length(); i++) {
                    JSONArray part = parts.optJSONArray(i);
                    if (part != null) sb.append(part.optString(0, ""));
                }
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return null;
        }
    }

    private void inject() {
        String pyJs = asset("www/js/pinyin.js");
        String js = asset("www/js/watch.js");
        String state = store.load();
        String pre = "(function(){var s=document.getElementById('ner-openapp-style');" +
                "if(!s){s=document.createElement('style');s.id='ner-openapp-style';s.textContent=" +
                JSONObject.quote(openAppCss()) + ";document.documentElement.appendChild(s);}" +
                "if(document.getElementById('ner-watch-host'))return false;" +
                "window.__NerWatchLoaded=true;window.__NER_STATE__=" +
                (state == null || state.isEmpty() ? "{}" : state) + ";return true;})();";
        web.evaluateJavascript(pre, value -> {
            if ("true".equals(value)) {
                web.evaluateJavascript(pyJs, null);
                web.evaluateJavascript(js, null);
            }
        });
    }

    private static String openAppCss() {
        return "a[href^='intent:'],a[href^='vnd.youtube:'],a[href^='youtube:'],a[href*='youtube://']," +
                "ytm-app-promo,ytm-app-upsell,.ytm-app-banner,[class*='app-promo'],[class*='open-app']," +
                "ytm-statement-banner-renderer{display:none!important}";
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }

    private android.view.View wrapWeb(WebView w, int bg) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(bg);
        android.view.View top = new android.view.View(this);
        top.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, systemBar("status_bar_height")));
        root.addView(top);
        root.addView(w, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        android.view.View bottom = new android.view.View(this);
        bottom.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, systemBar("navigation_bar_height")));
        root.addView(bottom);
        return root;
    }

    private int systemBar(String name) {
        int id = getResources().getIdentifier(name, "dimen", "android");
        int v = id > 0 ? getResources().getDimensionPixelSize(id) : 0;
        if (v == 0 && name != null && name.contains("status")) {
            v = Math.round(24 * getResources().getDisplayMetrics().density);
        }
        return v;
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.removeCallbacks(watchDog);
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private final class SegBridge {
        @JavascriptInterface
        public String segment(String lang, String text) {
            if (text == null || text.isEmpty()) return "[]";
            if (text.length() > 4000) text = text.substring(0, 4000);
            return dict.segment(lang == null || lang.isEmpty() ? "zh" : lang, text);
        }
    }
}
