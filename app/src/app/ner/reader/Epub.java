package app.ner.reader;

import android.content.Context;
import android.net.Uri;
import android.text.Html;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/** Minimal EPUB text extractor: container.xml -> OPF manifest/spine -> readable text. */
public final class Epub {
    public static final class Chapter {
        public final String title;
        public final int offset;
        Chapter(String title, int offset) { this.title = title; this.offset = offset; }
    }

    public static final class Result {
        public final String title;
        public final String text;
        public final List<Chapter> chapters;
        Result(String title, String text, List<Chapter> chapters) {
            this.title = title; this.text = text; this.chapters = chapters;
        }
    }

    private static final Pattern ATTR = Pattern.compile("([a-zA-Z:]+)\\s*=\\s*\"([^\"]*)\"");
    private static final Pattern ITEM = Pattern.compile("<item\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ITEMREF = Pattern.compile("<itemref\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern TITLE = Pattern.compile("<dc:title[^>]*>(.*?)</dc:title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    public static Result extract(Context context, Uri uri) throws Exception {
        Map<String, byte[]> files = new HashMap<>();
        int total = 0;
        try (InputStream raw = context.getContentResolver().openInputStream(uri);
             ZipInputStream zip = new ZipInputStream(raw)) {
            if (zip == null) throw new Exception("EPUB לא נמצא");
            ZipEntry e;
            byte[] buf = new byte[8192];
            while ((e = zip.getNextEntry()) != null) {
                if (e.isDirectory()) continue;
                String name = e.getName();
                if (name == null || name.contains("..") || !keepText(name)) continue;
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                int n, entryTotal = 0;
                boolean tooBig = false;
                while ((n = zip.read(buf)) != -1) {
                    entryTotal += n;
                    total += n;
                    if (entryTotal > 16 * 1024 * 1024 || total > 80 * 1024 * 1024) {
                        tooBig = true;
                        break;
                    }
                    out.write(buf, 0, n);
                }
                if (!tooBig) files.put(name, out.toByteArray());
            }
        }
        byte[] container = files.get("META-INF/container.xml");
        if (container == null) throw new Exception("זה לא קובץ EPUB תקין");
        String containerText = new String(container, StandardCharsets.UTF_8);
        Matcher cm = Pattern.compile("full-path\\s*=\\s*\"([^\"]+)\"").matcher(containerText);
        if (!cm.find()) throw new Exception("לא נמצא קובץ OPF");
        String opfPath = cm.group(1);
        byte[] opf = files.get(opfPath);
        if (opf == null) throw new Exception("קובץ OPF חסר");
        String opfText = new String(opf, StandardCharsets.UTF_8);

        String dir = "";
        int slash = opfPath.lastIndexOf('/');
        if (slash >= 0) dir = opfPath.substring(0, slash + 1);

        String bookTitle = "";
        Matcher tm = TITLE.matcher(opfText);
        if (tm.find()) bookTitle = stripTags(tm.group(1)).trim();

        Map<String, String> idToHref = new HashMap<>();
        Map<String, String> idToType = new HashMap<>();
        Matcher im = ITEM.matcher(opfText);
        while (im.find()) {
            Map<String, String> attrs = attrs(im.group());
            String id = attrs.get("id");
            String href = attrs.get("href");
            if (id != null && href != null) {
                idToHref.put(id, href);
                idToType.put(id, attrs.getOrDefault("media-type", ""));
            }
        }

        List<String> ordered = new ArrayList<>();
        Matcher rm = ITEMREF.matcher(opfText);
        while (rm.find()) {
            Map<String, String> attrs = attrs(rm.group());
            String idref = attrs.get("idref");
            if (idref != null && idToHref.containsKey(idref)) ordered.add(idToHref.get(idref));
        }
        if (ordered.isEmpty()) {
            for (Map.Entry<String, String> e : idToHref.entrySet()) {
                String type = idToType.getOrDefault(e.getKey(), "");
                if (type.contains("html") || e.getValue().endsWith(".xhtml") || e.getValue().endsWith(".html")) ordered.add(e.getValue());
            }
        }

        StringBuilder sb = new StringBuilder();
        List<Chapter> toc = new ArrayList<>();
        int chapters = 0;
        for (String href : ordered) {
            if (chapters >= 250) break;
            String clean = href;
            int hash = clean.indexOf('#');
            if (hash >= 0) clean = clean.substring(0, hash);
            String path;
            try {
                URI base = new URI("file:///" + dir);
                path = base.resolve(clean).getPath();
                if (path != null && path.startsWith("/")) path = path.substring(1);
            } catch (Exception e) {
                path = dir + clean;
            }
            byte[] data = files.get(path);
            if (data == null) data = files.get(clean);
            if (data == null) continue;
            String html = new String(data, StandardCharsets.UTF_8);
            String text = htmlToText(html);
            if (text.trim().isEmpty()) continue;
            String chapterTitle = chapterTitle(html);
            if (chapterTitle != null && !text.startsWith(chapterTitle)) {
                toc.add(new Chapter(chapterTitle, sb.length()));
                sb.append(chapterTitle).append("\n\n");
            } else {
                toc.add(new Chapter(UiText.t(new Store(context), "פרק") + " " + (chapters + 1), sb.length()));
            }
            sb.append(text.trim()).append("\n\n");
            chapters++;
        }
        String text = sb.toString().trim();
        if (text.isEmpty()) throw new Exception("לא נמצא טקסט בספר");
        if (bookTitle.isEmpty()) bookTitle = UiText.t(new Store(context), "ספר");
        return new Result(bookTitle, text, toc);
    }

    private static boolean keepText(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        return n.endsWith(".xml") || n.endsWith(".opf") || n.endsWith(".ncx")
                || n.endsWith(".html") || n.endsWith(".xhtml") || n.endsWith(".htm")
                || n.endsWith(".txt");
    }

    private static Map<String, String> attrs(String tag) {
        Map<String, String> map = new HashMap<>();
        Matcher m = ATTR.matcher(tag);
        while (m.find()) map.put(m.group(1).toLowerCase(Locale.ROOT), m.group(2));
        return map;
    }

    private static String chapterTitle(String html) {
        Matcher m = Pattern.compile("<h[1-2][^>]*>(.*?)</h[1-2]>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
        if (m.find()) {
            String t = stripTags(m.group(1)).trim();
            if (!t.isEmpty() && t.length() < 160) return t;
        }
        Matcher t = Pattern.compile("<title[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
        if (t.find()) {
            String s = stripTags(t.group(1)).trim();
            if (!s.isEmpty() && s.length() < 160) return s;
        }
        return null;
    }

    private static String stripTags(String s) {
        return s.replaceAll("<[^>]+>", " ").replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'");
    }

    private static String htmlToText(String html) {
        String s = html;
        s = s.replaceAll("(?is)<script\\b[^>]*>.*?</script>", " ");
        s = s.replaceAll("(?is)<style\\b[^>]*>.*?</style>", " ");
        s = s.replaceAll("(?is)<head\\b[^>]*>.*?</head>", " ");
        s = s.replaceAll("(?i)<br\\s*/?>", "\n");
        s = s.replaceAll("(?i)</(p|div|h[1-6]|li|blockquote|tr|section|article)>", "\n\n");
        s = s.replaceAll("(?i)<li\\b[^>]*>", "• ");
        try {
            s = Html.fromHtml(s, Html.FROM_HTML_MODE_LEGACY).toString();
        } catch (Exception e) {
            s = stripTags(s);
        }
        s = s.replace('\u00A0', ' ');
        s = s.replaceAll("[ \\t]+", " ");
        s = s.replaceAll(" *\\n *", "\n");
        s = s.replaceAll("\\n{3,}", "\n\n");
        return s.trim();
    }
}
