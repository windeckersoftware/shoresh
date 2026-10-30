package app.ner.reader;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Tiny loopback HTTP server with Range support so PDF.js can stream book files. */
public final class BookServer {
    private final ServerSocket server;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final String token;
    private final Map<String, File> files = new HashMap<>();
    private volatile boolean running = true;

    public BookServer() throws IOException {
        server = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
        token = Long.toHexString(Double.doubleToLongBits(Math.random())) + Long.toHexString(System.nanoTime());
        Thread t = new Thread(this::acceptLoop, "ner-book-server");
        t.setDaemon(true);
        t.start();
    }

    public synchronized String register(File file) {
        String id = "p" + Long.toHexString(System.nanoTime()) + Integer.toHexString((int) (Math.random() * 0xffff));
        files.put(id, file);
        return "http://127.0.0.1:" + server.getLocalPort() + "/" + token + "/" + id + ".pdf";
    }

    public synchronized void unregister(String id) { files.remove(id); }

    private void acceptLoop() {
        while (running) {
            try {
                Socket s = server.accept();
                pool.execute(() -> handle(s));
            } catch (IOException e) {
                if (running) { /* ignore */ }
            }
        }
    }

    private void handle(Socket socket) {
        try (Socket s = socket) {
            s.setSoTimeout(8000);
            BufferedInputStream in = new BufferedInputStream(s.getInputStream());
            String request = readLine(in);
            if (request == null) return;
            String[] first = request.split(" ");
            if (first.length < 2) return;
            String method = first[0];
            String path = URLDecoder.decode(first[1], StandardCharsets.UTF_8.name());
            Map<String, String> headers = new HashMap<>();
            String line;
            while ((line = readLine(in)) != null && !line.isEmpty()) {
                int c = line.indexOf(':');
                if (c > 0) headers.put(line.substring(0, c).trim().toLowerCase(Locale.ROOT), line.substring(c + 1).trim());
            }
            OutputStream out = new BufferedOutputStream(s.getOutputStream());
            if ("OPTIONS".equals(method)) {
                writeHeaders(out, 204, null, 0, 0, 0, false);
                out.flush();
                return;
            }
            if (!"GET".equals(method) && !"HEAD".equals(method)) {
                writeHeaders(out, 405, null, 0, 0, 0, true);
                out.flush();
                return;
            }
            String prefix = "/" + token + "/";
            if (!path.startsWith(prefix) || !path.endsWith(".pdf")) {
                writeHeaders(out, 404, null, 0, 0, 0, true);
                out.flush();
                return;
            }
            String id = path.substring(prefix.length(), path.length() - 4);
            File file;
            synchronized (this) { file = files.get(id); }
            if (file == null || !file.isFile()) {
                writeHeaders(out, 404, null, 0, 0, 0, true);
                out.flush();
                return;
            }
            long total = file.length();
            long start = 0, end = total - 1;
            String range = headers.get("range");
            if (range != null && range.startsWith("bytes=")) {
                String[] parts = range.substring(6).split("-", -1);
                try {
                    if (!parts[0].isEmpty()) start = Long.parseLong(parts[0]);
                    if (parts.length > 1 && !parts[1].isEmpty()) end = Long.parseLong(parts[1]);
                } catch (Exception ignored) { start = 0; end = total - 1; }
                if (start < 0) start = 0;
                if (end >= total) end = total - 1;
                if (start > end) { writeHeaders(out, 416, null, 0, 0, total, true); out.flush(); return; }
            }
            long len = end - start + 1;
            boolean partial = range != null;
            writeHeaders(out, partial ? 206 : 200, "application/pdf", len, start, total, partial);
            if (!"HEAD".equals(method)) {
                try (InputStream fin = new FileInputStream(file)) {
                    long skipped = 0;
                    while (skipped < start) {
                        long n = fin.skip(start - skipped);
                        if (n <= 0) break;
                        skipped += n;
                    }
                    byte[] buf = new byte[65536];
                    long left = len;
                    while (left > 0) {
                        int n = fin.read(buf, 0, (int) Math.min(buf.length, left));
                        if (n < 0) break;
                        out.write(buf, 0, n);
                        left -= n;
                    }
                }
            }
            out.flush();
        } catch (Exception ignored) {
        }
    }

    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') sb.append((char) c);
        }
        return sb.length() == 0 && c == -1 ? null : sb.toString();
    }

    private static void writeHeaders(OutputStream out, int code, String type, long len, long start, long total, boolean rangeAware) throws IOException {
        String reason = code == 200 ? "OK" : code == 206 ? "Partial Content" : code == 204 ? "No Content" : code == 404 ? "Not Found" : code == 416 ? "Range Not Satisfiable" : "Error";
        StringBuilder h = new StringBuilder("HTTP/1.1 " + code + " " + reason + "\r\n");
        h.append("Access-Control-Allow-Origin: *\r\n");
        h.append("Access-Control-Allow-Methods: GET, HEAD, OPTIONS\r\n");
        h.append("Access-Control-Allow-Headers: Range\r\n");
        h.append("Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges\r\n");
        h.append("Accept-Ranges: bytes\r\n");
        h.append("Connection: close\r\n");
        if (type != null) h.append("Content-Type: ").append(type).append("\r\n");
        if (code == 206) {
            h.append("Content-Range: bytes ").append(start).append("-").append(start + len - 1).append("/").append(total).append("\r\n");
        }
        if (code != 204 && code != 416) h.append("Content-Length: ").append(len).append("\r\n");
        h.append("\r\n");
        out.write(h.toString().getBytes(StandardCharsets.ISO_8859_1));
    }

    public void stop() {
        running = false;
        try { server.close(); } catch (Exception ignored) { }
        pool.shutdownNow();
    }
}
