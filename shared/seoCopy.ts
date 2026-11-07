import { FEATURED_IDS, parsePriceEuros, type MenuItem } from "./catalog";

/**
 * One source for what a page says about itself. The server renders it into the HTML and the
 * client reuses it after hydrating, so search engines and visitors always see the same title,
 * description, H1, FAQ and best-seller list.
 */

export const BRAND_NAME = "Corredera Gourmet";
export const BAKERY_BRAND = "Corredera Bakery & Café";
export const BRAND_ALT_NAMES = ["Corredera Madrid", "Corredera Bakery & Gourmet", "Corredera Bakery"];

export type SeoLang = "es" | "en";
export type PageMeta = { title: string; description: string };
export type Faq = { q: string; a: string };

/** Search snippets are cut at about 160 characters: end on a whole word. */
export function snippet(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:·-]+$/, "")}…`;
}

export function homeMeta(lang: SeoLang): PageMeta & { h1: string } {
  return lang === "en"
    ? {
        title: "Iberian Ham in Madrid · 5 Jotas and Joselito | Corredera Gourmet",
        description: "Gourmet shop at Calle de la Puebla 15, Madrid: 5 Jotas and Joselito hams with free hand-carving, charcuterie, cheeses, oils, butcher, greengrocer and Bakery & Café.",
        h1: "Iberian ham shop in Madrid: 5 Jotas and Joselito, hand-carved",
      }
    : {
        title: "Jamón Ibérico en Madrid · 5 Jotas y Joselito | Corredera Gourmet",
        description: "Tienda gourmet en Calle de la Puebla 15, Madrid: jamones 5 Jotas y Joselito con corte gratis, embutidos, quesos, aceites, carnicería, frutería y Bakery & Café.",
        h1: "Tienda de jamón ibérico en Madrid: 5 Jotas y Joselito cortados a cuchillo",
      };
}

export function shopMeta(lang: SeoLang): PageMeta {
  return lang === "en"
    ? {
        title: "Online gourmet shop | Corredera Gourmet Madrid",
        description: "Shop Iberian hams, 100 g sliced packs, acorn-fed charcuterie, cheeses, EVOO, preserves, meat and fresh fruit at Corredera Gourmet. Madrid pickup or delivery.",
      }
    : {
        title: "Tienda gourmet online | Corredera Gourmet Madrid",
        description: "Compra jamones ibéricos, loncheados de 100 g, embutidos de bellota, quesos, aceites AOVE, conservas, carne y fruta en Corredera Gourmet. Recogida en Madrid o envío.",
      };
}

export function bakeryMeta(lang: SeoLang): PageMeta {
  return lang === "en"
    ? {
        title: "Bakery & Café menu | Breakfast in Madrid · Corredera Bakery",
        description: "Breakfast, coffee, artisan pastries, sandwiches, cakes and gourmet bar menu at Corredera Bakery & Café, Calle de la Puebla 15, Madrid.",
      }
    : {
        title: "Carta Bakery & Café | Desayunos en Madrid · Corredera Bakery",
        description: "Carta de desayunos, café, bollería artesana, bocadillos, tartas y barra gourmet de Corredera Bakery & Café en Calle de la Puebla 15, Madrid.",
      };
}

export function productName(item: MenuItem, lang: SeoLang) {
  return lang === "en" ? item.nameEn || item.name : item.name;
}

export function productDescription(item: MenuItem, lang: SeoLang) {
  const raw = lang === "en" ? item.descEn || item.desc : item.desc;
  return raw.replace(/^(Más vendido\.|Best seller\.)\s*/i, "");
}

export function productMeta(item: MenuItem, lang: SeoLang): PageMeta {
  const name = productName(item, lang);
  const info = lang === "en" ? item.weightInfoEn ?? item.unitInfoEn ?? "" : item.weightInfo ?? item.unitInfo ?? "";
  const price = parsePriceEuros(item.price) !== null ? ` · ${item.price}` : "";
  const full = `${name}${price} | ${BRAND_NAME} Madrid`;
  return {
    title: full.length <= 70 ? full : `${name} | ${BRAND_NAME}`,
    description: snippet(
      `${productDescription(item, lang)} ${info} ${lang === "en" ? "Buy at Corredera Gourmet, Madrid: store pickup or home delivery." : "Compra en Corredera Gourmet, Madrid: recogida en tienda o envío a domicilio."}`,
    ),
  };
}

/** The best sellers shown on the home page: the owner's stars first, otherwise the curated list. */
export function selectBestSellers<T extends MenuItem>(shopItems: T[]): T[] {
  const rank = (id: string) => {
    const i = (FEATURED_IDS as readonly string[]).indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const starred = shopItems.filter((i) => i.featured).sort((a, b) => rank(a.id) - rank(b.id));
  if (starred.length > 0) return starred.slice(0, 8);
  const byId = new Map(shopItems.map((i) => [i.id, i]));
  return FEATURED_IDS.map((id) => byId.get(id))
    .filter((i): i is T => Boolean(i))
    .slice(0, 8);
}

type FaqContact = { addressLine: string; shippingNoticeEs: string; shippingNoticeEn: string };

export function homeFaqs(contact: FaqContact, lang: SeoLang): Faq[] {
  if (lang === "en") {
    return [
      {
        q: "What is Corredera Gourmet (correderamadrid.com)?",
        a: `Corredera Gourmet, also known as Corredera Madrid, is a food shop at ${contact.addressLine}, between Gran Vía and Malasaña. It sells Iberian ham, charcuterie, cheeses, olive oils, meat and fruit, and has the Corredera Bakery & Café on the same premises. It is a business, not the Corredera streets of Madrid.`,
      },
      {
        q: "Where can I buy 5 Jotas or Joselito Iberian ham in Madrid?",
        a: `At Corredera Gourmet, ${contact.addressLine}, between Gran Vía and Malasaña. Order online and pick up in store or have it delivered.`,
      },
      {
        q: "Does carving and packing a whole ham cost extra?",
        a: "No. When you order any of our whole hams, hand-carving and vacuum packing are free. You can also take the whole uncut piece.",
      },
      {
        q: "How do I pay for my order?",
        a: "There is no online payment. Your order is sent via WhatsApp, we confirm availability and amount, and you pay on pickup or delivery.",
      },
      { q: "Do you deliver?", a: contact.shippingNoticeEn },
      {
        q: "How do items sold by weight work?",
        a: "Charcuterie and cheeses cut to order are sold per kilo. Tell us the approximate amount and we will confirm the exact weight and final price before preparing your order.",
      },
      {
        q: "Is there a butcher and a greengrocer at Corredera?",
        a: `Yes. At ${contact.addressLine} we also have a butcher's counter (beef, fresh Iberian pork, chicken, lamb and homemade burgers cut to order) and a greengrocer with fresh seasonal fruit and vegetables.`,
      },
    ];
  }
  return [
    {
      q: "¿Qué es Corredera Gourmet (correderamadrid.com)?",
      a: `Corredera Gourmet, también conocida como Corredera Madrid, es una tienda de alimentación en ${contact.addressLine}, entre Gran Vía y Malasaña. Vende jamón ibérico, embutidos, quesos, aceites, carne y fruta, y en el mismo local está Corredera Bakery & Café. Es un comercio, no las calles Corredera de Madrid.`,
    },
    {
      q: "¿Dónde comprar jamón ibérico 5 Jotas o Joselito en Madrid?",
      a: `En Corredera Gourmet, ${contact.addressLine}, entre Gran Vía y Malasaña. Puedes encargarlo en la web y recogerlo en tienda o recibirlo en casa.`,
    },
    {
      q: "¿El corte y envasado del jamón entero tiene coste?",
      a: "No. Al encargar cualquiera de nuestros jamones enteros, el corte a cuchillo y el envasado al vacío son gratuitos. También puedes llevarte la pieza entera sin empezar.",
    },
    {
      q: "¿Cómo pago mi pedido?",
      a: "No hay pago online. Enviamos tu pedido por WhatsApp, te confirmamos disponibilidad e importe y pagas al recoger en tienda o a la entrega.",
    },
    { q: "¿Hacéis envíos a domicilio?", a: contact.shippingNoticeEs },
    {
      q: "¿Cómo funcionan los productos al peso?",
      a: "Embutidos y quesos al corte se venden por kilo. Indícanos la cantidad aproximada y te confirmaremos el peso exacto y el importe final antes de preparar el pedido.",
    },
    {
      q: "¿Hay carnicería y frutería en Corredera?",
      a: `Sí. En el mismo local de ${contact.addressLine} tenemos carnicería (ternera, cerdo ibérico fresco, pollo, cordero y hamburguesas caseras cortadas al momento) y frutería con fruta y verdura fresca de temporada.`,
    },
  ];
}
