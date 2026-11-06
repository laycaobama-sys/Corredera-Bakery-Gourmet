/**
 * Regenerates client/public/sitemap.xml from the catalog and category routes.
 * Usage: pnpm exec tsx scripts/generate-sitemap.ts
 */
import fs from "node:fs";
import path from "node:path";
import { menuItems } from "../shared/catalog";
import { GOURMET_CATEGORY_PAGES } from "../shared/gourmetRoutes";
import { buildLlmsTxt } from "../server/_core/seoRender";

const BASE = "https://correderamadrid.com";
const today = new Date().toISOString().slice(0, 10);

type Entry = { path: string; priority: string; changefreq: string; alternates?: boolean };

const entries: Entry[] = [
  { path: "/", priority: "1.0", changefreq: "weekly", alternates: true },
  { path: "/?lang=en", priority: "0.9", changefreq: "weekly", alternates: true },
  { path: "/tienda", priority: "0.9", changefreq: "weekly" },
  ...GOURMET_CATEGORY_PAGES.map((c) => ({
    path: c.path,
    priority: c.isGourmetPrimary ? "0.8" : "0.6",
    changefreq: "weekly",
  })),
  ...menuItems
    .filter((i) => i.mode === "gourmet")
    .map((i) => ({ path: `/producto/${i.id}`, priority: "0.6", changefreq: "monthly" })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  "<urlset",
  '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '  xmlns:xhtml="http://www.w3.org/1999/xhtml"',
  ">",
  ...entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE}${e.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      ...(e.alternates
        ? [
            `    <xhtml:link rel="alternate" hreflang="es" href="${BASE}/" />`,
            `    <xhtml:link rel="alternate" hreflang="en" href="${BASE}/?lang=en" />`,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/" />`,
          ]
        : []),
      "  </url>",
    ].join("\n"),
  ),
  "</urlset>",
  "",
].join("\n");

const out = path.resolve(import.meta.dirname, "..", "client", "public", "sitemap.xml");
fs.writeFileSync(out, xml, "utf-8");
console.log(`sitemap.xml: ${entries.length} URLs`);

// Static fallback of the AI summary (the server serves a live version at /llms.txt).
const llms = path.resolve(import.meta.dirname, "..", "client", "public", "llms.txt");
fs.writeFileSync(llms, await buildLlmsTxt(), "utf-8");
console.log("llms.txt actualizado");
