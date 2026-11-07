import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  getGourmetCategoryByPath,
  isValidProductRoute,
} from "../../shared/gourmetRoutes";
import { CONTENT_PATHS } from "../../shared/contentPages";
import { GUIDE_PATH } from "../../shared/guideJamon";
import { CLIENT_PUBLIC_DIR, DIST_PUBLIC_DIR } from "./paths";
import { buildLlmsTxt, buildSitemapXml } from "./seoRender";

export interface RouteSeoResolution {
  statusCode: 200 | 404;
  robotsHeader: string;
  isIndexable: boolean;
}

/**
 * Resolves the authoritative HTTP status code and X-Robots-Tag header for HTML routes.
 * - "/", valid category routes ("/gourmet/:slug", "/bakery-cafe"), and valid product detail routes ("/producto/:id")
 *   are indexable public storefront routes (HTTP 200).
 * - "/admin" is a private application route (HTTP 200, X-Robots-Tag: noindex, nofollow, noarchive).
 * - Any other non-asset, non-API route is a real 404 page (HTTP 404, X-Robots-Tag: noindex, nofollow),
 *   preventing Soft-404 indexing issues in search engines.
 */
export function resolveHtmlRouteSeoStatus(rawPath: string): RouteSeoResolution {
  const cleanPath = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  if (
    cleanPath === "/" ||
    cleanPath === "/tienda" ||
    cleanPath === GUIDE_PATH ||
    CONTENT_PATHS.has(cleanPath) ||
    Boolean(getGourmetCategoryByPath(cleanPath)) ||
    isValidProductRoute(cleanPath)
  ) {
    return {
      statusCode: 200,
      robotsHeader:
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      isIndexable: true,
    };
  }

  if (cleanPath === "/admin" || cleanPath.startsWith("/admin/")) {
    return {
      statusCode: 200,
      robotsHeader: "noindex, nofollow, noarchive",
      isIndexable: false,
    };
  }

  return {
    statusCode: 404,
    robotsHeader: "noindex, nofollow",
    isIndexable: false,
  };
}

function resolvePublicFilePath(fileName: string): string {
  const clientPublic = path.join(CLIENT_PUBLIC_DIR, fileName);
  if (fs.existsSync(clientPublic)) return clientPublic;

  const distPublic = path.join(DIST_PUBLIC_DIR, fileName);
  if (fs.existsSync(distPublic)) return distPublic;

  return path.resolve(import.meta.dirname, "public", fileName);
}

export function registerSeoStaticRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const filePath = resolvePublicFilePath("robots.txt");
    if (!fs.existsSync(filePath)) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    res
      .status(200)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=3600")
      .send(fs.readFileSync(filePath, "utf-8"));
  });

  // Generated from the live catalog so products added in the admin panel are indexed automatically.
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      res
        .status(200)
        .setHeader("Content-Type", "application/xml; charset=utf-8")
        .setHeader("Cache-Control", "public, max-age=3600")
        .send(await buildSitemapXml());
    } catch {
      const filePath = resolvePublicFilePath("sitemap.xml");
      res.status(200).type("application/xml").send(fs.readFileSync(filePath, "utf-8"));
    }
  });

  app.get("/site.webmanifest", (_req: Request, res: Response) => {
    const filePath = resolvePublicFilePath("site.webmanifest");
    if (!fs.existsSync(filePath)) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    res
      .status(200)
      .setHeader("Content-Type", "application/manifest+json; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=3600")
      .send(fs.readFileSync(filePath, "utf-8"));
  });

  // AI assistants read this summary; it is rebuilt from the catalog and CMS on every request.
  app.get("/llms.txt", async (_req: Request, res: Response) => {
    try {
      res
        .status(200)
        .setHeader("Content-Type", "text/plain; charset=utf-8")
        .setHeader("Cache-Control", "public, max-age=3600")
        .send(await buildLlmsTxt());
    } catch {
      const filePath = resolvePublicFilePath("llms.txt");
      res.status(200).type("text/plain").send(fs.readFileSync(filePath, "utf-8"));
    }
  });
}
