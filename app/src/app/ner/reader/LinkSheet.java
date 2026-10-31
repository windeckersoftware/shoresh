package app.ner.reader;

import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.ByteArrayInputStream;

/**
 * A web page in a sheet over the current screen, for dictionary links: 85% of the
 * height, rounded top corners, the screen behind dimmed. Links inside stay in the
 * sheet; the back key closes it, and closing destroys the WebView.
 */
final class LinkSheet extends Dialog {
    private final Store store;
    private final AdBlock adBlock;
    private final boolean dark;
    private WebView web;
    private TextView title;
    private TextView domain;
    private ProgressBar progress;

    private LinkSheet(Activity activity, Store store, AdBlock adBlock, boolean dark) {
        // A dark theme makes the page see prefers-color-scheme: dark.
        super(activity, dark ? android.R.style.Theme_Material_Dialog_NoActionBar
                : android.R.style.Theme_Material_Light_Dialog_NoActionBar);
        this.store = store;
        this.adBlock = adBlock;
        this.dark = dark;
    }

    /** Opens an http(s) URL in a new sheet; returns null for anything else. */
    static LinkSheet open(Activity activity, Store store, AdBlock adBlock, boolean dark, String url) {
        if (!isWeb(url) || activity.isFinishing()) return null;
        LinkSheet sheet = new LinkSheet(activity, store, adBlock, dark);
        sheet.build();
        sheet.show();
        sheet.web.loadUrl(url);
        return sheet;
    }

    private static boolean isWeb(String url) {
        String scheme = url == null ? null : Uri.parse(url).getScheme();
        return "http".equals(scheme) || "https".equals(scheme);
    }

    private int dp(float v) { return Math.round(v * getContext().getResources().getDisplayMetrics().density); }

    private void build() {
        int surface = dark ? 0xFF1A211D : 0xFFFFFDF8;
        int ink = dark ? 0xFFF2EEE4 : 0xFF1C1B18;
        int muted = dark ? 0xFFA7A69B : 0xFF726C60;
        int line = dark ? 0xFF303B34 : 0xFFE3DAC9;
        int green = dark ? 0xFF84C9AD : 0xFF2F6F5E;

        LinearLayout root = new LinearLayout(getContext());
        root.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(surface);
        float r = dp(24);
        bg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
        root.setBackground(bg);
        root.setClipToOutline(true);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(0, 0, 0, insets.getSystemWindowInsetBottom());
            return insets;
        });

        View grab = new View(getContext());
        GradientDrawable pill = new GradientDrawable();
        pill.setColor(line);
        pill.setCornerRadius(dp(2));
        grab.setBackground(pill);
        LinearLayout.LayoutParams grabLp = new LinearLayout.LayoutParams(dp(36), dp(4));
        grabLp.gravity = Gravity.CENTER_HORIZONTAL;
        grabLp.topMargin = dp(8);
        root.addView(grab, grabLp);

        LinearLayout head = new LinearLayout(getContext());
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.setPadding(dp(6), dp(2), dp(6), dp(6));
        head.addView(button("ic_sheet_close", "סגירה", ink, v -> dismiss()));
        LinearLayout titles = new LinearLayout(getContext());
        titles.setOrientation(LinearLayout.VERTICAL);
        titles.setPadding(dp(4), 0, dp(4), 0);
        title = label(15, ink, true);
        domain = label(12, muted, false);
        titles.addView(title);
        titles.addView(domain);
        head.addView(titles, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        head.addView(button("ic_sheet_share", "שיתוף", ink, v -> share()));
        head.addView(button("ic_sheet_open", "פתיחה בדפדפן", ink, v -> openInBrowser()));
        root.addView(head);

        progress = new ProgressBar(getContext(), null, android.R.attr.progressBarStyleHorizontal);
        progress.setProgressTintList(ColorStateList.valueOf(green));
        progress.setProgressBackgroundTintList(ColorStateList.valueOf(line));
        root.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(2)));

        web = new WebView(getContext());
        web.setBackgroundColor(surface);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        if (Build.VERSION.SDK_INT >= 33) s.setAlgorithmicDarkeningAllowed(dark);
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int p) {
                progress.setProgress(p);
                progress.setVisibility(p >= 100 ? View.INVISIBLE : View.VISIBLE);
            }
            @Override
            public void onReceivedTitle(WebView view, String t) {
                if (!TextUtils.isEmpty(t) && !t.startsWith("http")) title.setText(t);
            }
        });
        root.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(root);
        setOnDismissListener(d -> destroyWeb());
        Window w = getWindow();
        w.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        w.setLayout(ViewGroup.LayoutParams.MATCH_PARENT,
                Math.round(getContext().getResources().getDisplayMetrics().heightPixels * 0.85f));
        w.setGravity(Gravity.BOTTOM);
        w.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        w.setDimAmount(0.45f);
        w.setWindowAnimations(android.R.style.Animation_InputMethod);
        w.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    }

    private TextView label(int sp, int color, boolean bold) {
        TextView t = new TextView(getContext());
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setSingleLine(true);
        t.setEllipsize(TextUtils.TruncateAt.END);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    // build.sh compiles R after the sources, so drawables are found by name.
    private ImageButton button(String icon, String he, int tint, View.OnClickListener onClick) {
        ImageButton b = new ImageButton(getContext());
        b.setImageResource(getContext().getResources().getIdentifier(icon, "drawable", getContext().getPackageName()));
        b.setImageTintList(ColorStateList.valueOf(tint));
        b.setBackground(null);
        String text = UiText.t(store, he);
        b.setContentDescription(text);
        b.setTooltipText(text);
        b.setOnClickListener(onClick);
        b.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
        return b;
    }

    private void showAddress(String url) {
        String host = url == null ? null : Uri.parse(url).getHost();
        if (host == null) return;
        if (host.startsWith("www.")) host = host.substring(4);
        domain.setText(host);
        if (TextUtils.isEmpty(title.getText())) title.setText(host);
    }

    private String currentUrl() { return web == null ? null : web.getUrl(); }

    private void share() {
        String url = currentUrl();
        if (url == null) return;
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_SUBJECT, title.getText().toString());
        i.putExtra(Intent.EXTRA_TEXT, url);
        getContext().startActivity(Intent.createChooser(i, UiText.t(store, "שיתוף")));
    }

    private void openInBrowser() {
        String url = currentUrl();
        if (url == null) return;
        try {
            getContext().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            dismiss();
        } catch (Exception e) {
            Toast.makeText(getContext(), UiText.t(store, "לא נמצא דפדפן"), Toast.LENGTH_SHORT).show();
        }
    }

    private void destroyWeb() {
        if (web == null) return;
        web.stopLoading();
        ((ViewGroup) web.getParent()).removeView(web);
        web.destroy();
        web = null;
    }

    private final class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isWeb(request.getUrl().toString());
        }
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (!request.isForMainFrame() && adBlock.isBlocked(request.getUrl().toString())) {
                return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
            }
            return null;
        }
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            title.setText("");
            showAddress(url);
        }
    }
}
