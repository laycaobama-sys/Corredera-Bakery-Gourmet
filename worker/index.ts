import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { DurableObject } from "cloudflare:workers";
import path from "node:path";
import { menuItems } from "../shared/catalog";
import { buildProductCulinarySvg } from "../shared/productVisuals";
import { forceSetOwnerPassword, getAdminAuthConfigStatus, installOwnerPasswordHash } from "../server/adminAuth";
import { getCatalogStorageDiagnostics } from "../server/catalogRepository";
import { appRouter } from "../server/routers";
import dataFs, { setDataFsBackend } from "../server/_core/dataFs";
import { renderHtmlPage, withSiteOrigin } from "../server/_core/htmlPage";
import { PUBLIC_UPLOADS_DIR, SERVER_DATA_DIR } from "../server/_core/paths";
import { buildLlmsTxt, buildSitemapXml } from "../server/_core/seoRender";
import catalogSeed from "../server/data/catalog-store.json";
import settingsSeed from "../server/data/site-settings.json";
import { createWorkerContext } from "./context";
import ownerSeed from "./owner-seed.json";
import { createSqlFs, readStoredBytes } from "./sqlFs";

export interface Env {
  ASSETS: Fetcher;
  STORE: DurableObjectNamespace<CorrederaStore>;
  ADMIN_INITIAL_PASSWORD?: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self' https://wa.me",
  ].join("; "),
};

const MEDIA_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function withHeaders(response: Response, extra: Record<string, string> = {}) {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...extra })) out.headers.set(k, v);
  return out;
}

function text(body: string, status: number, type = "text/plain; charset=utf-8", cache = "no-store") {
  return new Response(body, { status, headers: { "Content-Type": type, "Cache-Control": cache } });
}

/**
 * Single Durable Object holding the shop's data (catalog, CMS, orders, analytics, owner password, uploads)
 * in its SQLite storage. It runs the same tRPC routers and repositories as the Node server.
 */
export class CorrederaStore extends DurableObject<Env> {
  private template: string | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    setDataFsBackend(createSqlFs(ctx.storage.sql));
    this.seed();
  }

  /**
   * On start: load the catalog and web content published in the repository (first start only), apply
   * one-time updates shipped with a deploy (new products, owner access) and the owner password if given.
   */
  private seed() {
    const catalogFile = path.join(SERVER_DATA_DIR, "catalog-store.json");
    if (!dataFs.existsSync(catalogFile)) dataFs.writeFileSync(catalogFile, JSON.stringify(catalogSeed, null, 2));
    const settingsFile = path.join(SERVER_DATA_DIR, "site-settings.json");
    if (!dataFs.existsSync(settingsFile)) dataFs.writeFileSync(settingsFile, JSON.stringify(settingsSeed, null, 2));

    const migrationsFile = path.join(SERVER_DATA_DIR, "data-migrations.json");
    const applied: string[] = dataFs.existsSync(migrationsFile) ? JSON.parse(dataFs.readFileSync(migrationsFile, "utf-8")) : [];
    const done = new Set(applied);

    // Products added to the repository catalog under a "seed-…" tag reach the live shop once;
    // if the owner deletes them later they are not added again.
    const seedProducts = catalogSeed.products as { id: string; updatedBy?: string }[];
    const tags = [...new Set(seedProducts.map((p) => p.updatedBy ?? ""))].filter((tag) => tag.startsWith("seed-") && !done.has(tag));
    if (tags.length > 0) {
      const state = JSON.parse(dataFs.readFileSync(catalogFile, "utf-8")) as { products: { id: string }[]; updatedAt: string };
      const have = new Set(state.products.map((p) => p.id));
      const additions = seedProducts.filter((p) => tags.includes(p.updatedBy ?? "") && !have.has(p.id));
      if (additions.length > 0) {
        state.products.push(...additions);
        state.updatedAt = new Date().toISOString();
        dataFs.writeFileSync(catalogFile, JSON.stringify(state, null, 2));
      }
      tags.forEach((tag) => done.add(tag));
    }

    // The old domain's mailbox no longer exists: move the published addresses to the new domain, once.
    if (!done.has("settings-domain-correderamadrid")) {
      const raw = dataFs.readFileSync(settingsFile, "utf-8");
      const moved = raw.replaceAll("info@correderagourmet.com", "info@correderamadrid.com");
      if (moved !== raw) dataFs.writeFileSync(settingsFile, moved);
      done.add("settings-domain-correderamadrid");
    }

    // Owner access delivered with the code as a scrypt hash, applied once; the owner then changes it in the panel.
    if (!done.has(ownerSeed.id)) {
      installOwnerPasswordHash(ownerSeed.salt, ownerSeed.passwordHash);
      done.add(ownerSeed.id);
    }

    if (done.size !== applied.length) dataFs.writeFileSync(migrationsFile, JSON.stringify([...done], null, 2));

    const initial = (this.env.ADMIN_INITIAL_PASSWORD ?? "").trim();
    if (initial.length >= 12 && !getAdminAuthConfigStatus().adminTokenConfigured) {
      forceSetOwnerPassword(initial);
    }
  }

  private async getTemplate(origin: string) {
    if (!this.template) {
      const res = await this.env.ASSETS.fetch(new Request(`${origin}/`));
      this.template = await res.text();
    }
    return this.template;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: ({ req, resHeaders }) => createWorkerContext(req, resHeaders),
        onError: ({ path: procedure, error }) => {
          if (error.code === "INTERNAL_SERVER_ERROR") console.error(`[tRPC] ${procedure}:`, error);
        },
      });
    }

    if (p === "/api/health") return Response.json({ status: "ok" });
    if (p === "/api/health/ready") {
      const storage = await getCatalogStorageDiagnostics();
      return Response.json({
        status: "ok",
        service: "corredera-bakery-gourmet",
        runtime: "cloudflare-workers",
        persistence: { engine: "durable-object-sqlite", activeProductsCount: storage.activeProductsCount },
        ownerPasswordConfigured: getAdminAuthConfigStatus().adminTokenConfigured,
      });
    }
    if (p.startsWith("/api/")) return Response.json({ error: "API route not found" }, { status: 404 });

    // Links always point at the domain the site is served from, so a new domain needs no configuration.
    if (p === "/sitemap.xml") return text(withSiteOrigin(await buildSitemapXml(), url.origin), 200, "application/xml; charset=utf-8", "public, max-age=3600");
    if (p === "/llms.txt") return text(withSiteOrigin(await buildLlmsTxt(), url.origin), 200, "text/plain; charset=utf-8", "public, max-age=3600");
    if (p === "/robots.txt") {
      const robots = await (await this.env.ASSETS.fetch(new Request(`${url.origin}/robots.txt`))).text();
      return text(withSiteOrigin(robots, url.origin), 200, "text/plain; charset=utf-8", "public, max-age=3600");
    }

    if (p.startsWith("/assets/uploads/")) return this.serveUpload(request, p.slice("/assets/uploads/".length));

    const rendered = await renderHtmlPage(await this.getTemplate(url.origin), p + url.search, url.origin);
    return new Response(rendered.html, {
      status: rendered.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": rendered.robots,
        "Cache-Control": rendered.robots.startsWith("noindex, nofollow, noarchive") ? "no-store" : "public, max-age=0, must-revalidate",
      },
    });
  }

  /** Photos and videos uploaded from the admin panel, with byte ranges so videos play on Safari/iPhone. */
  private serveUpload(request: Request, rawName: string) {
    const name = rawName.replace(/[^a-zA-Z0-9._-]/g, "");
    const type = MEDIA_TYPES[path.extname(name).toLowerCase()];
    const bytes = name && type ? readStoredBytes(dataFs, path.join(PUBLIC_UPLOADS_DIR, name)) : null;
    if (!bytes) return text("Not found", 404);

    const headers: Record<string, string> = {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };
    const range = request.headers.get("Range")?.match(/^bytes=(\d*)-(\d*)$/);
    if (range && (range[1] || range[2])) {
      const size = bytes.byteLength;
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      return new Response(bytes.slice(start, end + 1), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }
    return new Response(bytes, { status: 200, headers: { ...headers, "Content-Length": String(bytes.byteLength) } });
  }
}

const PASS_THROUGH_EXTENSION = /\.(js|css|map|woff2?|ttf|ico|png|jpe?g|webp|avif|gif|svg|mp4|webm|json|txt|xml|webmanifest)$/i;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;

    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    // The launch address now forwards to the real domain, so old links keep working and only one site is indexed.
    if (url.hostname === "corredera-bakery-gourmet.ibraguimova19.workers.dev") {
      url.hostname = "correderamadrid.com";
      return Response.redirect(url.toString(), request.method === "GET" || request.method === "HEAD" ? 301 : 308);
    }
    if (p === "/index.html") return Response.redirect(`${url.origin}/${url.search}`, 301);

    // A product photo that does not exist yet: branded illustration instead of a broken image.
    const productPhoto = p.match(/^\/assets\/products\/([A-Za-z0-9_-]+?)(?:-480)?\.jpg$/);
    if (productPhoto) {
      const item = menuItems.find((m) => m.id === productPhoto[1]);
      return item
        ? text(buildProductCulinarySvg(item), 200, "image/svg+xml; charset=utf-8", "public, max-age=3600")
        : text("Not found", 404);
    }

    // Any other missing static file answers at once, without waking the data store.
    const dynamicFile = p === "/sitemap.xml" || p === "/llms.txt" || p === "/robots.txt" || p.startsWith("/assets/uploads/") || p.startsWith("/api/");
    if (!dynamicFile && PASS_THROUGH_EXTENSION.test(p)) return text("Not found", 404);

    const isCacheable =
      request.method === "GET" && (p.startsWith("/assets/uploads/") || (!p.startsWith("/api/") && !p.startsWith("/admin")));
    const cache = (caches as unknown as { default: Cache }).default;
    // Pages are cached at the edge for 60 s (uploads for a year): fast for visitors, and the owner's changes show within a minute.
    const cacheKey = new Request(url.toString(), { method: "GET" });
    if (isCacheable && !request.headers.has("Range")) {
      const hit = await cache.match(cacheKey);
      if (hit) {
        if (!(hit.headers.get("Content-Type") ?? "").startsWith("text/html")) return hit;
        const page = new Response(hit.body, hit);
        page.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
        return page;
      }
    }

    const store = env.STORE.get(env.STORE.idFromName("main"));
    const response = await store.fetch(request);
    const isHtml = (response.headers.get("Content-Type") ?? "").startsWith("text/html");
    // The *.workers.dev preview address is never indexed: only the real domain is.
    const privateHost = url.hostname.endsWith(".workers.dev");
    const out = withHeaders(response, p.startsWith("/api/") || privateHost ? { "X-Robots-Tag": "noindex, nofollow, noarchive" } : {});

    if (isCacheable && response.status === 200 && !request.headers.has("Range")) {
      const cached = out.clone();
      const edge = new Response(cached.body, cached);
      if (isHtml) edge.headers.set("Cache-Control", "public, s-maxage=60");
      ctx.waitUntil(cache.put(cacheKey, edge));
    }
    return out;
  },
} satisfies ExportedHandler<Env>;
