package app.ner.reader;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Random;

/** Tiny LAN-only HTTP endpoint for two Ner installs to exchange their JSON state. */
public final class SyncServer {
    public interface Listener { void onStateReceived(String json); }

    private final Store store;
    private final Listener listener;
    private final Object lock = new Object();
    private ServerSocket server;
    private Thread thread;
    private volatile boolean running;
    private String token;

    public SyncServer(Store store, Listener listener) {
        this.store = store;
        this.listener = listener;
    }

    public synchronized JSONObject start() throws Exception {
        if (server != null) {
            JSONObject o = info();
            o.put("running", true);
            return o;
        }
        Exception last = null;
        for (int port = 8765; port <= 8785; port++) {
            try {
                server = new ServerSocket(port, 50, InetAddress.getByName("0.0.0.0"));
                token = String.valueOf(100000 + new Random().nextInt(900000));
                running = true;
                thread = new Thread(this::loop, "ner-sync");
                thread.start();
                JSONObject o = info();
                o.put("running", true);
                return o;
            } catch (Exception e) {
                last = e;
                server = null;
            }
        }
        throw last == null ? new Exception("no port") : last;
    }

    public synchronized void stop() {
        running = false;
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        server = null;
        thread = null;
    }

    public synchronized JSONObject info() throws Exception {
        JSONObject o = new JSONObject();
        o.put("ip", localIp());
        o.put("port", server == null ? 0 : server.getLocalPort());
        o.put("token", token == null ? "" : token);
        o.put("running", server != null);
        return o;
    }

    private void loop() {
        while (running && server != null) {
            try (Socket socket = server.accept()) {
                handle(socket);
            } catch (Exception ignored) {
                if (!running) break;
            }
        }
    }

    private void handle(Socket socket) throws Exception {
        socket.setSoTimeout(10000);
        InputStream in = new BufferedInputStream(socket.getInputStream());
        ByteArrayOutputStream headBuf = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) != -1) {
            headBuf.write(b);
            byte[] a = headBuf.toByteArray();
            int n = a.length;
            if (n >= 4 && a[n - 4] == '\r' && a[n - 3] == '\n' && a[n - 2] == '\r' && a[n - 1] == '\n') break;
            if (n > 16384) throw new Exception("headers too large");
        }
        String head = new String(headBuf.toByteArray(), StandardCharsets.UTF_8);
        String[] lines = head.split("\r\n");
        if (lines.length == 0) return;
        String[] first = lines[0].split(" ");
        if (first.length < 2) return;
        String method = first[0];
        String path = first[1];
        int contentLength = 0;
        for (String line : lines) {
            int colon = line.indexOf(':');
            if (colon > 0 && line.substring(0, colon).trim().equalsIgnoreCase("Content-Length")) {
                try { contentLength = Integer.parseInt(line.substring(colon + 1).trim()); } catch (Exception ignored) { }
            }
        }
        byte[] body = new byte[contentLength];
        int read = 0;
        while (read < contentLength) {
            int n = in.read(body, read, contentLength - read);
            if (n < 0) break;
            read += n;
        }
        String clean = path;
        String q = "";
        int qi = path.indexOf('?');
        if (qi >= 0) { clean = path.substring(0, qi); q = path.substring(qi + 1); }
        String supplied = "";
        for (String part : q.split("&")) {
            int eq = part.indexOf('=');
            if (eq > 0 && part.substring(0, eq).equals("token")) supplied = part.substring(eq + 1);
        }
        if (!token.equals(supplied)) { respond(socket, 403, "{\"ok\":false,\"error\":\"bad token\"}"); return; }
        if (!"/state".equals(clean)) { respond(socket, 404, "{\"ok\":false,\"error\":\"not found\"}"); return; }
        if ("GET".equals(method)) {
            respond(socket, 200, store.load());
        } else if ("POST".equals(method)) {
            String json = new String(body, 0, read, StandardCharsets.UTF_8);
            new JSONObject(json);
            store.save(json);
            if (listener != null) listener.onStateReceived(json);
            respond(socket, 200, "{\"ok\":true}");
        } else {
            respond(socket, 405, "{\"ok\":false,\"error\":\"method\"}");
        }
    }

    private void respond(Socket socket, int code, String body) throws Exception {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        String reason = code == 200 ? "OK" : code == 403 ? "Forbidden" : code == 404 ? "Not Found" : "Error";
        String headers = "HTTP/1.1 " + code + " " + reason + "\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: " + bytes.length + "\r\n"
                + "Access-Control-Allow-Origin: *\r\n"
                + "Connection: close\r\n\r\n";
        OutputStream out = socket.getOutputStream();
        out.write(headers.getBytes(StandardCharsets.UTF_8));
        out.write(bytes);
        out.flush();
    }

    public static String localIp() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) { }
        return "127.0.0.1";
    }
}
