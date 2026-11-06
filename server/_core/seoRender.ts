import { categories, parsePriceEuros, productBrand, type MenuItem } from "../../shared/catalog";
import { GUIDE, GUIDE_ENTRIES, GUIDE_PATH } from "../../shared/guideJamon";
import { GOURMET_CATEGORY_PAGES, getGourmetCategoryBySlug } from "../../shared/gourmetRoutes";
import type { SiteSettings } from "../../shared/siteSettingsSchema";
import { listCatalogProducts } from "../catalogRepository";
import { getSiteSettings } from "../siteSettingsRepository";

/**
 * Server-side SEO for the single-page app: every HTML response gets the page's own title,
 * description, canonical, Open Graph tags, schema.org JSON-LD and a text snapshot of the
 * page inside #root (replaced by React on load). Search engines that don't run JavaScript
 * and AI assistants (ChatGPT, Claude, Perplexity, Gemini) can then read and cite each page.
 */

export const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://correderamadrid.com").replace(/\/+$/, "");

const SHOP_CATEGORIES = new Set(["jamones_enteros", "sobres_jamon", "embutidos", "sobres_embutidos", "quesos", "aceites", "conservas", "vinos", "fruteria", "carniceria"]);
const IN_STORE_ONLY = new Set(["g8", "g9", "g20", "g1", "g3"]);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const abs = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

function priceNumber(item: MenuItem) {
  const n = parsePriceEuros(item.price);
  return n === null ? null : n.toFixed(2);
}

export function isShopProduct(item: MenuItem) {
  return item.mode === "gourmet" && SHOP_CATEGORIES.has(item.category) && !IN_STORE_ONLY.has(item.id);
}

type ManagedItem = MenuItem & { imageUrl?: string; active?: boolean };

export type SeoPage = {
  lang: "es" | "en";
  alternates: { es: string; en: string };
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd: object[];
  bodyHtml: string;
};

function productJsonLd(item: ManagedItem, settings: SiteSettings, name: string, description: string, brand: string | null) {
  const price = priceNumber(item);
  const perKg = item.price.includes("/ kg");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/producto/${item.id}#product`,
    name,
    description,
    image: abs(item.imageUrl || `/assets/products/${item.id}.jpg`),
    sku: item.id,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    category: categoryLabel(item),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/producto/${item.id}`,
            priceCurrency: "EUR",
            price,
            ...(perKg
              ? { priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "EUR", unitCode: "KGM", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "KGM" } } }
              : {}),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: settings.legal.tradeName, "@id": `${SITE_URL}/#organization` },
            availableDeliveryMethod: ["https://schema.org/OnSitePickup", "https://schema.org/ParcelService"],
          },
        }
      : {}),
  };
}

function categoryLabel(item: MenuItem) {
  const page = GOURMET_CATEGORY_PAGES.find((c) => c.isGourmetPrimary && c.filterItems([item]).length > 0);
  return page?.navLabelEs ?? categories[item.mode].find((c) => c.id === item.category)?.es ?? item.category;
}

function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.url) })),
  };
}

function itemList(name: string, items: ManagedItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/producto/${it.id}`, name: it.name })),
  };
}

function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

function productListHtml(items: ManagedItem[], nameOf: (i: MenuItem) => string = (i) => i.name) {
  return `<ul>${items
    .map((i) => `<li><a href="/producto/${esc(i.id)}">${esc(nameOf(i))}</a> — ${esc(i.price)}${i.weightInfo ? ` · ${esc(i.weightInfo)}` : ""}</li>`)
    .join("")}</ul>`;
}

function contactHtml(s: SiteSettings) {
  return `<p>${esc(s.contact.addressLine)} · WhatsApp ${esc(s.contact.whatsappDisplay)} · Tel. ${esc(s.contact.landlineDisplay)} · ${esc(s.contact.contactEmail)}</p><p>Horario tienda gourmet: ${esc(s.schedule.gourmetHoursEs)} (${esc(s.schedule.gourmetClosedNoteEs)}). Bakery &amp; Café: ${esc(s.schedule.bakeryWeekdaysEs)}, ${esc(s.schedule.bakeryWeekendEs)}, ${esc(s.schedule.bakerySundayEs)}.</p>`;
}

const HOME_FAQ = (s: SiteSettings) => [
  { q: "¿Dónde comprar jamón ibérico 5 Jotas o Joselito en Madrid?", a: `En Corredera Gourmet, ${s.contact.addressLine}, entre Gran Vía y Malasaña. Puedes encargarlo en la web y recogerlo en tienda o recibirlo en casa.` },
  { q: "¿El corte y envasado del jamón entero tiene coste?", a: "No. Al encargar cualquiera de nuestros jamones enteros, el corte a cuchillo y el envasado al vacío son gratuitos." },
  { q: "¿Cómo se paga un pedido?", a: "No hay pago online: el pedido se envía por WhatsApp, confirmamos disponibilidad e importe y se paga al recoger en tienda o a la entrega." },
  { q: "¿Hay carnicería y frutería en Corredera?", a: `Sí. En el mismo local de ${s.contact.addressLine} tenemos carnicería (ternera, cerdo ibérico fresco, pollo, cordero y hamburguesas caseras cortadas al momento) y frutería con fruta y verdura fresca de temporada. Puedes encargar por WhatsApp y recoger o recibir en casa.` },
  { q: "¿Hacéis envíos a domicilio?", a: s.contact.shippingNoticeEs },
];

const HOME_FAQ_EN = (s: SiteSettings) => [
  { q: "Where can I buy 5 Jotas or Joselito Iberian ham in Madrid?", a: `At Corredera Gourmet, ${s.contact.addressLine}, between Gran Vía and Malasaña. Order online and pick up in store or have it delivered.` },
  { q: "Is carving a whole ham extra?", a: "No. When you order any of our whole hams, hand-carving and vacuum packing are free." },
  { q: "How do I pay?", a: "There is no online payment: your order is sent via WhatsApp, we confirm availability and amount, and you pay on pickup or delivery." },
  { q: "Is there a butcher and a greengrocer at Corredera?", a: `Yes. At ${s.contact.addressLine} we also have a butcher's counter (beef, fresh Iberian pork, chicken, lamb and homemade burgers cut to order) and a greengrocer with fresh seasonal fruit and vegetables.` },
  { q: "Do you deliver?", a: s.contact.shippingNoticeEn },
];

export async function buildSeoPage(rawPath: string): Promise<SeoPage> {
  const [pathPart, query = ""] = rawPath.split("#")[0].split("?");
  const path = (pathPart || "/").replace(/\/+$/, "") || "/";
  const en = new URLSearchParams(query).get("lang") === "en";
  const lang: SeoPage["lang"] = en ? "en" : "es";
  const canonicalOf = (p: string) => `${SITE_URL}${p}${en ? "?lang=en" : ""}`;
  const alternates = (p: string) => ({ es: `${SITE_URL}${p}`, en: `${SITE_URL}${p}?lang=en` });
  const settings = getSiteSettings();
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const shop = all.filter(isShopProduct);
  const s = settings;
  const nameOf = (i: MenuItem) => (en ? i.nameEn || i.name : i.name);
  const descOf = (i: MenuItem) => (en ? i.descEn || i.desc : i.desc);
  const listHtml = (items: ManagedItem[]) => productListHtml(items, nameOf);
  const homeDescription = en
    ? "5 Jotas, Joselito and Guijuelo Iberian hams with free hand-carving, charcuterie, cheeses and olive oils, plus butcher and greengrocer. Gourmet shop in central Madrid."
    : "Jamones ibéricos 5 Jotas y Joselito con corte a cuchillo gratis, embutidos, quesos y aceites AOVE, carnicería y frutería. Tienda gourmet en Calle de la Puebla 15, Madrid.";
  const nav = `<nav><a href="/">${en ? "Home" : "Inicio"}</a> · <a href="/tienda">${en ? "Shop" : "Tienda"}</a> · ${GOURMET_CATEGORY_PAGES.map((c) => `<a href="${c.path}">${esc(en ? c.navLabelEn : c.navLabelEs)}</a>`).join(" · ")} · <a href="${GUIDE_PATH}">${esc(en ? GUIDE.titleEn : GUIDE.titleEs)}</a></nav>`;
  const crumbHome = { name: en ? "Home" : "Inicio", url: "/" };
  const crumbShop = { name: en ? "Shop" : "Tienda", url: "/tienda" };

  if (path === "/") {
    const featured = shop.filter((i) => i.featured).slice(0, 12);
    const faqs = en ? HOME_FAQ_EN(s) : HOME_FAQ(s);
    return {
      lang,
      alternates: alternates("/"),
      title: en ? "Iberian Ham & Gourmet Shop in Madrid | Corredera" : "Corredera Bakery & Gourmet | Ibéricos y gourmet en Madrid",
      description: homeDescription,
      canonical: en ? `${SITE_URL}/?lang=en` : `${SITE_URL}/`,
      image: abs(s.storefront.heroSlides[0]?.imageUrl ?? "/assets/home/hero-jamon.jpg"),
      jsonLd: [itemList(en ? "Corredera Gourmet best sellers" : "Los más vendidos de Corredera Gourmet", featured), faqPage(faqs)],
      bodyHtml: `${nav}<h1>${en ? "Corredera Gourmet: Iberian ham, charcuterie, cheeses, olive oils, butcher and greengrocer in Madrid" : "Corredera Gourmet: jamones ibéricos, embutidos, quesos, aceites, carnicería y frutería en Madrid"}</h1><p>${esc(en ? s.pages.aboutText1En : s.pages.aboutText1Es)}</p><p>${esc(en ? s.pages.carvingTextEn : s.pages.carvingTextEs)}</p><h2>${en ? "Best sellers" : "Los más vendidos"}</h2>${listHtml(featured)}<h2>${en ? "Frequently asked questions" : "Preguntas frecuentes"}</h2>${faqs
        .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
        .join("")}<h2>${en ? "Visit us" : "Visítanos"}</h2>${contactHtml(s)}`,
    };
  }

  if (path === "/tienda") {
    return {
      lang,
      alternates: alternates(path),
      title: en ? "Online Gourmet Shop | Corredera Gourmet Madrid" : "Tienda gourmet online | Corredera Gourmet Madrid",
      description: en
        ? `Buy ${shop.length} gourmet products online: Iberian hams, 100 g sliced packs, acorn-fed charcuterie, cheeses, olive oils, meat and fresh fruit. Madrid pickup or delivery.`
        : `Compra online ${shop.length} productos gourmet: jamones ibéricos, loncheados de 100 g, embutidos de bellota, quesos, aceites AOVE, carne y fruta. Recogida en Madrid o envío.`,
      canonical: canonicalOf(path),
      image: abs("/assets/home/hero-loncheado.jpg"),
      jsonLd: [breadcrumbs([crumbHome, crumbShop]), itemList(en ? "Corredera gourmet shop" : "Tienda gourmet Corredera", shop)],
      bodyHtml: `${nav}<h1>${en ? "Gourmet shop" : "Tienda gourmet"}</h1>${listHtml(shop)}${contactHtml(s)}`,
    };
  }

  if (path === GUIDE_PATH) {
    const entries = GUIDE_ENTRIES.map((e) => ({ q: en ? e.qEn : e.qEs, a: en ? e.aEn : e.aEs }));
    const pieces = all.filter((i) => i.category === "jamones_enteros");
    return {
      lang,
      alternates: alternates(path),
      title: en ? GUIDE.seoTitleEn : GUIDE.seoTitleEs,
      description: en ? GUIDE.descriptionEn : GUIDE.descriptionEs,
      canonical: canonicalOf(path),
      image: abs("/assets/home/hero-jamon.jpg"),
      jsonLd: [breadcrumbs([crumbHome, { name: en ? GUIDE.titleEn : GUIDE.titleEs, url: path }]), faqPage(entries), itemList(en ? "Iberian hams and shoulders" : "Jamones y paletas ibéricas", pieces)],
      bodyHtml: `${nav}<h1>${esc(en ? GUIDE.titleEn : GUIDE.titleEs)}</h1><p>${esc(en ? GUIDE.introEn : GUIDE.introEs)}</p>${entries.map((f) => `<h2>${esc(f.q)}</h2><p>${esc(f.a)}</p>`).join("")}${listHtml(pieces)}${contactHtml(s)}`,
    };
  }

  const catMatch = path.match(/^\/gourmet\/([a-z0-9-]+)$/);
  if (catMatch || path === "/bakery-cafe") {
    const slug = catMatch ? catMatch[1] : "bakery-cafe";
    const cfg = getGourmetCategoryBySlug(slug);
    if (cfg && cfg.isGourmetPrimary) {
      const items = cfg.filterItems(all).filter((i) => i.mode === "gourmet") as ManagedItem[];
      const dept = s.pages.departmentImages.find((d) => d.slug === slug)?.imageUrl ?? cfg.bannerImage;
      const faqs = cfg.faqs.map((f) => ({ q: en ? f.questionEn : f.questionEs, a: en ? f.answerEn : f.answerEs }));
      return {
        lang,
        alternates: alternates(cfg.path),
        title: en ? cfg.seoTitleEn : cfg.seoTitleEs,
        description: en ? cfg.seoDescriptionEn : cfg.seoDescriptionEs,
        canonical: canonicalOf(cfg.path),
        image: abs(dept),
        jsonLd: [breadcrumbs([crumbHome, crumbShop, { name: en ? cfg.navLabelEn : cfg.navLabelEs, url: cfg.path }]), itemList(en ? cfg.titleEn : cfg.titleEs, items), faqPage(faqs)],
        bodyHtml: `${nav}<h1>${esc(en ? cfg.titleEn : cfg.titleEs)}</h1><p>${esc(en ? cfg.subtitleEn : cfg.subtitleEs)}</p><p>${esc(en ? cfg.introEn : cfg.introEs)}</p>${listHtml(items)}<h2>${esc(en ? cfg.editorialTitleEn : cfg.editorialTitleEs)}</h2><p>${esc(en ? cfg.editorialBodyEn : cfg.editorialBodyEs)}</p>${faqs
          .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
          .join("")}`,
      };
    }
    if (slug === "bakery-cafe") {
      const bakery = all.filter((i) => i.mode === "bakery");
      return {
        lang,
        alternates: alternates("/bakery-cafe"),
        title: en ? "Bakery & Café Menu | Breakfast and bakery in Madrid · Corredera" : "Carta Bakery & Café | Desayunos y obrador en Madrid · Corredera",
        description: en
          ? "Breakfast, coffee, artisan pastries, sandwiches, cakes and gourmet bar menu at Corredera, Calle de la Puebla 15, Madrid."
          : "Carta de desayunos, café, bollería artesana, bocadillos, tartas y barra gourmet de Corredera en Calle de la Puebla 15, Madrid.",
        canonical: canonicalOf("/bakery-cafe"),
        image: abs(s.pages.cartaPosterUrl),
        jsonLd: [
          breadcrumbs([crumbHome, { name: en ? "Bakery & Café menu" : "Carta Bakery & Café", url: "/bakery-cafe" }]),
          {
            "@context": "https://schema.org",
            "@type": "Menu",
            name: en ? s.pages.cartaTitleEn : s.pages.cartaTitleEs,
            hasMenuSection: categories.bakery
              .filter((c) => c.id !== "todos")
              .map((c) => ({
                "@type": "MenuSection",
                name: en ? c.en : c.es,
                hasMenuItem: bakery
                  .filter((i) => i.category === c.id)
                  .map((i) => ({ "@type": "MenuItem", name: nameOf(i), description: descOf(i), ...(priceNumber(i) ? { offers: { "@type": "Offer", price: priceNumber(i), priceCurrency: "EUR" } } : {}) })),
              })),
          },
        ],
        bodyHtml: `${nav}<h1>${esc(en ? s.pages.cartaTitleEn : s.pages.cartaTitleEs)}</h1><p>${esc(en ? s.pages.cartaIntroEn : s.pages.cartaIntroEs)}</p>${listHtml(bakery)}${contactHtml(s)}`,
      };
    }
  }

  const prodMatch = path.match(/^\/producto\/([A-Za-z0-9_-]+)$/);
  if (prodMatch) {
    const item = all.find((i) => i.id === decodeURIComponent(prodMatch[1]));
    if (item) {
      const cat = GOURMET_CATEGORY_PAGES.find((c) => c.isGourmetPrimary && c.filterItems([item]).length > 0);
      const crumbs = [crumbHome, ...(item.mode === "gourmet" ? [crumbShop] : [{ name: en ? "Menu" : "Carta", url: "/bakery-cafe" }]), ...(cat ? [{ name: en ? cat.navLabelEn : cat.navLabelEs, url: cat.path }] : []), { name: nameOf(item), url: `/producto/${item.id}` }];
      const hasPrice = priceNumber(item) !== null;
      const brand = productBrand(item);
      const priceText = hasPrice ? ` · ${item.price}` : "";
      const info = en ? item.weightInfoEn ?? item.unitInfoEn ?? "" : item.weightInfo ?? item.unitInfo ?? "";
      return {
        lang,
        alternates: alternates(`/producto/${item.id}`),
        title: `${nameOf(item)}${priceText} | Corredera Gourmet Madrid`.slice(0, 120),
        description: `${descOf(item)} ${info} ${en ? "Buy at Corredera Gourmet, Madrid: store pickup or home delivery." : "Compra en Corredera Gourmet, Madrid: recogida en tienda o envío a domicilio."}`.replace(/\s+/g, " ").trim().slice(0, 300),
        canonical: canonicalOf(`/producto/${item.id}`),
        image: abs(item.imageUrl || `/assets/products/${item.id}.jpg`),
        // Google rejects Product markup without a price, so items priced on request only get breadcrumbs.
        jsonLd: [...(hasPrice ? [productJsonLd(item, s, nameOf(item), descOf(item), brand)] : []), breadcrumbs(crumbs)],
        bodyHtml: `${nav}<h1>${esc(nameOf(item))}</h1>${brand ? `<p>${en ? "Brand" : "Marca"}: ${esc(brand)}</p>` : ""}<p>${en ? "Price" : "Precio"}: ${esc(hasPrice ? item.price : en ? "ask on WhatsApp" : "a consultar por WhatsApp")}${item.refPricePerKg ? ` (${en ? "reference" : "referencia"} ${esc(item.refPricePerKg)})` : ""}</p>${info ? `<p>${esc(info)}</p>` : ""}<p>${esc(descOf(item))}</p>${item.freeCuttingService ? `<p>${en ? "Free hand-carving and vacuum packing included." : "Incluye gratis el corte a cuchillo y el envasado al vacío."}</p>` : ""}${contactHtml(s)}`,
      };
    }
  }

  return {
    lang,
    alternates: alternates(path),
    title: "Corredera Bakery & Gourmet | Ibéricos y gourmet en Madrid",
    description: homeDescription,
    canonical: canonicalOf(path),
    image: abs("/assets/home/hero-jamon.jpg"),
    jsonLd: [],
    bodyHtml: nav,
  };
}

/** Rewrites the static index.html head/body with the page's own SEO data. */
export function injectSeo(html: string, page: SeoPage): string {
  const replaceTag = (h: string, pattern: RegExp, value: string) => h.replace(pattern, (m) => m.replace(/content="[^"]*"/, `content="${esc(value)}"`));
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${page.lang}"`);
  out = replaceTag(out, /<meta\s+name="description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta property="og:title"[^>]*\/>/, page.title);
  out = replaceTag(out, /<meta\s+property="og:description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta property="og:url"[^>]*\/>/, page.canonical);
  out = replaceTag(out, /<meta property="og:image" [^>]*\/>/, page.image);
  out = replaceTag(out, /<meta property="og:image:secure_url"[^>]*\/>/, page.image);
  out = replaceTag(out, /<meta property="og:locale" [^>]*\/>/, page.lang === "en" ? "en_US" : "es_ES");
  out = replaceTag(out, /<meta property="og:locale:alternate"[^>]*\/>/, page.lang === "en" ? "es_ES" : "en_US");
  out = replaceTag(out, /<meta name="twitter:title"[^>]*\/>/, page.title);
  out = replaceTag(out, /<meta\s+name="twitter:description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta name="twitter:image" [^>]*\/>/, page.image);
  out = out.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(page.canonical)}" />`);
  out = out.replace(/<link rel="alternate" hreflang="es" href="[^"]*" \/>/, `<link rel="alternate" hreflang="es" href="${esc(page.alternates.es)}" />`);
  out = out.replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${esc(page.alternates.en)}" />`);
  out = out.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/, `<link rel="alternate" hreflang="x-default" href="${esc(page.alternates.es)}" />`);
  const ld = page.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n    ");
  if (ld) out = out.replace("</head>", `    ${ld}\n  </head>`);
  return out.replace('<div id="root"></div>', `<div id="root"><div class="seo-snapshot" hidden>${page.bodyHtml}</div></div>`);
}

/** Plain-text summary for AI assistants, always in sync with the catalog and the CMS. */
export async function buildLlmsTxt(): Promise<string> {
  const s = getSiteSettings();
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const lines: string[] = [
    `# ${s.legal.tradeName} (Madrid)`,
    "",
    `> Tienda gourmet, carnicería y frutería en ${s.contact.addressLine} (entre Gran Vía y Malasaña): jamones ibéricos 5 Jotas, Joselito y Dehesa de Extremadura con corte a cuchillo y envasado al vacío gratis, loncheados de 100 g, embutidos ibéricos de bellota, quesos seleccionados, aceites de oliva virgen extra, conservas y vinos; carne cortada al momento (ternera, cerdo ibérico fresco, pollo, cordero, hamburguesas caseras) y fruta y verdura fresca de temporada con cestas por encargo. También obrador y cafetería (Bakery & Café).`,
    "",
    "## Cómo comprar",
    `- Pedidos desde ${SITE_URL}/tienda; se confirman por WhatsApp ${s.contact.whatsappDisplay}. Sin pago online: se paga al recoger o a la entrega.`,
    `- Recogida en ${s.contact.addressLine} o envío a domicilio. ${s.contact.shippingNoticeEs}`,
    `- Teléfono ${s.contact.landlineDisplay} · ${s.contact.contactEmail} · Instagram ${s.contact.instagramUrl}`,
    `- Horario tienda gourmet: ${s.schedule.gourmetHoursEs} (${s.schedule.gourmetClosedNoteEs}). Bakery & Café: ${s.schedule.bakeryWeekdaysEs}; ${s.schedule.bakeryWeekendEs}; ${s.schedule.bakerySundayEs}.`,
    "",
    "## Páginas",
    `- [Tienda completa](${SITE_URL}/tienda)`,
    `- [${GUIDE.titleEs}](${SITE_URL}${GUIDE_PATH}): ${GUIDE.descriptionEs}`,
    ...GOURMET_CATEGORY_PAGES.map((c) => `- [${c.navLabelEs}](${SITE_URL}${c.path}): ${c.seoDescriptionEs}`),
    "",
  ];
  for (const cfg of GOURMET_CATEGORY_PAGES.filter((c) => c.isGourmetPrimary)) {
    const items = cfg.filterItems(all).filter((i) => i.mode === "gourmet");
    if (!items.length) continue;
    lines.push(`## ${cfg.titleEs}`, ...items.map((i) => `- [${i.name}](${SITE_URL}/producto/${i.id}): ${i.price}${i.weightInfo ? ` · ${i.weightInfo}` : ""}`), "");
  }
  const bakery = all.filter((i) => i.mode === "bakery");
  lines.push("## Carta Bakery & Café (consumo en local)", ...bakery.map((i) => `- ${i.name}: ${i.price}`), "");
  lines.push("## Preguntas frecuentes", ...GUIDE_ENTRIES.flatMap((e) => [`### ${e.qEs}`, e.aEs]), "");
  return lines.join("\n");
}

export async function buildSitemapXml(): Promise<string> {
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; pr: string; img?: string; title?: string }[] = [
    { loc: "/", pr: "1.0" },
    { loc: "/tienda", pr: "0.9" },
    { loc: GUIDE_PATH, pr: "0.7" },
    ...GOURMET_CATEGORY_PAGES.map((c) => ({ loc: c.path, pr: c.isGourmetPrimary ? "0.8" : "0.6" })),
    ...all.map((i) => ({ loc: `/producto/${i.id}`, pr: i.mode === "gourmet" ? "0.6" : "0.4", img: abs(i.imageUrl || `/assets/products/${i.id}.jpg`), title: i.name })),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls.map(
      (u) =>
        `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.pr}</priority><xhtml:link rel="alternate" hreflang="es" href="${esc(SITE_URL + u.loc)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(`${SITE_URL}${u.loc}?lang=en`)}"/>${u.img ? `<image:image><image:loc>${esc(u.img)}</image:loc><image:title>${esc(u.title ?? "")}</image:title></image:image>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
}
