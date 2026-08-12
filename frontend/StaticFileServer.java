import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;

public class StaticFileServer {
    public static void main(String[] args) throws Exception {
        int port = 3000;
        String dir = ".";
        if (args.length >= 1) port = Integer.parseInt(args[0]);
        if (args.length >= 2) dir = args[1];

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", new FileHandler(dir));
        server.setExecutor(null);
        System.out.println("Serving " + dir + " on http://localhost:" + port + "/");
        server.start();
    }

    static class FileHandler implements HttpHandler {
        private final Path base;
        public FileHandler(String baseDir) {
            this.base = Path.of(baseDir).toAbsolutePath().normalize();
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";
            Path resolved = base.resolve(path.substring(1)).normalize();
            if (!resolved.startsWith(base) || !Files.exists(resolved) || Files.isDirectory(resolved)) {
                byte[] notFound = "404 Not Found".getBytes();
                exchange.sendResponseHeaders(404, notFound.length);
                exchange.getResponseBody().write(notFound);
                exchange.close();
                return;
            }
            String contentType = Files.probeContentType(resolved);
            if (contentType == null) contentType = "application/octet-stream";
            exchange.getResponseHeaders().set("Content-Type", contentType);
            long len = Files.size(resolved);
            exchange.sendResponseHeaders(200, len);
            try (OutputStream os = exchange.getResponseBody(); InputStream is = Files.newInputStream(resolved)) {
                is.transferTo(os);
            }
        }
    }
}
