import "dotenv/config";
import compression from "compression";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { getCatalogStorageDiagnostics } from "../catalogRepository";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerStorageProxy } from "./storageProxy";
import { registerSeoStaticRoutes } from "./seoMiddleware";
import { serveStatic, setupVite } from "./vite";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // gzip HTML, JS, CSS, JSON and SVG (images and video are already compressed)
  app.use(compression({ threshold: 1024 }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
    );
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://wa.me",
      ].join("; ")
    );
    next();
  });

  // Safe body parser limits (supports validated admin image & MP4/WebM video uploads)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Serve robots.txt, sitemap.xml, site.webmanifest, and llms.txt with canonical headers
  registerSeoStaticRoutes(app);

  // Prevent search engines from indexing internal API endpoints
  app.use("/api", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/health/ready", async (_req, res) => {
    try {
      const storage = await getCatalogStorageDiagnostics();
      res.status(200).json({
        status: "ok",
        service: "corredera-bakery-gourmet",
        env: process.env.NODE_ENV || "development",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        persistence: {
          engine: storage.engine,
          mysqlActive: storage.mysqlActive,
          totalProductsCount: storage.totalProductsCount,
          activeProductsCount: storage.activeProductsCount,
          availableBackupsCount: storage.availableBackupsCount,
        },
      });
    } catch {
      res.status(503).json({ status: "degraded" });
    }
  });


  registerOAuthRoutes(app);
  registerStorageProxy(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Prevent unknown /api/* routes from falling through to the HTML SPA catch-all
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const server = createServer(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer().catch(error => { console.error(error); process.exit(1); });
}
