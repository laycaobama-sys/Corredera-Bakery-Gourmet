import { categories, parsePriceEuros, type MenuItem } from "../../shared/catalog";
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

export const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://correderagourmet.com").replace(/\/+$/, "");

const SHOP_CATEGORIES = new Set(["jamones_enteros", "sobres_jamon", "embutidos", "sobres_embutidos", "quesos", "aceites", "conservas", "vinos"]);
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
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd: object[];
  bodyHtml: string;
};

function productJsonLd(item: ManagedItem, settings: SiteSettings) {
  const price = priceNumber(item);
  const perKg = item.price.includes("/ kg");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/producto/${item.id}#product`,
    name: item.name,
    description: item.desc,
    image: abs(item.imageUrl || `/assets/products/${item.id}.jpg`),
    sku: item.id,
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

function productListHtml(items: ManagedItem[]) {
  return `<ul>${items
    .map((i) => `<li><a href="/producto/${esc(i.id)}">${esc(i.name)}</a> — ${esc(i.price)}${i.weightInfo ? ` · ${esc(i.weightInfo)}` : ""}</li>`)
    .join("")}</ul>`;
}

function contactHtml(s: SiteSettings) {
  return `<p>${esc(s.contact.addressLine)} · WhatsApp ${esc(s.contact.whatsappDisplay)} · Tel. ${esc(s.contact.landlineDisplay)} · ${esc(s.contact.contactEmail)}</p><p>Horario tienda gourmet: ${esc(s.schedule.gourmetHoursEs)} (${esc(s.schedule.gourmetClosedNoteEs)}). Bakery &amp; Café: ${esc(s.schedule.bakeryWeekdaysEs)}, ${esc(s.schedule.bakeryWeekendEs)}, ${esc(s.schedule.bakerySundayEs)}.</p>`;
}

const HOME_FAQ = (s: SiteSettings) => [
  { q: "¿Dónde comprar jamón ibérico 5 Jotas o Joselito en Madrid?", a: `En Corredera Gourmet, ${s.contact.addressLine}, entre Gran Vía y Malasaña. Puedes encargarlo en la web y recogerlo en tienda o recibirlo en casa.` },
  { q: "¿El corte y envasado del jamón entero tiene coste?", a: "No. Al encargar cualquiera de nuestros jamones enteros, el corte a cuchillo y el envasado al vacío son gratuitos." },
  { q: "¿Cómo se paga un pedido?", a: "No hay pago online: el pedido se envía por WhatsApp, confirmamos disponibilidad e importe y se paga al recoger en tienda o a la entrega." },
  { q: "¿Hacéis envíos a domicilio?", a: s.contact.shippingNoticeEs },
];

export async function buildSeoPage(rawPath: string): Promise<SeoPage> {
  const path = (rawPath.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  const settings = getSiteSettings();
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const shop = all.filter(isShopProduct);
  const s = settings;
  const homeDescription =
    "Jamones ibéricos 5 Jotas y Joselito con corte a cuchillo gratis, loncheados, embutidos, quesos y aceites AOVE. Tienda gourmet en Calle de la Puebla 15, Madrid.";
  const nav = `<nav><a href="/">Inicio</a> · <a href="/tienda">Tienda</a> · ${GOURMET_CATEGORY_PAGES.map((c) => `<a href="${c.path}">${esc(c.navLabelEs)}</a>`).join(" · ")}</nav>`;

  if (path === "/") {
    const featured = shop.filter((i) => i.featured).slice(0, 12);
    return {
      title: "Corredera Bakery & Gourmet | Ibéricos y gourmet en Madrid",
      description: homeDescription,
      canonical: `${SITE_URL}/`,
      image: abs(s.storefront.heroSlides[0]?.imageUrl ?? "/assets/home/hero-jamon.jpg"),
      jsonLd: [itemList("Los más vendidos de Corredera Gourmet", featured), faqPage(HOME_FAQ(s))],
      bodyHtml: `${nav}<h1>Corredera Gourmet: jamones ibéricos, embutidos, quesos y aceites en Madrid</h1><p>${esc(s.pages.aboutText1Es)}</p><p>${esc(s.pages.carvingTextEs)}</p><h2>Los más vendidos</h2>${productListHtml(featured)}<h2>Preguntas frecuentes</h2>${HOME_FAQ(s)
        .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
        .join("")}<h2>Visítanos</h2>${contactHtml(s)}`,
    };
  }

  if (path === "/tienda") {
    return {
      title: "Tienda gourmet online | Corredera Gourmet Madrid",
      description: `Compra online ${shop.length} productos gourmet: jamones ibéricos, loncheados de 100 g, embutidos de bellota, quesos, aceites AOVE, conservas y vinos. Recogida en Madrid o envío.`,
      canonical: `${SITE_URL}/tienda`,
      image: abs("/assets/home/hero-loncheado.jpg"),
      jsonLd: [breadcrumbs([{ name: "Inicio", url: "/" }, { name: "Tienda", url: "/tienda" }]), itemList("Tienda gourmet Corredera", shop)],
      bodyHtml: `${nav}<h1>Tienda gourmet</h1>${productListHtml(shop)}${contactHtml(s)}`,
    };
  }

  const catMatch = path.match(/^\/gourmet\/([a-z0-9-]+)$/);
  if (catMatch || path === "/bakery-cafe") {
    const slug = catMatch ? catMatch[1] : "bakery-cafe";
    const cfg = getGourmetCategoryBySlug(slug);
    if (cfg && cfg.isGourmetPrimary) {
      const items = cfg.filterItems(all).filter((i) => i.mode === "gourmet") as ManagedItem[];
      const dept = s.pages.departmentImages.find((d) => d.slug === slug)?.imageUrl ?? cfg.bannerImage;
      return {
        title: cfg.seoTitleEs,
        description: cfg.seoDescriptionEs,
        canonical: `${SITE_URL}${cfg.path}`,
        image: abs(dept),
        jsonLd: [
          breadcrumbs([{ name: "Inicio", url: "/" }, { name: "Tienda", url: "/tienda" }, { name: cfg.navLabelEs, url: cfg.path }]),
          itemList(cfg.titleEs, items),
          faqPage(cfg.faqs.map((f) => ({ q: f.questionEs, a: f.answerEs }))),
        ],
        bodyHtml: `${nav}<h1>${esc(cfg.titleEs)}</h1><p>${esc(cfg.subtitleEs)}</p><p>${esc(cfg.introEs)}</p>${productListHtml(items)}<h2>${esc(cfg.editorialTitleEs)}</h2><p>${esc(cfg.editorialBodyEs)}</p>${cfg.faqs
          .map((f) => `<h3>${esc(f.questionEs)}</h3><p>${esc(f.answerEs)}</p>`)
          .join("")}`,
      };
    }
    if (slug === "bakery-cafe") {
      const bakery = all.filter((i) => i.mode === "bakery");
      return {
        title: "Carta Bakery & Café | Desayunos y obrador en Madrid · Corredera",
        description: "Carta de desayunos, café, bollería artesana, bocadillos, tartas y barra gourmet de Corredera en Calle de la Puebla 15, Madrid.",
        canonical: `${SITE_URL}/bakery-cafe`,
        image: abs(s.pages.cartaPosterUrl),
        jsonLd: [
          breadcrumbs([{ name: "Inicio", url: "/" }, { name: "Carta Bakery & Café", url: "/bakery-cafe" }]),
          {
            "@context": "https://schema.org",
            "@type": "Menu",
            name: s.pages.cartaTitleEs,
            hasMenuSection: categories.bakery
              .filter((c) => c.id !== "todos")
              .map((c) => ({
                "@type": "MenuSection",
                name: c.es,
                hasMenuItem: bakery
                  .filter((i) => i.category === c.id)
                  .map((i) => ({ "@type": "MenuItem", name: i.name, description: i.desc, ...(priceNumber(i) ? { offers: { "@type": "Offer", price: priceNumber(i), priceCurrency: "EUR" } } : {}) })),
              })),
          },
        ],
        bodyHtml: `${nav}<h1>${esc(s.pages.cartaTitleEs)}</h1><p>${esc(s.pages.cartaIntroEs)}</p>${productListHtml(bakery)}${contactHtml(s)}`,
      };
    }
  }

  const prodMatch = path.match(/^\/producto\/([A-Za-z0-9_-]+)$/);
  if (prodMatch) {
    const item = all.find((i) => i.id === decodeURIComponent(prodMatch[1]));
    if (item) {
      const cat = GOURMET_CATEGORY_PAGES.find((c) => c.isGourmetPrimary && c.filterItems([item]).length > 0);
      const crumbs = [{ name: "Inicio", url: "/" }, ...(item.mode === "gourmet" ? [{ name: "Tienda", url: "/tienda" }] : [{ name: "Carta", url: "/bakery-cafe" }]), ...(cat ? [{ name: cat.navLabelEs, url: cat.path }] : []), { name: item.name, url: `/producto/${item.id}` }];
      return {
        title: `${item.name} · ${item.price} | Corredera Gourmet Madrid`.slice(0, 120),
        description: `${item.desc} ${item.weightInfo ?? item.unitInfo ?? ""} Compra en Corredera Gourmet, Madrid: recogida en tienda o envío a domicilio.`.replace(/\s+/g, " ").trim().slice(0, 300),
        canonical: `${SITE_URL}/producto/${item.id}`,
        image: abs(item.imageUrl || `/assets/products/${item.id}.jpg`),
        jsonLd: [productJsonLd(item, s), breadcrumbs(crumbs)],
        bodyHtml: `${nav}<h1>${esc(item.name)}</h1><p>Precio: ${esc(item.price)}${item.refPricePerKg ? ` (referencia ${esc(item.refPricePerKg)})` : ""}</p>${item.weightInfo ? `<p>${esc(item.weightInfo)}</p>` : ""}<p>${esc(item.desc)}</p>${item.freeCuttingService ? "<p>Incluye gratis el corte a cuchillo y el envasado al vacío.</p>" : ""}${contactHtml(s)}`,
      };
    }
  }

  return {
    title: "Corredera Bakery & Gourmet | Ibéricos y gourmet en Madrid",
    description: homeDescription,
    canonical: `${SITE_URL}${path}`,
    image: abs("/assets/home/hero-jamon.jpg"),
    jsonLd: [],
    bodyHtml: nav,
  };
}

/** Rewrites the static index.html head/body with the page's own SEO data. */
export function injectSeo(html: string, page: SeoPage): string {
  const replaceTag = (h: string, pattern: RegExp, value: string) => h.replace(pattern, (m) => m.replace(/content="[^"]*"/, `content="${esc(value)}"`));
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  out = replaceTag(out, /<meta\s+name="description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta property="og:title"[^>]*\/>/, page.title);
  out = replaceTag(out, /<meta\s+property="og:description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta property="og:url"[^>]*\/>/, page.canonical);
  out = replaceTag(out, /<meta property="og:image" [^>]*\/>/, page.image);
  out = replaceTag(out, /<meta property="og:image:secure_url"[^>]*\/>/, page.image);
  out = replaceTag(out, /<meta name="twitter:title"[^>]*\/>/, page.title);
  out = replaceTag(out, /<meta\s+name="twitter:description"[\s\S]*?\/>/, page.description);
  out = replaceTag(out, /<meta name="twitter:image" [^>]*\/>/, page.image);
  out = out.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(page.canonical)}" />`);
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
    `> Tienda gourmet en ${s.contact.addressLine}: jamones ibéricos 5 Jotas, Joselito y Dehesa de Extremadura con corte a cuchillo y envasado al vacío gratis, loncheados de 100 g, embutidos ibéricos de bellota, quesos seleccionados, aceites de oliva virgen extra, conservas y vinos. También obrador y cafetería (Bakery & Café).`,
    "",
    "## Cómo comprar",
    `- Pedidos desde ${SITE_URL}/tienda; se confirman por WhatsApp ${s.contact.whatsappDisplay}. Sin pago online: se paga al recoger o a la entrega.`,
    `- Recogida en ${s.contact.addressLine} o envío a domicilio. ${s.contact.shippingNoticeEs}`,
    `- Teléfono ${s.contact.landlineDisplay} · ${s.contact.contactEmail} · Instagram ${s.contact.instagramUrl}`,
    `- Horario tienda gourmet: ${s.schedule.gourmetHoursEs} (${s.schedule.gourmetClosedNoteEs}). Bakery & Café: ${s.schedule.bakeryWeekdaysEs}; ${s.schedule.bakeryWeekendEs}; ${s.schedule.bakerySundayEs}.`,
    "",
    "## Páginas",
    `- [Tienda completa](${SITE_URL}/tienda)`,
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
  return lines.join("\n");
}

export async function buildSitemapXml(): Promise<string> {
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; pr: string; img?: string; title?: string }[] = [
    { loc: "/", pr: "1.0" },
    { loc: "/?lang=en", pr: "0.9" },
    { loc: "/tienda", pr: "0.9" },
    ...GOURMET_CATEGORY_PAGES.map((c) => ({ loc: c.path, pr: c.isGourmetPrimary ? "0.8" : "0.6" })),
    ...all.filter((i) => i.mode === "gourmet").map((i) => ({ loc: `/producto/${i.id}`, pr: "0.6", img: abs(i.imageUrl || `/assets/products/${i.id}.jpg`), title: i.name })),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls.map(
      (u) =>
        `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.pr}</priority>${u.img ? `<image:image><image:loc>${esc(u.img)}</image:loc><image:title>${esc(u.title ?? "")}</image:title></image:image>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
}
