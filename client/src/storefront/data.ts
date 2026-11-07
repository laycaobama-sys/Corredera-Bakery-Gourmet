import {
  categories,
  formatPrice,
  menuImageFor,
  parsePriceEuros,
  type Lang,
  type MenuItem,
} from "../../../shared/catalog";
import { PRODUCT_HOVER_PHOTOS } from "../../../shared/productHoverPhotos";
import { productDescription } from "../../../shared/seoCopy";

/** Take-home gourmet families shown in the online shop (the tasting-bar items live in the in-store menu). */
export const SHOP_CATEGORY_IDS = [
  "jamones_enteros",
  "sobres_jamon",
  "embutidos",
  "sobres_embutidos",
  "quesos",
  "aceites",
  "conservas",
  "vinos",
  "fruteria",
  "carniceria",
] as const;

export type ShopCategoryId = (typeof SHOP_CATEGORY_IDS)[number];

/** Tasting-bar items (glasses, portions, toasts) that are served in store and therefore belong to the menu, not the shop. */
const IN_STORE_ONLY_IDS = new Set(["g8", "g9", "g20", "g1", "g3"]);

export function isShopItem(item: MenuItem): boolean {
  if (item.mode !== "gourmet") return false;
  if (IN_STORE_ONLY_IDS.has(item.id)) return false;
  return (SHOP_CATEGORY_IDS as readonly string[]).includes(item.category);
}

export const SHOP_CATEGORY_LABELS: Record<ShopCategoryId, { es: string; en: string }> = {
  jamones_enteros: { es: "Jamones enteros", en: "Whole hams" },
  sobres_jamon: { es: "Jamón loncheado 100 g", en: "Sliced ham 100 g" },
  embutidos: { es: "Embutidos al corte", en: "Charcuterie by weight" },
  sobres_embutidos: { es: "Embutidos loncheados 100 g", en: "Sliced charcuterie 100 g" },
  quesos: { es: "Quesos", en: "Cheeses" },
  aceites: { es: "Aceites AOVE", en: "Olive oils" },
  conservas: { es: "Conservas y aperitivo", en: "Preserves & aperitifs" },
  vinos: { es: "Vinos y bodega", en: "Wines" },
  fruteria: { es: "Frutería", en: "Greengrocer" },
  carniceria: { es: "Carnicería", en: "Butcher" },
};

/** Primary navigation of the shop: each entry maps to an indexable landing page. */
export const NAV_DEPARTMENTS = [
  {
    slug: "jamones",
    href: "/gourmet/jamones",
    es: "Jamones",
    en: "Hams",
    image: "/assets/products/je1.jpg",
    descEs: "Jamones y paletas, piezas enteras",
    descEn: "Whole hams and shoulders",
  },
  {
    slug: "jamon-cortado",
    href: "/gourmet/jamon-cortado",
    es: "Jamón cortado",
    en: "Carved ham",
    image: "/assets/products/sj2.jpg",
    descEs: "A cuchillo y envasado al vacío",
    descEn: "Hand-carved, vacuum packed",
  },
  {
    slug: "sobres-jamon",
    href: "/gourmet/sobres-jamon",
    es: "Loncheados",
    en: "Sliced packs",
    image: "/assets/products/sj3.jpg",
    descEs: "Sobres de 100 g listos para servir",
    descEn: "100 g ready-to-serve packs",
  },
  {
    slug: "embutidos",
    href: "/gourmet/embutidos",
    es: "Embutidos",
    en: "Charcuterie",
    image: "/assets/products/em3.jpg",
    descEs: "Lomo, presa, chorizo y salchichón",
    descEn: "Loin, presa, chorizo, salchichón",
  },
  {
    slug: "sobres-embutidos",
    href: "/gourmet/sobres-embutidos",
    es: "Embutidos 100 g",
    en: "Charcuterie 100 g",
    image: "/assets/products/se1.jpg",
    descEs: "Ibéricos loncheados al vacío",
    descEn: "Vacuum-packed sliced Iberian",
  },
  {
    slug: "quesos",
    href: "/gourmet/quesos",
    es: "Quesos",
    en: "Cheeses",
    image: "/assets/products/q5.jpg",
    descEs: "Cava nacional y europea",
    descEn: "Spanish & European cellar",
  },
  {
    slug: "aceites",
    href: "/gourmet/aceites",
    es: "Aceites",
    en: "Olive oils",
    image: "/assets/products/ao2.jpg",
    descEs: "Aceite de oliva virgen extra",
    descEn: "Extra virgin olive oil",
  },
  {
    slug: "carniceria",
    href: "/gourmet/carniceria",
    es: "Carnicería",
    en: "Butcher",
    image: "/assets/products/ca1.jpg",
    descEs: "Ternera, entraña, ibérico fresco y pollo",
    descEn: "Beef, skirt steak, Iberian pork, chicken",
  },
  {
    slug: "fruteria",
    href: "/gourmet/fruteria",
    es: "Frutería",
    en: "Greengrocer",
    image: "/assets/products/fr1.jpg",
    descEs: "Fruta y verdura fresca cada día",
    descEn: "Fresh fruit and vegetables daily",
  },
] as const;

/** Bundled home images ship a light 800px variant; uploaded images are used as they are. */
export function heroSrcSet(url: string) {
  return /^\/assets\/home\/[a-z0-9-]+\.jpg$/.test(url) ? `${url.replace(/\.jpg$/, "-800.jpg")} 800w, ${url} 1376w` : undefined;
}

/** Navigation departments with the photo chosen in the admin panel. */
export function departmentsWithImages(overrides: { slug: string; imageUrl: string }[]) {
  const map = new Map(overrides.map((d) => [d.slug, d.imageUrl]));
  return NAV_DEPARTMENTS.map((d) => ({ ...d, image: map.get(d.slug) ?? d.image }));
}

export function itemName(item: MenuItem, lang: Lang) {
  return lang === "en" ? item.nameEn || item.name : item.name;
}

export function itemDesc(item: MenuItem, lang: Lang) {
  return productDescription(item, lang);
}

export function itemBadge(item: MenuItem, lang: Lang) {
  return lang === "en" ? item.badgeEn || item.badge : item.badge;
}

/** Raise when bundled product photos are replaced, so browsers fetch the new files instead of cached ones. */
export const PRODUCT_PHOTO_VERSION = "5";

/** Second photo that fades in on hover and joins the product gallery. A photo replaced by the owner keeps its own pair. */
export function itemHoverImage(item: MenuItem & { imageUrl?: string; hoverImageUrl?: string }) {
  if (item.hoverImageUrl) return item.hoverImageUrl;
  const bundled = !item.imageUrl || item.imageUrl === `/assets/products/${item.id}.jpg`;
  const file = bundled ? PRODUCT_HOVER_PHOTOS[item.id] : undefined;
  return file ? `/assets/products/${file}.jpg?v=${PRODUCT_PHOTO_VERSION}` : null;
}

export function itemImage(item: MenuItem & { imageUrl?: string }) {
  const url = menuImageFor(item);
  return url.startsWith("/assets/products/") ? `${url}?v=${PRODUCT_PHOTO_VERSION}` : url;
}

export function categoryLabel(item: MenuItem, lang: Lang) {
  const shop = SHOP_CATEGORY_LABELS[item.category as ShopCategoryId];
  if (shop && item.mode === "gourmet") return shop[lang];
  return categories[item.mode].find((c) => c.id === item.category)?.[lang] ?? item.category;
}

/**
 * Splits a catalog price ("625,00 €", "98,00 € / kg", "Consultar") into the
 * amount and the unit suffix shown under it on product cards.
 */
export function priceParts(item: MenuItem, lang: Lang) {
  if (parsePriceEuros(item.price) === null) {
    return { amount: lang === "en" ? "Ask price" : "Consultar", unit: "" };
  }
  const localized = formatPrice(item.price, lang);
  const [amount, unit] = localized.split("/").map((s) => s.trim());
  return {
    amount,
    unit: unit ? (unit === "kg" ? (lang === "en" ? "per kg" : "el kilo") : `/ ${unit}`) : "",
  };
}

/** Items without a published price: the customer asks on WhatsApp instead of adding them to an order. */
export function isAskPrice(item: MenuItem) {
  return parsePriceEuros(item.price) === null;
}

export function askPriceMessage(item: MenuItem, lang: Lang) {
  return lang === "en"
    ? `Hello Corredera, what is the price of ${item.nameEn || item.name}? Is it available?`
    : `Hola Corredera, ¿qué precio tiene ${item.name}? ¿Lo tenéis disponible?`;
}

/** Short format line under the product name, e.g. "7 a 8 kg" or "Sobre 100 g envasado al vacío". */
export function formatLine(item: MenuItem, lang: Lang) {
  const raw =
    lang === "en"
      ? item.weightInfoEn || item.unitInfoEn || item.weightInfo || item.unitInfo || ""
      : item.weightInfo || item.unitInfo || "";
  return raw.replace(/^(Peso aproximado|Approx\. weight)\s*:\s*/i, "");
}

export function isWholeHam(item: MenuItem) {
  return Boolean(item.freeCuttingService);
}

/** Editorial specs shown on the product sheet, derived from the item family. */
export function productHighlights(item: MenuItem, lang: Lang): string[] {
  const es = lang === "es";
  switch (item.category) {
    case "jamones_enteros":
      return es
        ? [item.freeCuttingService ? "Corte a cuchillo y envasado al vacío gratis" : "Importe según el peso exacto de la pieza", "Peso orientativo confirmado en tienda", "Recogida en Madrid o envío a domicilio"]
        : [item.freeCuttingService ? "Free hand-carving and vacuum packing" : "Amount by the exact weight of the piece", "Indicative weight confirmed in store", "Madrid pickup or home delivery"];
    case "sobres_jamon":
    case "sobres_embutidos":
      return es
        ? ["Sobre de 100 g envasado al vacío", "Listo para servir a temperatura ambiente", "Ideal para regalo y aperitivo"]
        : ["100 g vacuum-sealed pack", "Ready to serve at room temperature", "Perfect for gifting and aperitif"];
    case "embutidos":
      return es
        ? ["Venta al peso, cortado en tienda", "Importe final según peso exacto", "Envasado al vacío bajo petición"]
        : ["Sold by weight, sliced in store", "Final amount by exact weight", "Vacuum packed on request"];
    case "quesos":
      return es
        ? ["Al corte o por pieza", "Selección de cava nacional y europea", "Envasado para transporte"]
        : ["Cut to order or by the piece", "Spanish and European cellar", "Packed for transport"];
    case "aceites":
      return es
        ? ["Aceite de oliva virgen extra", "Precio por unidad", "Perfecto para regalo gourmet"]
        : ["Extra virgin olive oil", "Price per unit", "Perfect gourmet gift"];
    case "fruteria":
      return es
        ? ["Género fresco seleccionado cada día", "Precio según mercado, confirmado por WhatsApp", "Recogida en tienda o envío junto a tu pedido"]
        : ["Fresh produce selected every day", "Market price, confirmed via WhatsApp", "Store pickup or delivered with your order"];
    case "carniceria":
      return es
        ? ["Cortado al momento como prefieras", "Importe según peso exacto, confirmado antes de preparar", "Envasado al vacío bajo petición"]
        : ["Cut to order the way you like", "Amount by exact weight, confirmed before preparing", "Vacuum packed on request"];
    default:
      return es
        ? ["Selección Corredera Gourmet", "Recogida en Calle de la Puebla, 15", "Confirmación personal por WhatsApp"]
        : ["Corredera Gourmet selection", "Pickup at Calle de la Puebla, 15", "Personal confirmation via WhatsApp"];
  }
}
