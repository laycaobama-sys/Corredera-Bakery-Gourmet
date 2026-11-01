import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FEATURED_IDS,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  buildWhatsAppOrderMessage,
  categories,
  filterCatalogItems,
  formatPrice,
  galleryImages,
  menuImageFor,
  menuImageStatusFor,
  menuItems,
  menuPriceStatusFor,
  normalizeSearchText,
  parsePriceEuros,
  whatsappUrl,
} from "../shared/catalog";
import { menuItems as sharedMenuItems } from "../shared/catalog";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettingsSchema";
import { buildProductCulinarySvg } from "../shared/productVisuals";
import { buildFallbackIllustrationSvg } from "./_core/storageProxy";

describe("Corredera catalog, single source of truth, 127 unique visuals & WhatsApp sales engine", () => {
  it("uses shared/catalog.ts as the single source of truth with 127 items (57 Bakery and 70 Gourmet) and unique IDs", () => {
    expect(menuItems).toBe(sharedMenuItems);
    expect(menuItems).toHaveLength(127);

    const bakeryItems = menuItems.filter((item) => item.mode === "bakery");
    const gourmetItems = menuItems.filter((item) => item.mode === "gourmet");
    expect(bakeryItems).toHaveLength(57);
    expect(gourmetItems).toHaveLength(70);

    const ids = menuItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(127);
  });

  it("ensures every menu item has bilingual ES/EN copy, valid category, price, and a 100% unique image URL and plate visual", () => {
    const validBakeryCats = new Set(categories.bakery.map((c) => c.id));
    const validGourmetCats = new Set(categories.gourmet.map((c) => c.id));
    const seenImageUrls = new Set<string>();
    const seenPlateSvgs = new Set<string>();

    for (const item of menuItems) {
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(item.nameEn.trim().length).toBeGreaterThan(0);
      expect(item.desc.trim().length).toBeGreaterThan(0);
      expect(item.descEn.trim().length).toBeGreaterThan(0);
      expect(item.price.trim().length).toBeGreaterThan(0);

      if (item.badge) {
        expect(item.badgeEn?.trim().length).toBeGreaterThan(0);
      }

      if (item.mode === "bakery") {
        expect(validBakeryCats.has(item.category)).toBe(true);
      } else {
        expect(validGourmetCats.has(item.category)).toBe(true);
      }

      const imageUrl = menuImageFor(item);
      expect(imageUrl).toMatch(/^\/(?:assets\/products|manus-storage\/async-images)\//);
      seenImageUrls.add(imageUrl);

      const plateSvg = buildProductCulinarySvg(item);
      expect(plateSvg).toContain("<svg");
      expect(plateSvg).toContain("ILUSTRACIÓN ORIENTATIVA");
      seenPlateSvgs.add(plateSvg);

      if (imageUrl.startsWith("/manus-storage/")) {
        const proxyKey = imageUrl.replace(/^\/manus-storage\//, "");
        const proxySvg = buildFallbackIllustrationSvg(proxyKey);
        expect(proxySvg).toBe(plateSvg);
      }

      expect(menuImageStatusFor(item)).toMatch(/specific generated|illustrative individual product reference/);
      expect(menuPriceStatusFor(item)).toMatch(/confirmed_by_owner|pending_owner_price_consultar/);
    }

    // Zero duplicate image URLs or SVG plates across all 127 references
    expect(seenImageUrls.size).toBe(127);
    expect(seenPlateSvgs.size).toBe(127);
  });

  it("verifies all top-of-page featured best-seller IDs exist in the catalog and cover key demand categories", () => {
    expect(FEATURED_IDS.length).toBeGreaterThanOrEqual(6);
    for (const id of FEATURED_IDS) {
      const found = menuItems.find((item) => item.id === id);
      expect(found).toBeDefined();
    }
  });

  it("verifies all kitchen / obsolete items are permanently removed and new poster & gourmet items are present", () => {
    const forbiddenIds = ["m1", "m2", "m3", "t1", "t2", "t3", "t4", "t5", "bo8", "bo9", "bo10", "bo11", "bo12", "b4", "b9", "g4", "g5", "g10", "g12", "g13", "g14", "g15"];
    for (const badId of forbiddenIds) {
      expect(menuItems.find((i) => i.id === badId)).toBeUndefined();
    }
    expect(menuItems.some((i) => i.name.toLowerCase().includes("huevos rotos"))).toBe(false);

    // Breakfast poster items & updated prices
    expect(menuItems.find((i) => i.id === "d5")?.price).toBe("11,99 €");
    expect(menuItems.find((i) => i.id === "d6")?.price).toBe("3,75 €");
    expect(menuItems.find((i) => i.id === "d7")?.price).toBe("4,50 €");
    expect(menuItems.find((i) => i.id === "d8")?.price).toBe("8,99 €");
    expect(menuItems.find((i) => i.id === "d9")?.price).toBe("7,50 €");
    expect(menuItems.find((i) => i.id === "d10")?.price).toBe("5,99 €");
    expect(menuItems.find((i) => i.id === "d11")?.price).toBe("5,99 €");
    expect(menuItems.find((i) => i.id === "d11")?.name).toContain("Perrito Caliente");

    // Whole Iberian hams with free cutting service
    expect(menuItems.find((i) => i.id === "je1")?.price).toBe("625,00 €");
    expect(menuItems.find((i) => i.id === "je2")?.price).toBe("670,00 €");
    expect(menuItems.find((i) => i.id === "je3")?.price).toBe("440,00 €");
    expect(menuItems.find((i) => i.id === "je4")?.price).toBe("280,00 €");
    expect(menuItems.find((i) => i.id === "je1")?.freeCuttingService).toBe(true);
  });

  it("supports diacritic-insensitive search (e.g. jamon, iberico, cafe, limon, salmon) and category filtering", () => {
    expect(normalizeSearchText("Jamón Ibérico Café Limón")).toBe("jamon iberico cafe limon");

    const jamonBakery = filterCatalogItems({
      mode: "bakery",
      category: "todos",
      query: "jamon",
    });
    expect(jamonBakery.map((i) => i.id)).toEqual(expect.arrayContaining(["d3", "d9", "b1", "b2", "b6"]));

    const ibericoGourmet = filterCatalogItems({
      mode: "gourmet",
      category: "todos",
      query: "iberico",
    });
    expect(ibericoGourmet.map((i) => i.id)).toEqual(
      expect.arrayContaining(["je4", "sj3", "sj4", "em3", "g1", "g2", "t14", "t15"])
    );

    const cafeBakery = filterCatalogItems({
      mode: "bakery",
      category: "cafeteria",
      query: "cafe",
    });
    expect(cafeBakery.length).toBeGreaterThanOrEqual(4);
  });

  it("routes all orders, reservations, and inquiries to official WhatsApp +34 640 34 19 32 and removes ig.me DM sales links", () => {
    expect(WHATSAPP_NUMBER).toBe("34640341932");
    expect(WHATSAPP_DISPLAY).toBe("+34 640 34 19 32");

    const url = whatsappUrl("Hola Corredera, quiero hacer un pedido.");
    expect(url).toContain("https://wa.me/34640341932?text=");
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Hola Corredera");

    const storefrontDir = path.resolve(import.meta.dirname, "..", "client", "src", "storefront");
    const storefrontSources = fs
      .readdirSync(storefrontDir, { recursive: true, encoding: "utf-8" })
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .map((f) => fs.readFileSync(path.join(storefrontDir, f), "utf-8"))
      .join("\n");
    expect(storefrontSources).not.toContain("ig.me/m/");
    // Social profiles are rendered from the CMS contact settings.
    expect(storefrontSources).toContain("c.instagramUrl");
    expect(storefrontSources).toContain("c.tiktokUrl");
    expect(DEFAULT_SITE_SETTINGS.contact.instagramUrl).toBe("https://www.instagram.com/correderagourmet");
    expect(DEFAULT_SITE_SETTINGS.contact.tiktokUrl).toBe("https://www.tiktok.com/@correderagourmet");
  });

  it("calculates euro prices and formats itemized WhatsApp order messages accurately for fixed, by-weight, and delivery items", () => {
    expect(parsePriceEuros("3,90 €")).toBeCloseTo(3.9);
    expect(parsePriceEuros("+2,00 €")).toBeCloseTo(2.0);
    expect(parsePriceEuros("2,50 € / unidad")).toBeCloseTo(2.5);
    expect(parsePriceEuros("Consultar")).toBeNull();

    const bocadillo = menuItems.find((i) => i.id === "b1")!;
    const jamon = menuItems.find((i) => i.id === "g1")!;
    const messageEs = buildWhatsAppOrderMessage({
      items: [
        { item: bocadillo, qty: 2 },
        { item: jamon, qty: 1 },
      ],
      modality: "pickup",
      customerName: "María",
      desiredTime: "Mañana 10:30",
      notes: "Cortado fino",
      lang: "es",
    });

    expect(messageEs).toContain("2x Bocadillo de Jamón Ibérico");
    expect(messageEs).toContain("1x Ración de Jamón Ibérico 100 % Bellota a Cuchillo");
    expect(messageEs).toContain("35,50 €");
    expect(messageEs).toContain("Recogida en el establecimiento");
    expect(messageEs).toContain("María");
    expect(messageEs).toContain("Mañana 10:30");

    // Verify by-weight only cart does not output 0,00 €
    const cheesecake = menuItems.find((i) => i.id === "t9")!;
    const wholeHam = menuItems.find((i) => i.id === "je1")!;
    const variableOnlyMsg = buildWhatsAppOrderMessage({
      items: [
        { item: cheesecake, qty: 1 },
      ],
      modality: "delivery",
      customerName: "Carlos",
      customerPhone: "+34 600 123 456",
      deliveryAddress: "Calle Mayor 10, Madrid",
      desiredTime: "",
      notes: "",
      lang: "es",
    });
    expect(variableOnlyMsg).not.toContain("0,00 €");
    expect(variableOnlyMsg).toContain("A confirmar según peso exacto al corte");
    expect(variableOnlyMsg).toContain("Entrega a domicilio");
    expect(variableOnlyMsg).toContain("Calle Mayor 10, Madrid");

    const wholeHamMsg = buildWhatsAppOrderMessage({
      items: [{ item: wholeHam, qty: 1 }],
      modality: "delivery",
      customerName: "Carlos",
      deliveryAddress: "Calle Mayor 10, Madrid",
      hamCuttingPreference: "free_sliced_vacuum",
      desiredTime: "",
      notes: "",
      lang: "es",
    });
    expect(wholeHamMsg).toContain("Cortado y envasado al vacío (servicio gratuito incluido)");
  });

  it("localizes 'Consultar' and per-unit prices in English without mutating Spanish data", () => {
    expect(formatPrice("Consultar", "es")).toBe("Consultar");
    expect(formatPrice("Consultar", "en")).toBe("Ask price");
    expect(formatPrice("2,50 € / unidad", "en")).toBe("2,50 € / unit");
    expect(formatPrice("3,90 €", "en")).toBe("3,90 €");
  });

  it("provides bilingual descriptions for all 11 gallery images", () => {
    expect(galleryImages).toHaveLength(11);
    for (const img of galleryImages) {
      expect(img.title.trim().length).toBeGreaterThan(0);
      expect(img.titleEn.trim().length).toBeGreaterThan(0);
      expect(img.text.trim().length).toBeGreaterThan(0);
      expect(img.textEn.trim().length).toBeGreaterThan(0);
    }
  });

  it("generates distinct category-aware SVG markup with explicit illustrative disclaimer for gallery /manus-storage/* paths", () => {
    const svgBakery = buildFallbackIllustrationSvg("async-images/0ph7XQEFnMSHaCSLsIo0WO/image-5.webp");
    const svgIbericos = buildFallbackIllustrationSvg("async-images/EujPgDIPcbtATsDhasLWVD/image-2.webp");
    const svgWine = buildFallbackIllustrationSvg("async-images/EujPgDIPcbtATsDhasLWVD/image-4.webp");

    expect(svgBakery).toContain("<svg");
    expect(svgBakery).toContain("CORREDERA");
    expect(svgBakery).toContain("ILUSTRACIÓN ORIENTATIVA");
    expect(svgBakery).not.toContain("<!doctype html>");

    expect(svgIbericos).toContain("IBÉRICOS DE BELLOTA");
    expect(svgWine).toContain("VINOS, VERMUT DE GRIFO");
    expect(svgBakery).not.toBe(svgIbericos);
    expect(svgIbericos).not.toBe(svgWine);
  });

  it("verifies real establishment assets exist in client/public/assets and CSS includes accessibility & reduced-motion support", () => {
    const logoPath = path.resolve(import.meta.dirname, "..", "client", "public", "assets", "brand", "corredera-logo.png");
    const interiorPath = path.resolve(import.meta.dirname, "..", "client", "public", "assets", "corredera-bakery-interior.jpg");
    expect(fs.existsSync(logoPath)).toBe(true);
    expect(fs.existsSync(interiorPath)).toBe(true);

    const cssPath = path.resolve(import.meta.dirname, "..", "client", "src", "index.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".skip-link");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain(".cg-fab");
    expect(css).toContain(".cg-cart__form");
    expect(css).toContain(".cg-card__media");
    expect(css).toContain(".cg-feature");
    expect(css).toContain("@media (max-width: 720px)");
  });

  it("validates Schema.org JSON-LD and metadata in client/index.html", () => {
    const htmlPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
    const html = fs.readFileSync(htmlPath, "utf-8");

    expect(html).toContain('rel="icon"');
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain("https://wa.me/34640341932");

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(jsonLdMatch).not.toBeNull();
    const parsed = JSON.parse(jsonLdMatch![1]);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(Array.isArray(parsed["@graph"])).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain("GourmetStore");
  });
});
