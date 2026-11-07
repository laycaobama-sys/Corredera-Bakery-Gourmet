import { categories, parsePriceEuros, productBrand, type MenuItem } from "../../shared/catalog";
import { BRAND_NAME, bakeryMeta, homeFaqs, homeMeta, productDescription, productMeta, productName, selectBestSellers, shopMeta } from "../../shared/seoCopy";
import { CONTENT_PAGES, getContentPage, type ContentPage, type ContentTable } from "../../shared/contentPages";
import { GUIDE, GUIDE_ENTRIES, GUIDE_PATH } from "../../shared/guideJamon";
import { GOURMET_CATEGORY_PAGES, getGourmetCategoryBySlug } from "../../shared/gourmetRoutes";
import { productNotes } from "../../shared/productCopy";
import { PRODUCT_HOVER_PHOTOS } from "../../shared/productHoverPhotos";
import { heroSrcSet, productIdFromParam, productPath, versionedProductImage } from "../../shared/productUrls";
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

/**
 * What the visitor sees before the app starts: logo, page title and main photo, using the same image
 * address the app uses so nothing downloads twice. React replaces it when it loads.
 */
function firstPaintHtml(page: SeoPage) {
  const heading = page.bodyHtml.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "";
  const src = versionedProductImage(page.image.startsWith(SITE_URL) ? page.image.slice(SITE_URL.length) : page.image);
  const srcset = heroSrcSet(src);
  const sizes = "(max-width: 1024px) 100vw, 70vw";
  return {
    preload: `<link rel="preload" as="image" href="${esc(src)}"${srcset ? ` imagesrcset="${esc(srcset)}" imagesizes="${sizes}"` : ""} fetchpriority="high" />`,
    html: `<div class="cg-fp" aria-hidden="true"><div class="cg-fp__bar"><img src="/assets/brand/corredera-lockup.png" alt="" width="640" height="153" /></div><p class="cg-fp__title">${heading}</p><img class="cg-fp__img" src="${esc(src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="${sizes}"` : ""} alt="" fetchpriority="high" /></div>`,
  };
}

function productJsonLd(item: ManagedItem, settings: SiteSettings, name: string, description: string, brand: string | null) {
  const price = priceNumber(item);
  const perKg = item.price.includes("/ kg");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}${productPath(item.id)}#product`,
    name,
    description,
    image: productImages(item),
    sku: item.id,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    category: categoryLabel(item),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}${productPath(item.id)}`,
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

function productImages(item: ManagedItem) {
  const main = abs(item.imageUrl || `/assets/products/${item.id}.jpg`);
  const second = PRODUCT_HOVER_PHOTOS[item.id];
  return second && (!item.imageUrl || item.imageUrl === `/assets/products/${item.id}.jpg`) ? [main, abs(`/assets/products/${second}.jpg`)] : [main];
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
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${productPath(it.id)}`, name: it.name })),
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
    .map((i) => `<li><a href="${esc(productPath(i.id))}">${esc(nameOf(i))}</a> — ${esc(i.price)}${i.weightInfo ? ` · ${esc(i.weightInfo)}` : ""}</li>`)
    .join("")}</ul>`;
}

function contactHtml(s: SiteSettings) {
  return `<p>${esc(s.contact.addressLine)} · WhatsApp ${esc(s.contact.whatsappDisplay)} · Tel. ${esc(s.contact.landlineDisplay)} · ${esc(s.contact.contactEmail)}</p><p>Horario tienda gourmet: ${esc(s.schedule.gourmetHoursEs)} (${esc(s.schedule.gourmetClosedNoteEs)}). Bakery &amp; Café: ${esc(s.schedule.bakeryWeekdaysEs)}, ${esc(s.schedule.bakeryWeekendEs)}, ${esc(s.schedule.bakerySundayEs)}.</p>`;
}

function notesHtml(item: MenuItem, en: boolean) {
  const notes = productNotes(item);
  if (!notes) return "";
  return `<h2>${en ? "How to serve and store it" : "Cómo se sirve y se conserva"}</h2><p>${esc(en ? notes.serveEn : notes.serveEs)}</p><p>${esc(en ? notes.keepEn : notes.keepEs)}</p><ul>${notes.links
    .map((l) => `<li><a href="${esc(l.href)}">${esc(en ? l.en : l.es)}</a></li>`)
    .join("")}</ul>`;
}

function tableHtml(table: ContentTable, en: boolean) {
  const head = en ? table.headEn : table.headEs;
  const rows = en ? table.rowsEn : table.rowsEs;
  return `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

const ORGANIZATION_REF = { "@id": `${SITE_URL}/#organization` };

function contentSeoPage(
  page: ContentPage,
  ctx: { lang: SeoPage["lang"]; s: SiteSettings; all: ManagedItem[]; nav: string; listHtml: (items: ManagedItem[]) => string; canonical: string; alternates: SeoPage["alternates"]; crumbHome: { name: string; url: string } },
): SeoPage {
  const en = ctx.lang === "en";
  const title = en ? page.titleEn : page.titleEs;
  const description = en ? page.descriptionEn : page.descriptionEs;
  const answer = en ? page.answerEn : page.answerEs;
  const image = abs(page.image);
  const byId = new Map(ctx.all.map((i) => [i.id, i]));
  const products = page.productIds.map((id) => byId.get(id)).filter((i): i is ManagedItem => Boolean(i));
  const faqs = page.faqs.map((f) => ({ q: en ? f.qEn : f.qEs, a: en ? f.aEn : f.aEs }));
  const productsTitle = en ? page.productsTitleEn : page.productsTitleEs;
  const crumbs = [ctx.crumbHome, ...(page.kind === "guide" ? [{ name: en ? "Ham guide" : "Guía del jamón", url: GUIDE_PATH }] : []), { name: title, url: page.path }];
  const main =
    page.kind === "service"
      ? { "@context": "https://schema.org", "@type": "Service", name: title, description, serviceType: en ? "Ham carving and vacuum packing" : "Corte de jamón a cuchillo y envasado al vacío", provider: ORGANIZATION_REF, areaServed: { "@type": "City", name: "Madrid" }, url: ctx.canonical, image }
      : { "@context": "https://schema.org", "@type": "Article", headline: title, description, image, inLanguage: en ? "en" : "es", datePublished: page.published, dateModified: page.updated, author: ORGANIZATION_REF, publisher: ORGANIZATION_REF, mainEntityOfPage: ctx.canonical };
  return {
    lang: ctx.lang,
    alternates: ctx.alternates,
    title: en ? page.seoTitleEn : page.seoTitleEs,
    description,
    canonical: ctx.canonical,
    image,
    jsonLd: [breadcrumbs(crumbs), main, faqPage(faqs), ...(products.length ? [itemList(productsTitle, products)] : [])],
    bodyHtml: `${ctx.nav}<h1>${esc(title)}</h1><p>${esc(answer)}</p>${page.sections
      .map((sec) => {
        const paragraphs = (en ? sec.pEn : sec.pEs) ?? [];
        const list = (en ? sec.listEn : sec.listEs) ?? [];
        return `<h2>${esc(en ? sec.hEn : sec.hEs)}</h2>${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${list.length ? `<ul>${list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : ""}${sec.table ? tableHtml(sec.table, en) : ""}`;
      })
      .join("")}${products.length ? `<h2>${esc(productsTitle)}</h2>${ctx.listHtml(products)}` : ""}<h2>${en ? "Frequently asked questions" : "Preguntas frecuentes"}</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}<ul>${page.links
      .map((l) => `<li><a href="${esc(l.href)}">${esc(en ? l.en : l.es)}</a></li>`)
      .join("")}</ul>${contactHtml(ctx.s)}`,
  };
}

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
  const nameOf = (i: MenuItem) => productName(i, lang);
  const descOf = (i: MenuItem) => productDescription(i, lang);
  const listHtml = (items: ManagedItem[]) => productListHtml(items, nameOf);
  const home = homeMeta(lang);
  const nav = `<nav><a href="/">${en ? "Home" : "Inicio"}</a> · <a href="/tienda">${en ? "Shop" : "Tienda"}</a> · ${GOURMET_CATEGORY_PAGES.map((c) => `<a href="${c.path}">${esc(en ? c.navLabelEn : c.navLabelEs)}</a>`).join(" · ")} · <a href="${GUIDE_PATH}">${esc(en ? GUIDE.titleEn : GUIDE.titleEs)}</a> · ${CONTENT_PAGES.map((p) => `<a href="${p.path}">${esc(en ? p.titleEn : p.titleEs)}</a>`).join(" · ")}</nav>`;
  const crumbHome = { name: en ? "Home" : "Inicio", url: "/" };
  const crumbShop = { name: en ? "Shop" : "Tienda", url: "/tienda" };

  if (path === "/") {
    const featured = selectBestSellers(shop);
    const faqs = homeFaqs(s.contact, lang);
    return {
      lang,
      alternates: alternates("/"),
      title: home.title,
      description: home.description,
      canonical: en ? `${SITE_URL}/?lang=en` : `${SITE_URL}/`,
      image: abs(s.storefront.heroSlides[0]?.imageUrl ?? "/assets/home/hero-jamon.jpg"),
      jsonLd: [itemList(en ? "Corredera Gourmet best sellers" : "Los más vendidos de Corredera Gourmet", featured), faqPage(faqs)],
      bodyHtml: `${nav}<h1>${esc(home.h1)}</h1><p>${esc(en ? s.pages.aboutText1En : s.pages.aboutText1Es)}</p><p>${esc(en ? s.pages.carvingTextEn : s.pages.carvingTextEs)}</p><h2>${en ? "Best sellers" : "Los más vendidos"}</h2>${listHtml(featured)}<h2>${en ? "Frequently asked questions" : "Preguntas frecuentes"}</h2>${faqs
        .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
        .join("")}<h2>${en ? "Visit us" : "Visítanos"}</h2>${contactHtml(s)}`,
    };
  }

  if (path === "/tienda") {
    return {
      lang,
      alternates: alternates(path),
      ...shopMeta(lang),
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
        ...bakeryMeta(lang),
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

  const contentPage = getContentPage(path);
  if (contentPage) return contentSeoPage(contentPage, { lang, s, all, nav, listHtml, canonical: canonicalOf(path), alternates: alternates(path), crumbHome });

  const prodMatch = path.match(/^\/producto\/([A-Za-z0-9_-]+)$/);
  if (prodMatch) {
    const item = all.find((i) => i.id === productIdFromParam(decodeURIComponent(prodMatch[1])));
    if (item) {
      const cat = GOURMET_CATEGORY_PAGES.find((c) => c.isGourmetPrimary && c.filterItems([item]).length > 0);
      const crumbs = [crumbHome, ...(item.mode === "gourmet" ? [crumbShop] : [{ name: en ? "Menu" : "Carta", url: "/bakery-cafe" }]), ...(cat ? [{ name: en ? cat.navLabelEn : cat.navLabelEs, url: cat.path }] : []), { name: nameOf(item), url: productPath(item.id) }];
      const hasPrice = priceNumber(item) !== null;
      const brand = productBrand(item);
      const related = all.filter((i) => i.id !== item.id && i.category === item.category).slice(0, 4);
      const info = en ? item.weightInfoEn ?? item.unitInfoEn ?? "" : item.weightInfo ?? item.unitInfo ?? "";
      return {
        lang,
        alternates: alternates(productPath(item.id)),
        ...productMeta(item, lang),
        canonical: canonicalOf(productPath(item.id)),
        image: abs(item.imageUrl || `/assets/products/${item.id}.jpg`),
        // Google rejects Product markup without a price, so items priced on request only get breadcrumbs.
        jsonLd: [...(hasPrice ? [productJsonLd(item, s, nameOf(item), descOf(item), brand)] : []), breadcrumbs(crumbs)],
        bodyHtml: `${nav}<h1>${esc(nameOf(item))}</h1>${brand ? `<p>${en ? "Brand" : "Marca"}: ${esc(brand)}</p>` : ""}<p>${en ? "Price" : "Precio"}: ${esc(hasPrice ? item.price : en ? "ask on WhatsApp" : "a consultar por WhatsApp")}${item.refPricePerKg ? ` (${en ? "reference" : "referencia"} ${esc(item.refPricePerKg)})` : ""}</p>${info ? `<p>${esc(info)}</p>` : ""}<p>${esc(descOf(item))}</p>${item.freeCuttingService ? `<p>${en ? "Free hand-carving and vacuum packing included." : "Incluye gratis el corte a cuchillo y el envasado al vacío."}</p>` : ""}${notesHtml(item, en)}${related.length ? `<h2>${en ? "You may also like" : "Quizás también te interese"}</h2>${listHtml(related)}` : ""}${contactHtml(s)}`,
      };
    }
  }

  return {
    lang,
    alternates: alternates(path),
    title: en ? `Page not found | ${BRAND_NAME}` : `Página no encontrada | ${BRAND_NAME}`,
    description: home.description,
    canonical: canonicalOf(path),
    image: abs("/assets/home/hero-jamon.jpg"),
    jsonLd: [],
    bodyHtml: `${nav}<h1>${en ? "We couldn't find this page" : "No hemos encontrado esta página"}</h1>`,
  };
}

/** Rewrites the static index.html head/body with the page's own SEO data. */
export function injectSeo(html: string, page: SeoPage): string {
  const replaceTag = (h: string, pattern: RegExp, value: string) => h.replace(pattern, (m) => m.replace(/content="[^"]*"/, `content="${esc(value)}"`));
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  const verification = [
    process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
    process.env.BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${esc(process.env.BING_SITE_VERIFICATION)}" />`,
  ].filter(Boolean);
  if (verification.length) out = out.replace("</head>", `    ${verification.join("\n    ")}\n  </head>`);
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
  const first = firstPaintHtml(page);
  // Each page preloads its own main photo, not the home page's.
  out = out.replace(/<link rel="preload" as="image" href="\/assets\/home\/hero-jamon\.jpg"[^>]*\/>/, () => first.preload);
  return out.replace('<div id="root"></div>', () => `<div id="root">${first.html}<div class="seo-snapshot" hidden>${page.bodyHtml}</div></div>`);
}

/** Plain-text summary for AI assistants, always in sync with the catalog and the CMS. */
export async function buildLlmsTxt(): Promise<string> {
  const s = getSiteSettings();
  const all = (await listCatalogProducts({ includeInactive: false })) as ManagedItem[];
  const lines: string[] = [
    `# ${BRAND_NAME} (Madrid)`,
    "",
    `> ${BRAND_NAME}, también conocida como Corredera Madrid (correderamadrid.com), es un comercio de alimentación en ${s.contact.addressLine}, entre Gran Vía y Malasaña. No son las calles Corredera Alta y Corredera Baja de San Pablo, aunque está junto a ellas.`,
    "",
    "## Datos clave",
    `- Qué es: tienda gourmet con carnicería y frutería, y Corredera Bakery & Café en el mismo local. Razón social: ${s.legal.companyName}.`,
    `- Dirección: ${s.contact.addressLine}. Metro cercano: Callao, Gran Vía y Tribunal.`,
    `- Teléfono: ${s.contact.landlineDisplay}. WhatsApp: ${s.contact.whatsappDisplay}. Email: ${s.contact.contactEmail}.`,
    "- Jamones: 5 Jotas, Joselito, Dehesa de Extremadura, Guijuelo y cebo de campo, además de paletas.",
    "- Servicio: corte a cuchillo y envasado al vacío gratis al comprar un jamón entero.",
    "- Otros productos: sobres de 100 g, embutidos, quesos, aceites de oliva virgen extra, conservas y vinos; carne cortada al momento; fruta y verdura.",
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
    ...CONTENT_PAGES.map((p) => `- [${p.titleEs}](${SITE_URL}${p.path}): ${p.descriptionEs}`),
    ...GOURMET_CATEGORY_PAGES.map((c) => `- [${c.navLabelEs}](${SITE_URL}${c.path}): ${c.seoDescriptionEs}`),
    "",
  ];
  for (const cfg of GOURMET_CATEGORY_PAGES.filter((c) => c.isGourmetPrimary)) {
    const items = cfg.filterItems(all).filter((i) => i.mode === "gourmet");
    if (!items.length) continue;
    lines.push(`## ${cfg.titleEs}`, ...items.map((i) => `- [${i.name}](${SITE_URL}${productPath(i.id)}): ${i.price}${i.weightInfo ? ` · ${i.weightInfo}` : ""}`), "");
  }
  const bakery = all.filter((i) => i.mode === "bakery");
  lines.push("## Carta Bakery & Café (consumo en local)", ...bakery.map((i) => `- ${i.name}: ${i.price}`), "");
  lines.push("## Preguntas frecuentes", ...GUIDE_ENTRIES.flatMap((e) => [`### ${e.qEs}`, e.aEs]), "");
  return lines.join("\n");
}

/** Last deliberate content change of pages that are not tied to a product. */
const PAGES_UPDATED = "2026-11-07";
const day = (iso?: string) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : PAGES_UPDATED);
const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), PAGES_UPDATED);

export async function buildSitemapXml(): Promise<string> {
  const all = (await listCatalogProducts({ includeInactive: false })) as (ManagedItem & { updatedAt?: string })[];
  const allDates = all.map((i) => day(i.updatedAt));
  const urls: { loc: string; lastmod: string; img?: string; title?: string }[] = [
    { loc: "/", lastmod: latest(allDates) },
    { loc: "/tienda", lastmod: latest(allDates) },
    { loc: GUIDE_PATH, lastmod: PAGES_UPDATED },
    ...CONTENT_PAGES.map((p) => ({ loc: p.path, lastmod: p.updated })),
    ...GOURMET_CATEGORY_PAGES.map((c) => ({ loc: c.path, lastmod: latest(c.filterItems(all).map((i) => day((i as { updatedAt?: string }).updatedAt))) })),
    ...all.map((i) => ({ loc: productPath(i.id), lastmod: day(i.updatedAt), img: abs(i.imageUrl || `/assets/products/${i.id}.jpg`), title: i.name })),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls.map(
      (u) =>
        `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><xhtml:link rel="alternate" hreflang="es" href="${esc(SITE_URL + u.loc)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(`${SITE_URL}${u.loc}?lang=en`)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + u.loc)}"/>${u.img ? `<image:image><image:loc>${esc(u.img)}</image:loc><image:title>${esc(u.title ?? "")}</image:title></image:image>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
}

/** Longer version of llms.txt with the full text of the guides and landing pages. */
export async function buildLlmsFullTxt(): Promise<string> {
  const lines = [await buildLlmsTxt(), "## Guías y servicios", ""];
  for (const p of CONTENT_PAGES) {
    lines.push(`### ${p.titleEs}`, `${SITE_URL}${p.path}`, "", p.answerEs, "");
    for (const sec of p.sections) {
      lines.push(`#### ${sec.hEs}`, ...(sec.pEs ?? []), ...(sec.listEs ?? []).map((li) => `- ${li}`));
      if (sec.table) lines.push(`| ${sec.table.headEs.join(" | ")} |`, `| ${sec.table.headEs.map(() => "---").join(" | ")} |`, ...sec.table.rowsEs.map((r) => `| ${r.join(" | ")} |`));
      lines.push("");
    }
    for (const f of p.faqs) lines.push(`**${f.qEs}** ${f.aEs}`, "");
  }
  return lines.join("\n");
}

/** Plain Markdown version of a page, for assistants that ask for it with Accept: text/markdown. */
export function seoPageToMarkdown(page: SeoPage) {
  const text = page.bodyHtml
    .replace(/<nav>[\s\S]*?<\/nav>/g, "")
    .replace(/<h1>([\s\S]*?)<\/h1>/g, "# $1\n\n")
    .replace(/<h2>([\s\S]*?)<\/h2>/g, "\n## $1\n\n")
    .replace(/<h3>([\s\S]*?)<\/h3>/g, "\n### $1\n\n")
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/g, (_m, href: string, label: string) => `[${label}](${href.startsWith("/") ? SITE_URL + href : href})`)
    .replace(/<li>([\s\S]*?)<\/li>/g, "- $1\n")
    .replace(/<\/(p|ul|table|tr)>/g, "\n")
    .replace(/<\/t[dh]>/g, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `${text}\n\nFuente: ${page.canonical}\n`;
}
