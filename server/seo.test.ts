import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { menuItems, parsePriceEuros } from "../shared/catalog";
import { resolveHtmlRouteSeoStatus } from "./_core/seoMiddleware";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const INDEX_HTML_PATH = path.join(ROOT_DIR, "client", "index.html");
const METADATA_JSON_PATH = path.join(ROOT_DIR, "metadata.json");
const ROBOTS_TXT_PATH = path.join(ROOT_DIR, "client", "public", "robots.txt");
const SITEMAP_XML_PATH = path.join(ROOT_DIR, "client", "public", "sitemap.xml");
const MANIFEST_PATH = path.join(ROOT_DIR, "client", "public", "site.webmanifest");
const SEO_AUDIT_PATH = path.join(ROOT_DIR, "SEO_AUDIT.md");

describe("Corredera Bakery & Gourmet — Technical & Local SEO Audit Suite", () => {
  it("validates synchronized title (30-60 chars) and meta description (120-160 chars) across index.html, metadata.json, and site.webmanifest", () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, "utf-8");
    const metadata = JSON.parse(fs.readFileSync(METADATA_JSON_PATH, "utf-8"));
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    expect(titleMatch).not.toBeNull();
    const rawTitle = titleMatch![1].replace(/&amp;/g, "&").trim();
    expect(rawTitle.length).toBeGreaterThanOrEqual(30);
    expect(rawTitle.length).toBeLessThanOrEqual(60);
    expect(rawTitle).toContain("Corredera Bakery & Gourmet");
    expect(rawTitle).toContain("Madrid");

    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    expect(descMatch).not.toBeNull();
    const metaDesc = descMatch![1].trim();
    expect(metaDesc.length).toBeGreaterThanOrEqual(120);
    expect(metaDesc.length).toBeLessThanOrEqual(160);
    expect(metaDesc).toContain("Calle de la Puebla 15");

    expect(metadata.description).toBe(metaDesc);
    expect(manifest.description).toBe(metaDesc);
  });

  it("validates canonical URL, bidirectional hreflang (es, en, x-default), Open Graph, and Twitter Card metadata with existing physical image asset", () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, "utf-8");

    expect(html).toContain('<link rel="canonical" href="https://correderamadrid.com/" />');
    expect(html).toContain('<link rel="alternate" hreflang="es" href="https://correderamadrid.com/" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://correderamadrid.com/?lang=en" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://correderamadrid.com/" />');

    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:locale" content="es_ES" />');
    expect(html).toContain('<meta property="og:locale:alternate" content="en_US" />');
    expect(html).toContain('<meta property="og:url" content="https://correderamadrid.com/" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');

    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="https:\/\/correderamadrid.com(\/[^"]+)"/);
    expect(ogImageMatch).not.toBeNull();
    const relativeImagePath = ogImageMatch![1];
    const physicalAssetPath = path.join(ROOT_DIR, "client", "public", relativeImagePath);
    expect(fs.existsSync(physicalAssetPath)).toBe(true);
    expect(fs.statSync(physicalAssetPath).size).toBeGreaterThan(10_000);
  });

  it("verifies sitemap.xml contains only real canonical indexable URLs (no fragments, no /admin, no /404) and valid ISO lastmod", () => {
    const sitemap = fs.readFileSync(SITEMAP_XML_PATH, "utf-8");

    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(sitemap).toContain("http://www.w3.org/1999/xhtml");

    const locMatches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locMatches.slice(0, 3)).toEqual([
      "https://correderamadrid.com/",
      "https://correderamadrid.com/?lang=en",
      "https://correderamadrid.com/tienda",
    ]);
    expect(locMatches).toContain("https://correderamadrid.com/gourmet/jamones");
    expect(locMatches).toContain("https://correderamadrid.com/bakery-cafe");
    expect(locMatches).toContain("https://correderamadrid.com/producto/je1");
    expect(new Set(locMatches).size).toBe(locMatches.length);

    for (const loc of locMatches) {
      expect(loc).not.toContain("#");
      expect(loc).not.toContain("/admin");
      expect(loc).not.toContain("/404");
      // Every sitemap URL must resolve to an indexable 200 route
      const status = resolveHtmlRouteSeoStatus(loc.replace("https://correderamadrid.com", ""));
      expect(status.statusCode).toBe(200);
    }

    const lastmodMatches = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    expect(lastmodMatches.length).toBe(locMatches.length);
    for (const dateStr of lastmodMatches) {
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("verifies robots.txt allows public crawling, disallows /api/, does not expose private /admin route names, and references canonical sitemap", () => {
    const robots = fs.readFileSync(ROBOTS_TXT_PATH, "utf-8");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://correderamadrid.com/sitemap.xml");
    // Must not expose private admin path in plaintext robots.txt
    expect(robots).not.toContain("/admin");
  });

  it("validates Schema.org JSON-LD graph separates Bakery and Gourmet under Vallejo Lorenzo S.L., has zero invented ratings/coordinates, and matches catalog prices", () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, "utf-8");
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(jsonLdMatch).not.toBeNull();

    const parsed = JSON.parse(jsonLdMatch![1]);
    expect(parsed["@context"]).toBe("https://schema.org");
    const graph = parsed["@graph"] as Record<string, unknown>[];
    expect(Array.isArray(graph)).toBe(true);

    // Must not contain invented reviews, ratings, or unverified geo coordinates
    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain('"review"');
    expect(serialized).not.toContain("GeoCoordinates");

    // Verify separated entities
    const orgNode = graph.find((n) => n["@id"] === "https://correderamadrid.com/#organization");
    const bakeryNode = graph.find((n) => n["@id"] === "https://correderamadrid.com/#bakery") as Record<string, unknown>;
    const gourmetNode = graph.find((n) => n["@id"] === "https://correderamadrid.com/#gourmet") as Record<string, unknown>;

    expect(orgNode).toBeDefined();
    expect(orgNode?.legalName).toBe("Vallejo Lorenzo S.L.");
    expect(bakeryNode).toBeDefined();
    expect(gourmetNode).toBeDefined();
    expect(bakeryNode.name).toBe("Corredera Bakery");
    expect(gourmetNode.name).toBe("Corredera Gourmet");

    // Verify all MenuItem prices in JSON-LD match the official catalog in shared/catalog.ts
    const extractMenuItems = (node: Record<string, unknown>) => {
      const menu = node.hasMenu as { hasMenuSection?: { hasMenuItem?: { name: string; offers?: { price: string } }[] }[] };
      const items: { name: string; price: number }[] = [];
      for (const section of menu?.hasMenuSection ?? []) {
        for (const mi of section.hasMenuItem ?? []) {
          if (mi.offers?.price) {
            items.push({ name: mi.name, price: Number(mi.offers.price) });
          }
        }
      }
      return items;
    };

    const structuredMenuItems = [
      ...extractMenuItems(bakeryNode),
      ...extractMenuItems(gourmetNode),
    ];
    expect(structuredMenuItems.length).toBeGreaterThanOrEqual(8);

    for (const smi of structuredMenuItems) {
      const catalogMatch = menuItems.find((m) => m.name === smi.name);
      expect(catalogMatch).toBeDefined();
      const catalogNumeric = parsePriceEuros(catalogMatch!.price);
      expect(catalogNumeric).toBeCloseTo(smi.price, 2);
    }
  });

  it("enforces HTTP 200 (index, follow) on '/', HTTP 200 (noindex, nofollow, noarchive) on '/admin', and HTTP 404 (noindex, nofollow) on unknown routes", () => {
    const homeStatus = resolveHtmlRouteSeoStatus("/");
    expect(homeStatus.statusCode).toBe(200);
    expect(homeStatus.isIndexable).toBe(true);
    expect(homeStatus.robotsHeader).toContain("index, follow");

    const enHomeStatus = resolveHtmlRouteSeoStatus("/?lang=en");
    expect(enHomeStatus.statusCode).toBe(200);
    expect(enHomeStatus.isIndexable).toBe(true);

    const adminStatus = resolveHtmlRouteSeoStatus("/admin");
    expect(adminStatus.statusCode).toBe(200);
    expect(adminStatus.isIndexable).toBe(false);
    expect(adminStatus.robotsHeader).toBe("noindex, nofollow, noarchive");

    const notFoundExplicit = resolveHtmlRouteSeoStatus("/404");
    expect(notFoundExplicit.statusCode).toBe(404);
    expect(notFoundExplicit.isIndexable).toBe(false);
    expect(notFoundExplicit.robotsHeader).toBe("noindex, nofollow");

    const unknownRoute = resolveHtmlRouteSeoStatus("/pagina-inexistente-seo");
    expect(unknownRoute.statusCode).toBe(404);
    expect(unknownRoute.isIndexable).toBe(false);
    expect(unknownRoute.robotsHeader).toBe("noindex, nofollow");

    for (const validRoute of [
      "/gourmet/jamones",
      "/gourmet/jamon-cortado",
      "/gourmet/sobres-jamon",
      "/gourmet/embutidos",
      "/gourmet/sobres-embutidos",
      "/gourmet/quesos",
      "/gourmet/aceites",
      "/bakery-cafe",
      "/producto/je1",
      "/producto/sj2",
      "/producto/q3",
      "/producto/ao1",
    ]) {
      const res = resolveHtmlRouteSeoStatus(validRoute);
      expect(res.statusCode).toBe(200);
      expect(res.isIndexable).toBe(true);
    }

    const invalidProduct = resolveHtmlRouteSeoStatus("/producto/id-inexistente-999");
    expect(invalidProduct.statusCode).toBe(404);
    expect(invalidProduct.isIndexable).toBe(false);
  });

  it("verifies SEO_AUDIT.md exists and documents local keywords, indexable URLs, and external owner tasks without false claims", () => {
    expect(fs.existsSync(SEO_AUDIT_PATH)).toBe(true);
    const auditMd = fs.readFileSync(SEO_AUDIT_PATH, "utf-8");
    expect(auditMd).toContain("Google Business Profile");
    expect(auditMd).toContain("Google Search Console");
    expect(auditMd).toContain("https://correderamadrid.com/");
    expect(auditMd).toContain("https://correderamadrid.com/?lang=en");
    expect(auditMd).toContain("Vallejo Lorenzo S.L.");
  });
});
