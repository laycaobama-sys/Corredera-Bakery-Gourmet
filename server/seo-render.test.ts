import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderHtmlPage } from "./_core/htmlPage";
import { buildLlmsTxt, buildSeoPage, buildSitemapXml, injectSeo } from "./_core/seoRender";

const template = fs.readFileSync(path.resolve(import.meta.dirname, "..", "client", "index.html"), "utf-8");

describe("Server-side SEO for crawlers and AI assistants", () => {
  it("gives each product page its own title, Product JSON-LD with EUR offer and a readable snapshot", async () => {
    const page = await buildSeoPage("/producto/je1");
    expect(page.title).toContain("Jamón 5 Jotas");
    expect(page.canonical).toBe("https://correderamadrid.com/producto/je1");
    const product = page.jsonLd.find((j) => (j as { "@type": string })["@type"] === "Product") as Record<string, any>;
    expect(product.offers.price).toBe("625.00");
    expect(product.offers.priceCurrency).toBe("EUR");

    const html = injectSeo(template, page);
    expect(html).toContain("<title>Jamón 5 Jotas");
    expect(html).toContain('<link rel="canonical" href="https://correderamadrid.com/producto/je1" />');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('<div class="seo-snapshot" hidden><nav>');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it("adds breadcrumbs, product lists and FAQ schema to category pages and per-kilo pricing", async () => {
    const page = await buildSeoPage("/gourmet/embutidos?x=1");
    const types = page.jsonLd.map((j) => (j as { "@type": string })["@type"]);
    expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "ItemList", "FAQPage"]));

    const presa = await buildSeoPage("/producto/em1");
    const offer = (presa.jsonLd[0] as Record<string, any>).offers;
    expect(offer.priceSpecification.unitCode).toBe("KGM");
  });

  it("embeds the live catalog and settings in each page and answers 404 only for products that do not exist", async () => {
    const page = await renderHtmlPage(template, "/producto/je1");
    expect(page.status).toBe(200);
    const boot = JSON.parse(page.html.match(/<script id="cbg-boot" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    expect(boot.catalog.some((p: { id: string }) => p.id === "je1")).toBe(true);
    expect(boot.settings.contact.whatsappNumber).toBeTruthy();

    expect((await renderHtmlPage(template, "/producto/no-existe")).status).toBe(404);
    const admin = await renderHtmlPage(template, "/admin");
    expect(admin.robots).toContain("noindex");
    expect(admin.html).not.toContain("cbg-boot");
  });

  it("publishes a live sitemap with product images and an llms.txt summary from the catalog", async () => {
    const xml = await buildSitemapXml();
    expect(xml).toContain("<loc>https://correderamadrid.com/producto/je1</loc>");
    expect(xml).toContain("<image:loc>");
    const llms = await buildLlmsTxt();
    expect(llms).toContain("Calle de la Puebla");
    expect(llms).toContain("/producto/je1");
  });
});
