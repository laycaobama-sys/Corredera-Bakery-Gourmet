import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { PUBLIC_UPLOADS_DIR } from "./paths";
import { renderHtmlPage } from "./htmlPage";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const rendered = await renderHtmlPage(template, url);
      const page = await vite.transformIndexHtml(url, rendered.html);
      res
        .status(rendered.status)
        .set({
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": rendered.robots,
        })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Photos uploaded from the admin panel live in UPLOAD_DIR (a persistent volume in production).
  app.use("/assets/uploads", express.static(PUBLIC_UPLOADS_DIR, { maxAge: "30d", immutable: true, index: false }));

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        const rel = path.relative(distPath, filePath).replace(/\\/g, "/");
        if (rel.startsWith("static/")) {
          // Content-hashed build output never changes
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/^assets\//.test(rel)) {
          // Photos and video: cache a day, then revalidate (the owner can replace them)
          res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // fall through to index.html if the file doesn't exist, preserving accurate HTTP 200 vs 404 status.
  // Each page gets its own title, description, JSON-LD and text snapshot for crawlers and AI assistants.
  const indexPath = path.resolve(distPath, "index.html");
  app.use("*", async (req, res) => {
    let template: string;
    try {
      template = await fs.promises.readFile(indexPath, "utf-8");
    } catch {
      res.status(500).type("text/plain").send("Build not found");
      return;
    }
    const rendered = await renderHtmlPage(template, req.originalUrl);
    res
      .status(rendered.status)
      .setHeader("X-Robots-Tag", rendered.robots)
      .setHeader("Cache-Control", "no-cache")
      .type("html")
      .send(rendered.html);
  });
}
