package app.ner.reader;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String TAG = "NerMain";
    private static final int REQ_OPEN_TEXT = 11;
    private static final int REQ_EXPORT = 12;
    private static final int REQ_IMPORT = 13;

    private WebView web;
    private android.view.View rootView;
    private Store store;
    private Dict dict;
    private AdBlock adBlock;
    private LinkSheet sheet;
    private boolean dark;
    private SyncServer syncServer;
    private TextToSpeech tts;
    private boolean ttsReady;
    private String pendingExport;
    private String pendingShare;
    private String pendingImport;
    private BookServer bookServer;
    private long lastBackAt;
    private boolean firstResume = true;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    // Word counts for whole books take seconds; they must not hold up translation or OCR.
    private final ExecutorService statsRunner = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new Store(this);
        dict = new Dict(this);
        adBlock = new AdBlock(this);
        syncServer = new SyncServer(store, json -> {
            if (web != null) main.post(() -> web.evaluateJavascript(
                    "window.NerApp && NerApp.onSyncPushed && NerApp.onSyncPushed();", null));
        });
        io.execute(() -> {
            String learn = "he";
            try {
                JSONObject settings = new JSONObject(store.load()).optJSONObject("settings");
                if (settings != null) learn = settings.optString("lang", "he");
            } catch (Exception ignored) { }
            dict.preload(learn);
        });

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
        web.setBackgroundColor(Color.rgb(247, 244, 238));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= 29) {
            s.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);

        web.addJavascriptInterface(new Bridge(), "Ner");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl().toString());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(url);
            }
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame() && adBlock.isBlocked(request.getUrl().toString())) {
                    return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
                }
                return null;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                flushPendingShare();
                flushPendingImport();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage msg) {
                Log.d(TAG, msg.message() + " @" + msg.sourceId() + ":" + msg.lineNumber());
                return true;
            }
        });

        setContentView(wrapWeb(web, Color.rgb(247, 244, 238)));
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
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                tts.setLanguage(new Locale("he", "IL"));
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) { }
                    @Override public void onDone(String utteranceId) {
                        main.post(() -> callJs("NerApp.onSpeakDone", utteranceId == null ? "" : utteranceId));
                    }
                    @Override public void onError(String utteranceId) {
                        main.post(() -> callJs("NerApp.onSpeakFail", utteranceId == null ? "" : utteranceId));
                    }
                    @Override public void onStop(String utteranceId, boolean interrupted) {
                        main.post(() -> callJs("NerApp.onSpeakStop", utteranceId == null ? "" : utteranceId));
                    }
                });
            }
        });

        web.loadUrl("file:///android_asset/www/index.html");
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            CharSequence selected = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            if (selected != null && selected.toString().trim().length() > 0) {
                queueShare("selection", selected.toString().trim(), null);
            }
            return;
        }
        if (Intent.ACTION_SEND.equals(action)) {
            Uri stream = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (stream == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
                stream = intent.getClipData().getItemAt(0).getUri();
            }
            if (stream != null) {
                Intent data = new Intent();
                data.setData(stream);
                onActivityResult(REQ_OPEN_TEXT, RESULT_OK, data);
                return;
            }
            CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (text != null && text.toString().trim().length() > 0) {
                String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);
                queueShare("text", text.toString().trim(), title);
            }
            return;
        }
        if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
            Intent data = new Intent();
            data.setData(intent.getData());
            onActivityResult(REQ_OPEN_TEXT, RESULT_OK, data);
        }
    }

    private void queueShare(String kind, String text, String title) {
        try {
            JSONObject o = new JSONObject();
            o.put("kind", kind);
            o.put("text", text);
            if (title != null && !title.isEmpty()) o.put("title", title);
            pendingShare = o.toString();
            flushPendingShare();
        } catch (Exception ignored) { }
    }

    private void flushPendingShare() {
        if (pendingShare == null || web == null) return;
        final String json = pendingShare;
        web.evaluateJavascript("(window.NerApp && typeof NerApp.onShare === 'function')", value -> {
            if ("true".equals(value)) {
                pendingShare = null;
                callJs("NerApp.onShare", json);
            }
        });
    }

    private void queueImport(String json) {
        pendingImport = json;
        flushPendingImport();
    }

    private void flushPendingImport() {
        if (pendingImport == null || web == null) return;
        final String json = pendingImport;
        web.evaluateJavascript("(window.NerApp && typeof NerApp.onFile === 'function')", value -> {
            if ("true".equals(value)) {
                pendingImport = null;
                callJs("NerApp.onFile", json);
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (firstResume) { firstResume = false; return; }
        if (web != null) {
            web.evaluateJavascript("window.NerApp && NerApp.refreshFromStore && NerApp.refreshFromStore();", null);
        }
    }

    private boolean handleUrl(String url) {
        if (url == null) return true;
        if (url.startsWith("file:///android_asset/")) return false;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            Intent i = new Intent(this, ReaderActivity.class);
            i.putExtra("url", url);
            startActivity(i);
            return true;
        }
        if (url.startsWith("mailto:") || url.startsWith("tel:")) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) { }
            return true;
        }
        return true;
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.NerApp && NerApp.back) ? NerApp.back() : false", value -> {
            if ("true".equals(value)) return;
            long now = System.currentTimeMillis();
            if (now - lastBackAt < 2200) {
                finish();
            } else {
                lastBackAt = now;
                Toast.makeText(this, UiText.t(store, "לחצו שוב כדי לצאת"), Toast.LENGTH_SHORT).show();
            }
        });
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
        this.dark = dark;
        int bg = dark ? 0xFF111614 : 0xFFF7F4EE;
        if (rootView != null) rootView.setBackgroundColor(bg);
        Window w = getWindow();
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(bg);
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                w.getDecorView().getWindowInsetsController().setSystemBarsAppearance(
                        dark ? 0 : (8 | 16), 8 | 16);
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
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (sheet != null) sheet.dismiss();
        if (syncServer != null) syncServer.stop();
        if (bookServer != null) bookServer.stop();
        if (web != null) web.destroy();
        io.shutdownNow();
        statsRunner.shutdownNow();
        super.onDestroy();
    }

    private void openTextPicker() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        startActivityForResult(i, REQ_OPEN_TEXT);
    }

    private void exportAnki(String tsv) {
        pendingExport = tsv;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("text/tab-separated-values");
        String day = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        i.putExtra(Intent.EXTRA_TITLE, "ner-anki-" + day + ".tsv");
        startActivityForResult(i, REQ_EXPORT);
    }

    private void exportBackup(String json) {
        pendingExport = json;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("application/json");
        String day = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        i.putExtra(Intent.EXTRA_TITLE, "ner-backup-" + day + ".json");
        startActivityForResult(i, REQ_EXPORT);
    }

    private void importBackup() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("application/json");
        startActivityForResult(i, REQ_IMPORT);
    }

    private String bookKind(Uri uri, String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".epub")) return "epub";
        if (lower.endsWith(".pdf")) return "pdf";
        if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".text")) return "txt";
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return "txt";
            byte[] b = new byte[5];
            int n = in.read(b);
            if (n >= 4 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F') return "pdf";
            if (n >= 2 && b[0] == 'P' && b[1] == 'K') return "epub";
        } catch (Exception ignored) { }
        return "txt";
    }

    private File booksDir() {
        File dir = new File(getFilesDir(), "books");
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    private String newBookId() {
        return "b" + System.currentTimeMillis() + "-" + Integer.toHexString((int) (Math.random() * 0xffff));
    }

    private String copyUriToBook(Uri uri, String id) throws Exception {
        File target = new File(booksDir(), id + ".txt");
        try (InputStream in = getContentResolver().openInputStream(uri);
             java.io.FileOutputStream out = new java.io.FileOutputStream(target)) {
            if (in == null) throw new Exception("no stream");
            byte[] buf = new byte[32768];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        }
        return id;
    }

    private String writeTextBook(String text, String id) throws Exception {
        File target = new File(booksDir(), id + ".txt");
        try (java.io.FileOutputStream out = new java.io.FileOutputStream(target)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
        return id;
    }

    private String readBookJson(String id, long offset, int maxBytes) {
        try {
            if (id == null || !id.matches("[A-Za-z0-9_-]{1,80}")) throw new Exception("bad id");
            File f = new File(booksDir(), id + ".txt");
            if (!f.isFile()) throw new Exception("missing");
            long total = f.length();
            long off = Math.max(0, Math.min(offset, total));
            int cap = Math.max(4096, Math.min(maxBytes, 512 * 1024));
            int want = (int) Math.min(cap, total - off);
            byte[] buf = new byte[Math.max(1, want)];
            int n;
            try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(f, "r")) {
                raf.seek(off);
                n = raf.read(buf);
            }
            if (n < 0) n = 0;
            // Do not cut a multibyte UTF-8 sequence.
            int end = n;
            int start = end;
            while (start > 0 && (buf[start - 1] & 0xC0) == 0x80) start--;
            if (start > 0) {
                int lead = buf[start - 1] & 0xFF;
                int need = lead < 0x80 ? 1 : lead >= 0xF0 ? 4 : lead >= 0xE0 ? 3 : lead >= 0xC0 ? 2 : 1;
                if (end - (start - 1) < need) end = start - 1;
            }
            String text = new String(buf, 0, Math.max(0, end), StandardCharsets.UTF_8);
            long prev = Math.max(0, off - cap);
            if (prev > 0) {
                try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(f, "r")) {
                    raf.seek(prev);
                    int b;
                    while (prev < off && (b = raf.read()) != -1) {
                        if ((b & 0xC0) != 0x80) break;
                        prev++;
                    }
                }
            }
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("text", text);
            o.put("offset", off);
            o.put("prev", prev);
            o.put("next", off + Math.max(0, end));
            o.put("total", total);
            o.put("done", off + Math.max(0, end) >= total);
            return o.toString();
        } catch (Exception e) {
            return "{\"ok\":false}";
        }
    }

    private byte[] readBytes(Uri uri, int limit) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new Exception("לא ניתן לפתוח את הקובץ");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n, total = 0;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > limit) throw new Exception("הקובץ גדול מדי");
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private String readUri(Uri uri, int limit) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new Exception("לא ניתן לפתוח את הקובץ");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n, total = 0;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > limit) throw new Exception("הקובץ גדול מדי");
                out.write(buf, 0, n);
            }
            return out.toString("UTF-8");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        if (requestCode == REQ_EXPORT) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out != null && pendingExport != null) out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, UiText.t(store, "הגיבוי נשמר"), Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, UiText.t(store, "שמירת הגיבוי נכשלה"), Toast.LENGTH_SHORT).show();
            }
            pendingExport = null;
            return;
        }
        io.execute(() -> {
            try {
                Uri uri = data.getData();
                String name = UiText.t(store, "מסמך");
                try {
                    android.database.Cursor c = getContentResolver().query(uri, null, null, null, null);
                    if (c != null) {
                        int idx = c.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                        if (idx >= 0 && c.moveToFirst()) name = c.getString(idx);
                        c.close();
                    }
                } catch (Exception ignored) { }
                if (name == null || name.isEmpty() || UiText.t(store, "מסמך").equals(name)) {
                    String last = uri.getLastPathSegment();
                    if (last != null && !last.isEmpty()) name = last;
                }
                final String fileName = name;
                if (requestCode == REQ_IMPORT) {
                    String json = readUri(uri, 12 * 1024 * 1024);
                    new JSONObject(json);
                    main.post(() -> callJs("NerApp.onBackup", json));
                } else {
                    String text = "";
                    String bookTitle = null;
                    String pdfBase64 = null;
                    String bookId = null;
                    String pdfId = null;
                    long bookBytes = 0;
                    JSONArray chapterArray = null;
                    String kind = bookKind(uri, fileName);
                    if ("epub".equals(kind)) {
                        Epub.Result book = Epub.extract(MainActivity.this, uri);
                        bookTitle = book.title;
                        text = book.text;
                        bookBytes = text.getBytes(StandardCharsets.UTF_8).length;
                        chapterArray = new JSONArray();
                        int prevChar = 0;
                        long byteOffset = 0;
                        for (Epub.Chapter ch : book.chapters) {
                            int cOff = Math.max(prevChar, Math.min(ch.offset, text.length()));
                            byteOffset += text.substring(prevChar, cOff).getBytes(StandardCharsets.UTF_8).length;
                            prevChar = cOff;
                            JSONObject chapterObj = new JSONObject();
                            chapterObj.put("title", ch.title);
                            chapterObj.put("offset", byteOffset);
                            chapterArray.put(chapterObj);
                        }
                        if (text.length() > 1500000 || bookBytes > 4 * 1024 * 1024) {
                            bookId = newBookId();
                            writeTextBook(text, bookId);
                            text = "";
                        }
                    } else if ("pdf".equals(kind)) {
                        pdfId = newBookId();
                        File target = new File(booksDir(), pdfId + ".pdf");
                        try (InputStream in = getContentResolver().openInputStream(uri);
                             java.io.FileOutputStream out = new java.io.FileOutputStream(target)) {
                            if (in == null) throw new Exception("no stream");
                            byte[] buf = new byte[65536];
                            int n;
                            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                        }
                        if (bookServer == null) bookServer = new BookServer();
                        pdfBase64 = bookServer.register(target);
                        bookBytes = target.length();
                    } else if ("txt".equals(kind)) {
                        long size = 0;
                        try (android.content.res.AssetFileDescriptor afd = getContentResolver().openAssetFileDescriptor(uri, "r")) {
                            if (afd != null) size = afd.getLength();
                        } catch (Exception ignored) { }
                        if (size > 2 * 1024 * 1024 || size <= 0) {
                            bookId = newBookId();
                            copyUriToBook(uri, bookId);
                            bookBytes = new File(booksDir(), bookId + ".txt").length();
                        } else {
                            text = readUri(uri, 8 * 1024 * 1024);
                        }
                    } else {
                        text = readUri(uri, 8 * 1024 * 1024);
                    }
                    final String finalTitle = bookTitle;
                    final String finalText = text;
                    final String finalPdf = pdfBase64;
                    final String finalBookId = bookId;
                    final String finalPdfId = pdfId;
                    final long finalBookBytes = bookBytes;
                    final JSONArray finalChapters = chapterArray;
                    main.post(() -> {
                        try {
                            JSONObject payload = new JSONObject();
                            payload.put("name", fileName);
                            if (finalTitle != null) payload.put("title", finalTitle);
                            if (finalChapters != null) payload.put("chapters", finalChapters);
                            if (finalBookId != null) {
                                payload.put("bookId", finalBookId);
                                payload.put("stream", true);
                                payload.put("bytes", finalBookBytes);
                            } else if (finalPdf != null) {
                                payload.put("mime", "application/pdf");
                                payload.put("pdfUrl", finalPdf);
                                payload.put("pdfId", finalPdfId);
                                payload.put("bytes", finalBookBytes);
                            } else payload.put("text", finalText);
                            queueImport(payload.toString());
                        } catch (Exception ignored) { }
                    });
                }
            } catch (Exception e) {
                String msg = e.getMessage();
                if (msg == null || msg.isEmpty()) msg = "לא ניתן לקרוא את הקובץ";
                final String shown = UiText.t(store, msg);
                main.post(() -> Toast.makeText(this, shown, Toast.LENGTH_LONG).show());
            }
        });
    }

    // NerApp.onOcrResult(rid, json): OCR answers carry the request id first.
    private void ocrDone(String rid, String json) {
        main.post(() -> web.evaluateJavascript("window.NerApp && NerApp.onOcrResult(" +
                JSONObject.quote(rid) + "," + JSONObject.quote(json) + ");", null));
    }

    private static final int STATS_CAP = 2 * 1024 * 1024;

    /**
     * vocabStats for a shelf item: a streamed book's file or the article's inline
     * text from state, cut at STATS_CAP (bytes of a file, characters of inline text)
     * so a huge book stays a few seconds' work. "capped" says it was cut.
     */
    private JSONObject vocabStatsFor(String lang, String id, String knownJson) throws Exception {
        JSONArray articles = store.stateObject().optJSONArray("articles");
        JSONObject a = null;
        for (int i = 0; articles != null && i < articles.length() && a == null; i++) {
            JSONObject x = articles.optJSONObject(i);
            if (x != null && id.equals(x.optString("id"))) a = x;
        }
        if (a == null) throw new Exception("missing");
        String bookId = a.optString("bookId");
        String text;
        boolean capped;
        if (a.optBoolean("stream") && bookId.matches("[A-Za-z0-9_-]{1,80}")) {
            File f = new File(booksDir(), bookId + ".txt");
            byte[] buf = new byte[(int) Math.min(f.length(), STATS_CAP)];
            try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(f, "r")) { raf.readFully(buf); }
            text = new String(buf, StandardCharsets.UTF_8);
            capped = f.length() > STATS_CAP;
        } else {
            text = a.optString("text");
            capped = text.length() > STATS_CAP;
            if (capped) text = text.substring(0, STATS_CAP);
        }
        return dict.vocabStats(lang, text, new JSONObject(knownJson)).put("capped", capped);
    }

    private void callJs(String fn, String json) {
        String script = "window." + fn + " && " + fn + "(" + JSONObject.quote(json) + ");";
        web.evaluateJavascript(script, null);
    }

    private String httpGet(String ip, int port, String token) {
        try {
            URL url = new URL("http://" + ip + ":" + port + "/state?token=" + token);
            HttpURLConnection c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(4000);
            c.setReadTimeout(6000);
            c.setRequestMethod("GET");
            int code = c.getResponseCode();
            InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
            if (in == null) return "{\"ok\":false,\"error\":\"no response\"}";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            in.close();
            if (code != 200) return "{\"ok\":false,\"error\":\"HTTP " + code + "\"}";
            return out.toString("UTF-8");
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":" + JSONObject.quote(e.getMessage() == null ? "network" : e.getMessage()) + "}";
        }
    }

    private String httpPost(String ip, int port, String token, String body) {
        try {
            URL url = new URL("http://" + ip + ":" + port + "/state?token=" + token);
            HttpURLConnection c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(4000);
            c.setReadTimeout(6000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] data = body.getBytes(StandardCharsets.UTF_8);
            c.setFixedLengthStreamingMode(data.length);
            try (OutputStream out = c.getOutputStream()) { out.write(data); }
            int code = c.getResponseCode();
            InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
            if (in == null) return "{\"ok\":false,\"error\":\"no response\"}";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            in.close();
            if (code != 200) return "{\"ok\":false,\"error\":\"HTTP " + code + "\"}";
            return out.toString("UTF-8");
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":" + JSONObject.quote(e.getMessage() == null ? "network" : e.getMessage()) + "}";
        }
    }

    private final class Bridge {
        @JavascriptInterface
        public String bootstrap() {
            try {
                JSONObject o = new JSONObject();
                o.put("state", new JSONObject(store.load()));
                o.put("version", "1.6.2");
                o.put("platform", "android");
                return o.toString();
            } catch (Exception e) {
                return "{\"state\":{},\"version\":\"1.6.2\",\"platform\":\"android\"}";
            }
        }

        @JavascriptInterface
        public String state() { return store.load(); }

        @JavascriptInterface
        public boolean saveState(String json) { UiText.reset(); return store.save(json); }

        @JavascriptInterface
        public String lookup(String lang, String word) { return dict.lookup(lang, word); }

        @JavascriptInterface
        public String lookupAt(String lang, String word, String text, int offset) {
            return dict.lookupAt(lang, word, text == null ? "" : text, offset);
        }

        @JavascriptInterface
        public String segment(String lang, String text) { return dict.segment(lang, text); }

        /** Word counts for a shelf item, off the UI thread; answers NerApp.onVocabStats(id, json). */
        @JavascriptInterface
        public void vocabStats(String lang, String id, String knownJson) {
            statsRunner.execute(() -> {
                String out;
                try {
                    out = vocabStatsFor(lang, id, knownJson).put("ok", true).toString();
                } catch (Throwable e) {
                    Log.w(TAG, "vocabStats failed for " + id, e);
                    out = "{\"ok\":false}";
                }
                final String json = out;
                main.post(() -> {
                    if (!isDestroyed()) web.evaluateJavascript("window.NerApp && NerApp.onVocabStats(" +
                            JSONObject.quote(id) + "," + JSONObject.quote(json) + ");", null);
                });
            });
        }

        @JavascriptInterface
        public void ocrBook(String id, String lang, String rid) {
            io.execute(() -> {
                try {
                    File f = new File(booksDir(), id + ".pdf");
                    if (!f.isFile()) throw new Exception("missing");
                    String text = Ocr.ocrFile(MainActivity.this, f, lang, 80);
                    JSONObject o = new JSONObject();
                    o.put("ok", true); o.put("text", text);
                    ocrDone(rid, o.toString());
                } catch (Exception e) {
                    ocrDone(rid, "{\"ok\":false}");
                }
            });
        }

        @JavascriptInterface
        public String bookStats() {
            try {
                JSONObject o = new JSONObject();
                JSONObject files = new JSONObject();
                long bytes = 0;
                int count = 0;
                File[] list = booksDir().listFiles();
                if (list != null) {
                    for (File f : list) {
                        String n = f.getName();
                        if (!n.endsWith(".txt") && !n.endsWith(".pdf")) continue;
                        String id = n.substring(0, n.lastIndexOf('.'));
                        files.put(id, f.length());
                        bytes += f.length();
                        count++;
                    }
                }
                o.put("ok", true);
                o.put("count", count);
                o.put("bytes", bytes);
                o.put("files", files);
                return o.toString();
            } catch (Exception e) {
                return "{\"ok\":false}";
            }
        }

        @JavascriptInterface
        public boolean deleteBook(String id) {
            try {
                if (id == null || !id.matches("[A-Za-z0-9_-]{1,80}")) return false;
                new File(booksDir(), id + ".txt").delete();
                new File(booksDir(), id + ".pdf").delete();
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface
        public int cleanupBooks(String keepJson) {
            int removed = 0;
            try {
                JSONArray keep = new JSONArray(keepJson == null ? "[]" : keepJson);
                java.util.HashSet<String> ids = new java.util.HashSet<>();
                for (int i = 0; i < keep.length(); i++) ids.add(keep.optString(i, ""));
                File[] list = booksDir().listFiles();
                if (list != null) {
                    for (File f : list) {
                        String n = f.getName();
                        if (!n.endsWith(".txt") && !n.endsWith(".pdf")) continue;
                        String id = n.substring(0, n.lastIndexOf('.'));
                        if (!ids.contains(id) && f.delete()) removed++;
                    }
                }
            } catch (Exception ignored) { }
            return removed;
        }

        @JavascriptInterface
        public String readBook(String id, long offset, int maxBytes) {
            return readBookJson(id, offset, maxBytes);
        }

        @JavascriptInterface
        public void speak(String text, String lang) { speakAs(text, lang, "word"); }

        @JavascriptInterface
        public void speakAs(String text, String lang, String mark) {
            if (text == null || text.trim().isEmpty()) return;
            final String rawMark = mark == null ? "" : mark;
            final String utterance = rawMark.startsWith("read")
                    ? rawMark.replaceAll("[^A-Za-z0-9_-]", "")
                    : "word";
            final String spoken = text.length() > 500 ? text.substring(0, 500) : text;
            final String voice = lang == null ? "en" : lang;
            runOnUiThread(() -> {
                if (!ttsReady || tts == null) {
                    Toast.makeText(MainActivity.this, UiText.t(store, "ההקראה עוד לא מוכנה"), Toast.LENGTH_SHORT).show();
                    if (utterance.startsWith("read")) callJs("NerApp.onSpeakFail", utterance);
                    return;
                }
                tts.setLanguage("he".equals(voice) ? new Locale("he", "IL") : Locale.forLanguageTag(voice));
                tts.speak(spoken, TextToSpeech.QUEUE_FLUSH, null, utterance);
            });
        }

        @JavascriptInterface
        public void stopSpeak() { if (tts != null) tts.stop(); }

        @JavascriptInterface
        public void openFile() { runOnUiThread(MainActivity.this::openTextPicker); }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    Intent i = new Intent(MainActivity.this, ReaderActivity.class);
                    i.putExtra("url", url);
                    startActivity(i);
                }
            });
        }

        @JavascriptInterface
        public void openWatch(String url) {
            runOnUiThread(() -> {
                if (url == null || url.isEmpty()) return;
                Intent i = new Intent(MainActivity.this, WatchActivity.class);
                i.putExtra("url", url);
                startActivity(i);
            });
        }

        @JavascriptInterface
        public void openBrave(String url) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                i.setPackage("com.brave.browser");
                try { startActivity(i); }
                catch (Exception e) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
                    catch (Exception ignored) { Toast.makeText(MainActivity.this, UiText.t(store, "Brave לא מותקן במכשיר"), Toast.LENGTH_SHORT).show(); }
                }
            });
        }

        @JavascriptInterface
        public void openExternal(String url) {
            runOnUiThread(() -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
                catch (Exception e) { Toast.makeText(MainActivity.this, UiText.t(store, "לא ניתן לפתוח"), Toast.LENGTH_SHORT).show(); }
            });
        }

        /** A dictionary or other link in a sheet over the app. */
        @JavascriptInterface
        public void openSheet(String url) {
            runOnUiThread(() -> {
                if (sheet != null) sheet.dismiss();
                sheet = LinkSheet.open(MainActivity.this, store, adBlock, dark, url);
            });
        }

        @JavascriptInterface
        public String startSync() {
            try {
                return syncServer.start().toString();
            } catch (Exception e) {
                try {
                    JSONObject o = new JSONObject();
                    o.put("running", false);
                    o.put("error", e.getMessage() == null ? "sync" : e.getMessage());
                    return o.toString();
                } catch (Exception ignored) { return "{\"running\":false}"; }
            }
        }

        @JavascriptInterface
        public void stopSync() { if (syncServer != null) syncServer.stop(); }

        @JavascriptInterface
        public void syncGet(String ip, int port, String token, String rid) {
            io.execute(() -> {
                String r = httpGet(ip, port, token);
                main.post(() -> web.evaluateJavascript("window.NerApp && NerApp.onSyncPayload(" +
                        JSONObject.quote(rid) + "," + JSONObject.quote(r) + ");", null));
            });
        }

        @JavascriptInterface
        public void syncPush(String ip, int port, String token, String body, String rid) {
            io.execute(() -> {
                String r = httpPost(ip, port, token, body);
                main.post(() -> web.evaluateJavascript("window.NerApp && NerApp.onSyncPayload(" +
                        JSONObject.quote(rid) + "," + JSONObject.quote(r) + ");", null));
            });
        }

        @JavascriptInterface
        public void translate(String text, String to, String rid) { translateFrom(text, "en", to, rid); }

        /** Machine translation from a given source language ("auto" detects it). */
        @JavascriptInterface
        public void translateFrom(String text, String from, String to, String rid) {
            io.execute(() -> {
                String result = "{\"ok\":false}";
                try {
                    String q = URLEncoder.encode(text == null ? "" : text, "UTF-8");
                    String sl = from == null || !from.matches("[a-z]{2,3}|auto") ? "en" : from;
                    URL url = new URL("https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sl + "&tl="
                            + URLEncoder.encode(to == null ? "en" : to, "UTF-8") + "&dt=t&q=" + q);
                    HttpURLConnection c = (HttpURLConnection) url.openConnection();
                    c.setConnectTimeout(4000);
                    c.setReadTimeout(8000);
                    c.setRequestProperty("User-Agent", "Shoresh/1.6.2");
                    int code = c.getResponseCode();
                    if (code == 200) {
                        InputStream in = c.getInputStream();
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192]; int n;
                        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                        in.close();
                        org.json.JSONArray root = new org.json.JSONArray(out.toString("UTF-8"));
                        org.json.JSONArray sentences = root.optJSONArray(0);
                        StringBuilder sb = new StringBuilder();
                        if (sentences != null) {
                            for (int i = 0; i < sentences.length(); i++) {
                                org.json.JSONArray part = sentences.optJSONArray(i);
                                if (part != null) sb.append(part.optString(0, ""));
                            }
                        }
                        String translated = sb.toString().trim();
                        if (!translated.isEmpty()) {
                            JSONObject o = new JSONObject();
                            o.put("ok", true);
                            o.put("text", translated);
                            result = o.toString();
                        }
                    }
                } catch (Exception ignored) { }
                final String payload = result;
                main.post(() -> web.evaluateJavascript("window.NerApp && NerApp.onTranslateResult(" +
                        JSONObject.quote(rid) + "," + JSONObject.quote(payload) + ");", null));
            });
        }

        @JavascriptInterface
        public void ocrPdf(String base64, String lang, String rid) {
            io.execute(() -> {
                try {
                    byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                    String text = Ocr.ocrPdf(MainActivity.this, bytes, lang, 80);
                    JSONObject o = new JSONObject();
                    o.put("ok", true);
                    o.put("text", text);
                    ocrDone(rid, o.toString());
                } catch (Exception e) {
                    try {
                        JSONObject o = new JSONObject();
                        o.put("ok", false);
                        o.put("error", e.getMessage() == null ? "OCR failed" : e.getMessage());
                        ocrDone(rid, o.toString());
                    } catch (Exception ignored) { }
                }
            });
        }

        @JavascriptInterface
        public void setTheme(boolean dark) { runOnUiThread(() -> applyNativeTheme(dark)); }

        @JavascriptInterface
        public void setTtsRate(float rate) {
            if (tts != null) tts.setSpeechRate(Math.max(0.5f, Math.min(1.5f, rate)));
        }

        @JavascriptInterface
        public void share(String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, UiText.t(store, "שיתוף")));
            });
        }

        @JavascriptInterface
        public void exportBackup(String json) { runOnUiThread(() -> MainActivity.this.exportBackup(json)); }

        @JavascriptInterface
        public void exportAnki(String tsv) { runOnUiThread(() -> MainActivity.this.exportAnki(tsv)); }

        @JavascriptInterface
        public void importBackup() { runOnUiThread(MainActivity.this::importBackup); }

        @JavascriptInterface
        public void addRead(int count) { io.execute(() -> store.addRead(count)); }

        @JavascriptInterface
        public void addListening(int seconds) { io.execute(() -> store.addListening(seconds)); }

        @JavascriptInterface
        public void toast(String msg) { runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show()); }

        @JavascriptInterface
        public String version() { return "1.6.2"; }
    }
}
