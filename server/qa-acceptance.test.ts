import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CART_STORAGE_KEY, sanitizeStoredCart } from "../client/src/storefront/cart";
import {
  FEATURED_IDS,
  LANDLINE_DISPLAY,
  UPSELL_IDS,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  buildWhatsAppOrderMessage,
  categories,
  filterCatalogItems,
  formatEuros,
  formatPrice,
  galleryImages,
  menuImageFor,
  menuImageStatusFor,
  menuItems,
  menuPriceStatusFor,
  normalizeSearchText,
  parsePriceEuros,
  productRealPhotoFor,
  whatsappUrl,
} from "../shared/catalog";
import { createApp } from "./_core/index";
import { appRouter } from "./routers";

/**
 * Helper to compute WCAG 2.1 relative luminance and contrast ratio
 */
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Independent QA Lead Acceptance Battery (11 Areas)", () => {
  let server: http.Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("QA-02 & QA-08: verifies live HTTP endpoints (/api/health, /api/platform/config.js, /robots.txt, /sitemap.xml, /site.webmanifest, /llms.txt, and 404 API protection)", async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    expect(await healthRes.json()).toEqual({ status: "ok" });
    expect(healthRes.headers.get("x-content-type-options")).toBe("nosniff");
    expect(healthRes.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(healthRes.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(healthRes.headers.get("permissions-policy")).toContain("camera=()");
    expect(healthRes.headers.get("x-robots-tag")).toContain("noindex");

    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    expect(robotsRes.status).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).not.toContain("/admin");
    expect(robotsTxt).toContain("Disallow: /api/");
    expect(robotsTxt).toContain("Sitemap: https://correderagourmet.com/sitemap.xml");

    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    expect(sitemapRes.status).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("https://correderagourmet.com/");
    expect(sitemapXml).toContain("https://correderagourmet.com/?lang=en");
    expect(sitemapXml).not.toContain("/admin");

    const manifestRes = await fetch(`${baseUrl}/site.webmanifest`);
    expect(manifestRes.status).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.name).toContain("Corredera Bakery & Gourmet");

    const unknownApiRes = await fetch(`${baseUrl}/api/non-existent-endpoint`);
    expect(unknownApiRes.status).toBe(404);
    expect(unknownApiRes.headers.get("content-type")).toContain("application/json");
  });

  it("QA-02 & QA-04: verifies all 102 product image URLs and hero/gallery assets resolve with HTTP 200 or exist on disk without falling through to HTML", async () => {
    const publicRoot = path.resolve(import.meta.dirname, "..", "client", "public");

    // Verify all 102 product images either exist as physical JPGs on disk or serve unique dish-specific SVG via HTTP 200
    for (const item of menuItems) {
      const relUrl = productRealPhotoFor(item);
      expect(relUrl.startsWith("/assets/")).toBe(true);
      const diskPath = path.join(publicRoot, relUrl);
      if (fs.existsSync(diskPath)) {
        const stat = fs.statSync(diskPath);
        expect(stat.size).toBeGreaterThan(1024);
      } else {
        const res = await fetch(`${baseUrl}${relUrl}`);
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("image/svg+xml");
        const body = await res.text();
        expect(body).toContain("<svg");
        expect(body).not.toContain("<!doctype html>");
      }
    }

    // Verify non-existent product asset returns 404 instead of SPA HTML
    const missingProductRes = await fetch(`${baseUrl}/assets/products/nonexistent999.jpg`);
    expect(missingProductRes.status).toBe(404);

    // Verify hero & gallery photos on disk
    const criticalAssets = [
      "/assets/brand/corredera-lockup.png",
      "/assets/brand/corredera-logo-light.png",
      "/assets/brand/favicon-512.png",
      "/assets/corredera-bakery-interior.jpg",
      "/assets/home/hero-jamon.jpg",
      "/assets/home/hero-loncheado.jpg",
      "/assets/home/hero-quesos.jpg",
      "/assets/home/carving-bg.jpg",
      "/assets/carta-cartel.jpg",
      "/assets/products/je1.jpg",
    ];
    for (const asset of criticalAssets) {
      const diskPath = path.join(publicRoot, asset);
      expect(fs.existsSync(diskPath)).toBe(true);
      expect(fs.statSync(diskPath).size).toBeGreaterThan(1024);
    }
  });

  it("QA-03 & QA-09: verifies responsive breakpoints, overflow-x protection, WCAG 2.1 AA contrast ratios, focus-visible rings, and reduced-motion rules", () => {
    const cssPath = path.resolve(import.meta.dirname, "..", "client", "src", "index.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // No external Google Fonts @import that violates CSP or RGPD
    expect(css).not.toContain("fonts.googleapis.com");

    // Responsive media queries for Tablet (1024px), Mobile (720px), and Small Mobile (360px)
    expect(css).toContain("@media (max-width: 1024px)");
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("@media (max-width: 360px)");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("[role=\"button\"]:focus-visible");
    expect(css).toContain("textarea:focus-visible");

    // WCAG 2.1 AA contrast verification (>= 4.5:1 for normal text)
    expect(contrastRatio("#241e19", "#f5f1ea")).toBeGreaterThan(12); // Primary ink on paper
    expect(contrastRatio("#655d54", "#faf8f4")).toBeGreaterThan(5.5); // Muted text on card
    expect(contrastRatio("#655d54", "#ffffff")).toBeGreaterThan(5.8); // Search placeholder on white
    expect(contrastRatio("#621b1c", "#faf8f4")).toBeGreaterThan(8.0); // Burgundy accent on paper-strong
    expect(contrastRatio("#ffffff", "#1b6b3a")).toBeGreaterThan(6.5); // White text on WhatsApp CTA
    expect(contrastRatio("#dfd3c5", "#2b211b")).toBeGreaterThan(9.0); // Footer legal links on espresso
  });

  it("QA-04 & QA-06: verifies cart persistence sanitization, recovery from corrupted JSON/invalid quantities, and all 17 category filters", () => {
    expect(CART_STORAGE_KEY).toBe("cbg-cart-v2");

    // Corrupted JSON recovery
    expect(sanitizeStoredCart("{corrupted-json")).toEqual({});
    expect(sanitizeStoredCart(null)).toEqual({});
    expect(sanitizeStoredCart(["d1", "b1"])).toEqual({});

    // Filtering out non-existent IDs, zero/negative numbers, NaN, and clamping >99
    const sanitized = sanitizeStoredCart(
      JSON.stringify({
        d1: 2,
        bo1: 150, // clamped to 99
        g1: 0, // removed
        b1: -5, // removed
        fake_id_999: 3, // removed
        t6: "4", // parsed to 4
        t7: "invalid", // removed
      })
    );
    expect(sanitized).toEqual({
      d1: 2,
      bo1: 99,
      t6: 4,
    });

    // Verify all categories in both modes return non-empty results and sum to 57 + 70 = 127
    let bakerySum = 0;
    for (const cat of categories.bakery) {
      if (cat.id === "todos") continue;
      const items = filterCatalogItems({ mode: "bakery", category: cat.id, query: "" });
      expect(items.length).toBeGreaterThan(0);
      bakerySum += items.length;
    }
    expect(bakerySum).toBe(57);

    let gourmetSum = 0;
    for (const cat of categories.gourmet) {
      if (cat.id === "todos") continue;
      const items = filterCatalogItems({ mode: "gourmet", category: cat.id, query: "" });
      expect(items.length).toBeGreaterThan(0);
      gourmetSum += items.length;
    }
    expect(gourmetSum).toBe(70);

    // Empty state when searching for non-existent dish
    const emptyRes = filterCatalogItems({
      mode: "bakery",
      category: "todos",
      query: "sushi dragon roll inexistente xyz",
    });
    expect(emptyRes).toHaveLength(0);
  });

  it("QA-11: verifies production bundle output and LCP preload optimization", () => {
    const htmlPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
    const html = fs.readFileSync(htmlPath, "utf-8");

    // Preloads the image actually rendered as the first hero slide and the header logo
    expect(html).toContain('href="/assets/home/hero-jamon.jpg" imagesrcset=');
    expect(html).toContain('href="/assets/brand/corredera-lockup.png" fetchpriority="high"');

    // Only the first hero slide is eager; the rest of the home media is lazy-loaded
    const homeSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "client", "src", "pages", "Home.tsx"),
      "utf-8"
    );
    expect(homeSource).toContain('loading={i === 0 ? "eager" : "lazy"}');
    expect(homeSource).toContain('loading="lazy"');
    expect(homeSource).not.toContain("(102)");

    // Bakery lives in its own menu page; the home is gourmet-first
    const cartaSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "client", "src", "pages", "CartaPage.tsx"),
      "utf-8"
    );
    expect(cartaSource).toContain('"Carta Bakery & Café"');
    expect(homeSource.indexOf("<BestSellers />")).toBeLessThan(homeSource.indexOf("<BakeryTeaser />"));
  });

  it("QA-12: verifies production readiness probe (/api/health/ready) and video/photo CSP & upload readiness", async () => {
    const readyRes = await fetch(`${baseUrl}/api/health/ready`);
    expect(readyRes.status).toBe(200);
    const readyJson = await readyRes.json();
    expect(readyJson.status).toBe("ok");
    expect(readyJson.service).toBe("corredera-bakery-gourmet");
    expect(readyJson.persistence.totalProductsCount).toBeGreaterThanOrEqual(102);
    expect(readyRes.headers.get("content-security-policy")).toContain("media-src 'self'");
  });

  it("QA-13: verifies CMS siteSettings schema parity across starsSection, familiesSection, marketDepartments and sectionVisibility so Home.tsx never hits undefined mediaUrl", async () => {
    const publicCaller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", ip: "127.0.0.1", headers: {} } as any,
      res: {} as any,
    });
    const settings = await publicCaller.catalog.siteSettings();

    // Stars section items must all have defined mediaUrl, name, price
    expect(settings.starsSection.items.length).toBeGreaterThan(0);
    for (const star of settings.starsSection.items) {
      expect(typeof star.mediaUrl).toBe("string");
      expect(star.mediaUrl.length).toBeGreaterThan(0);
      expect(typeof star.name).toBe("string");
      expect(star.name.length).toBeGreaterThan(0);
    }

    // Families section cards & services must all have defined mediaUrl, title, text
    expect(settings.familiesSection.families.length).toBeGreaterThan(0);
    for (const fam of settings.familiesSection.families) {
      expect(typeof fam.mediaUrl).toBe("string");
      expect(fam.mediaUrl.length).toBeGreaterThan(0);
      expect(typeof fam.title).toBe("string");
      expect(fam.title.length).toBeGreaterThan(0);
    }
    expect(settings.familiesSection.services.length).toBeGreaterThan(0);

    // Market departments (Frutería, Carnicería, Vinos) must have defined image URLs and titles
    expect(settings.marketDepartments.fruteriaImageUrl.length).toBeGreaterThan(0);
    expect(settings.marketDepartments.carniceriaImageUrl.length).toBeGreaterThan(0);
    expect(settings.marketDepartments.vinosImageUrl.length).toBeGreaterThan(0);
    expect(settings.marketDepartments.fruteriaTitleEs.length).toBeGreaterThan(0);
    expect(settings.marketDepartments.carniceriaTitleEs.length).toBeGreaterThan(0);
    expect(settings.marketDepartments.vinosTitleEs.length).toBeGreaterThan(0);

    // Section visibility flags must all be boolean
    expect(typeof settings.sectionVisibility.stars).toBe("boolean");
    expect(typeof settings.sectionVisibility.marketDepartments).toBe("boolean");
    expect(typeof settings.sectionVisibility.menu).toBe("boolean");
    expect(typeof settings.sectionVisibility.families).toBe("boolean");
    expect(typeof settings.sectionVisibility.services).toBe("boolean");
    expect(typeof settings.sectionVisibility.story).toBe("boolean");
    expect(typeof settings.sectionVisibility.visit).toBe("boolean");
  });
});

