package app.ner.reader;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;

import com.googlecode.tesseract.android.TessBaseAPI;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

/**
 * On-device OCR for image-only PDFs. Tesseract data is copied out of assets once.
 * Pages are separated by a form feed, so the reader keeps the PDF's page numbers.
 */
public final class Ocr {
    private static final Set<String> ready = new HashSet<>();

    private static synchronized void ensureData(Context context, String langs) throws Exception {
        File root = new File(context.getFilesDir(), "tesseract");
        File tessdata = new File(root, "tessdata");
        if (!tessdata.exists() && !tessdata.mkdirs()) throw new Exception("tesseract dir");
        for (String lang : langs.split("\\+")) {
            if (!lang.matches("[a-z_]{2,12}")) continue;
            if (ready.contains(lang)) continue;
            File target = new File(tessdata, lang + ".traineddata");
            if (!target.exists() || target.length() == 0) {
                try (InputStream in = context.getAssets().open("tessdata/" + lang + ".traineddata");
                     FileOutputStream out = new FileOutputStream(target)) {
                    byte[] buf = new byte[16384];
                    int n;
                    while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                }
            }
            ready.add(lang);
        }
    }

    public static String ocrPdf(Context context, byte[] pdfBytes, String langs, int maxPages) throws Exception {
        File tmp = File.createTempFile("ner-ocr", ".pdf", context.getCacheDir());
        try {
            try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(pdfBytes); }
            return ocrFile(context, tmp, langs, maxPages);
        } finally {
            tmp.delete();
        }
    }

    public static String ocrFile(Context context, File file, String langs, int maxPages) throws Exception {
        if (langs == null || langs.isEmpty()) langs = "eng";
        ensureData(context, langs);
        StringBuilder all = new StringBuilder();
            try (ParcelFileDescriptor fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
                 PdfRenderer renderer = new PdfRenderer(fd)) {
                TessBaseAPI tess = new TessBaseAPI();
                String dataPath = new File(context.getFilesDir(), "tesseract").getAbsolutePath();
                if (!tess.init(dataPath, langs)) {
                    tess.recycle();
                    if (!"eng".equals(langs)) return ocrFile(context, file, "eng", maxPages);
                    throw new Exception("OCR init failed");
                }
                try {
                    int pages = Math.min(renderer.getPageCount(), Math.max(1, maxPages));
                    for (int i = 0; i < pages; i++) {
                        try (PdfRenderer.Page page = renderer.openPage(i)) {
                            int srcW = Math.max(1, page.getWidth());
                            int srcH = Math.max(1, page.getHeight());
                            int targetW = Math.min(2200, Math.max(1200, srcW * 2));
                            float scale = targetW / (float) srcW;
                            int targetH = Math.max(1, Math.round(srcH * scale));
                            Bitmap bmp = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888);
                            Canvas canvas = new Canvas(bmp);
                            canvas.drawColor(Color.WHITE);
                            canvas.scale(scale, scale);
                            page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                            tess.setImage(bmp);
                            String text = tess.getUTF8Text();
                            bmp.recycle();
                            if (i > 0) all.append('\f');
                            if (text != null) all.append(text.trim());
                        }
                    }
                } finally {
                    tess.recycle();
                }
            }
        String text = all.toString();
        if (text.trim().isEmpty()) throw new Exception("no text");
        return text;
    }
}
