package app.ner.reader;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ReaderActivity extends Activity {
    private static final String TAG = "NerReader";
    private WebView web;
    private android.view.View rootView;
    private Store store;
    private Dict dict;
    private AdBlock adBlock;
    private LinkSheet sheet;
    private boolean dark;
    private TextToSpeech tts;
    private boolean ttsReady;
    private String url;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new Store(this);
        dict = new Dict(this);
        adBlock = new AdBlock(this);
        io.execute(() -> {
            String learn = "he";
            try {
                JSONObject st = new JSONObject(store.load());
                JSONObject settings = st.optJSONObject("settings");
                if (settings != null) learn = settings.optString("lang", "he");
            } catch (Exception ignored) { }
            dict.preload(learn);
        });
        url = getIntent().getStringExtra("url");
        if (url == null) { finish(); return; }

        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false);
        } else {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }

        web = new WebView(this);
        web.addJavascriptInterface(new SegBridge(), "NerSeg");
        web.setBackgroundColor(Color.rgb(247, 244, 238));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        if (Build.VERSION.SDK_INT >= 29) s.setForceDark(WebSettings.FORCE_DARK_OFF);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handle(request.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String u) {
                return handle(Uri.parse(u));
            }
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame() && adBlock.isBlocked(request.getUrl().toString())) {
                    return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
                }
                return null;
            }
            @Override
            public void onPageFinished(WebView view, String u) {
                inject();
            }
        });
        setContentView(wrapWeb(web, Color.rgb(247, 244, 238)));
        try {
            JSONObject st = new JSONObject(store.load());
            JSONObject settings = st.optJSONObject("settings");
            String theme = settings == null ? "auto" : settings.optString("theme", "auto");
            int mode = getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
            dark = "dark".equals(theme) || ("auto".equals(theme) && mode == android.content.res.Configuration.UI_MODE_NIGHT_YES);
        } catch (Exception ignored) { }
        applyNativeTheme(dark);
        if (Build.VERSION.SDK_INT < 30) {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        } else {
            try {
                window.getDecorView().getWindowInsetsController().setSystemBarsAppearance(8 | 16, 8 | 16);
            } catch (Exception ignored) { }
        }
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) { ttsReady = true; tts.setLanguage(new Locale("he", "IL")); }
        });
        web.loadUrl(url);
    }

    private boolean handle(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme();
        if ("ner".equals(scheme)) {
            handleNer(uri);
            return true;
        }
        if ("http".equals(scheme) || "https".equals(scheme)) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
        return true;
    }

    private void handleNer(Uri uri) {
        String host = uri.getHost();
        if (host == null) return;
        switch (host) {
            case "lookup": {
                String lang = uri.getQueryParameter("lang");
                String word = uri.getQueryParameter("word");
                String rid = uri.getQueryParameter("rid");
                String ctx = uri.getQueryParameter("ctx");
                String off = uri.getQueryParameter("off");
                io.execute(() -> {
                    String l = lang == null ? "he" : lang;
                    String w = word == null ? "" : word;
                    String result = ctx == null || ctx.isEmpty() ? dict.lookup(l, w)
                            : dict.lookupAt(l, w, ctx, parseOffset(off));
                    main.post(() -> eval("(window.__NerReader && __NerReader.lookupResult) && __NerReader.lookupResult(" +
                            JSONObject.quote(rid == null ? "" : rid) + "," + result + ");"));
                });
                break;
            }
            case "grade": {
                String lang = uri.getQueryParameter("lang");
                String key = uri.getQueryParameter("key");
                String form = uri.getQueryParameter("form");
                String display = uri.getQueryParameter("display");
                String tr = uri.getQueryParameter("tr");
                String pos = uri.getQueryParameter("pos");
                String meaning = uri.getQueryParameter("meaning");
                String meaningBase = uri.getQueryParameter("meaningBase");
                String g = uri.getQueryParameter("grade");
                int grade = 0;
                try { grade = Integer.parseInt(g == null ? "0" : g); } catch (Exception ignored) { }
                final int fg = grade;
                io.execute(() -> {
                    JSONObject w = store.updateWord(lang == null ? "he" : lang, key == null ? "" : key,
                            form, display, tr, pos, meaning, meaningBase, fg);
                    main.post(() -> eval("(window.__NerReader && __NerReader.gradeResult) && __NerReader.gradeResult(" +
                            JSONObject.quote(w == null ? "{}" : w.toString()) + ");"));
                });
                break;
            }
            case "read": {
                String c = uri.getQueryParameter("count");
                int count = 0;
                try { count = Integer.parseInt(c == null ? "0" : c); } catch (Exception ignored) { }
                final int fc = count;
                io.execute(() -> store.addRead(fc));
                break;
            }
            case "speak": {
                String text = uri.getQueryParameter("text");
                String lang = uri.getQueryParameter("lang");
                if (ttsReady && tts != null && text != null) {
                    tts.setLanguage("he".equals(lang) ? new Locale("he", "IL") : Locale.forLanguageTag(lang == null ? "he" : lang));
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ner-reader");
                }
                break;
            }
            case "close":
                finish();
                break;
            case "external": {
                String target = uri.getQueryParameter("url");
                if (target != null) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target))); }
                    catch (Exception ignored) { }
                }
                break;
            }
            case "sheet":
                if (sheet != null) sheet.dismiss();
                sheet = LinkSheet.open(this, store, adBlock, dark, uri.getQueryParameter("url"));
                break;
            case "toast": {
                String msg = uri.getQueryParameter("msg");
                Toast.makeText(this, msg == null ? "" : msg, Toast.LENGTH_SHORT).show();
                break;
            }
            default:
                break;
        }
    }

    private String asset(String path) {
        try (InputStream in = getAssets().open(path)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            return out.toString("UTF-8");
        } catch (Exception e) {
            Log.w(TAG, "Missing asset " + path, e);
            return "";
        }
    }

    private void inject() {
        String css = asset("www/css/inject.css");
        String pyJs = asset("www/js/pinyin.js");
        String linksJs = asset("www/js/dictlinks.js");
        String js = asset("www/js/inject.js");
        String state = store.load();
        String pre = "(function(){" +
                "var s=" + (state == null || state.isEmpty() ? "{}" : state) + ";" +
                "if(window.__NerReaderLoaded){ if(window.__NerReader) __NerReader.refresh(s); return false; }" +
                "window.__NerReaderLoaded=true;" +
                "window.__NER_STATE__=s;" +
                "var st=document.createElement('style'); st.id='ner-inject-css'; st.textContent=" + JSONObject.quote(css) + "; document.documentElement.appendChild(st);" +
                "return true;" +
                "})();";
        web.evaluateJavascript(pre, value -> {
            if ("true".equals(value)) web.evaluateJavascript(pyJs, v2 ->
                    web.evaluateJavascript(linksJs, v3 -> web.evaluateJavascript(js, null)));
        });
    }

    static int parseOffset(String s) {
        try { return s == null ? 0 : Integer.parseInt(s); } catch (NumberFormatException e) { return 0; }
    }

    private void eval(String script) { if (web != null) web.evaluateJavascript(script, null); }

    private final class SegBridge {
        @JavascriptInterface
        public String segment(String lang, String text) {
            if (text == null || text.isEmpty()) return "[]";
            if (text.length() > 4000) text = text.substring(0, 4000);
            return dict.segment(lang == null || lang.isEmpty() ? "zh" : lang, text);
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }

    private android.view.View wrapWeb(WebView w, int bg) {
        LinearLayout root = new LinearLayout(this);
        this.rootView = root;
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

    private void applyNativeTheme(boolean dark) {
        int bg = dark ? 0xFF111614 : 0xFFF7F4EE;
        if (rootView != null) rootView.setBackgroundColor(bg);
        Window w = getWindow();
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(bg);
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                w.getDecorView().getWindowInsetsController().setSystemBarsAppearance(dark ? 0 : (8 | 16), 8 | 16);
            } catch (Exception ignored) { }
        } else {
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            if (!dark) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(flags);
        }
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
        if (sheet != null) sheet.dismiss();
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (web != null) web.destroy();
        io.shutdownNow();
        super.onDestroy();
    }
}
