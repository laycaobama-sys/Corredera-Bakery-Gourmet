export type Mode = "bakery" | "gourmet";
export type Lang = "es" | "en";
export type Category =
  | "todos"
  | "desayunos"
  | "packs"
  | "bocadillos"
  | "bolleria"
  | "tartas"
  | "cafeteria"
  | "jamones_enteros"
  | "sobres_jamon"
  | "embutidos"
  | "sobres_embutidos"
  | "ibericos"
  | "quesos"
  | "aceites"
  | "carniceria"
  | "fruteria"
  | "vinos"
  | "raciones"
  | "conservas"
  | "tablas";

export type MenuItem = {
  id: string;
  mode: Mode;
  category: Exclude<Category, "todos">;
  name: string;
  nameEn: string;
  desc: string;
  descEn: string;
  price: string;
  badge?: string;
  badgeEn?: string;
  icon: "coffee" | "cake" | "bag" | "ham" | "cheese" | "wine" | "sandwich";
  unitInfo?: string;
  unitInfoEn?: string;
  weightInfo?: string;
  weightInfoEn?: string;
  refPricePerKg?: string;
  subGroup?: "por_kilo" | "por_unidad";
  freeCuttingService?: boolean;
  provisionalFormatNote?: string;
  provisionalFormatNoteEn?: string;
  featured?: boolean;
};

export type OrderModality = "pickup" | "delivery" | "reservation" | "event";

export type HamCuttingPreference = "whole_piece" | "free_sliced_vacuum";

export type ImageValidationStatus =
  | "specific generated"
  | "illustrative individual product reference";

export type PriceValidationStatus =
  | "confirmed_by_owner_fixed"
  | "confirmed_by_owner_by_weight"
  | "confirmed_by_owner_per_unit"
  | "confirmed_by_owner_addon"
  | "pending_owner_price_consultar";

export const WHATSAPP_NUMBER = "34640341932";
export const WHATSAPP_DISPLAY = "+34 640 34 19 32";
export const LANDLINE_DISPLAY = "+34 919 47 14 49";

export const SHIPPING_NOTICE_ES =
  "Realiza tu encargo y recíbelo en tu domicilio. El coste del envío se calcula aparte y se confirma antes de finalizar el pedido.";
export const SHIPPING_NOTICE_EN =
  "Place your custom order for home delivery. Shipping fees are calculated separately and confirmed before finalizing your order.";

export const FREE_HAM_CUTTING_BANNER_ES =
  "¿Prefieres tu jamón cortado? Te regalamos el servicio de corte y envasado al vacío al encargar tu pieza.";
export const FREE_HAM_CUTTING_BANNER_EN =
  "Prefer your whole ham sliced? Enjoy our complimentary hand-carving and vacuum-packing service when ordering a whole piece.";

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function parsePriceEuros(price: string): number | null {
  if (!price || price === "Consultar") return null;
  const match = price.match(/(\d+)[,.](\d+)/);
  if (!match) return null;
  return parseFloat(`${match[1]}.${match[2]}`);
}

export function formatEuros(amount: number, lang: Lang = "es"): string {
  const formatted = amount.toFixed(2).replace(".", ",");
  return lang === "es" ? `${formatted} €` : `€${amount.toFixed(2)}`;
}

export function formatPrice(price: string, lang: Lang): string {
  if (lang === "es") return price;
  if (price === "Consultar") return "Ask price";
  return price.replace("/ unidad", "/ unit");
}

export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const galleryImages = [
  {
    src: "/manus-storage/async-images/EujPgDIPcbtATsDhasLWVD/image-1.webp",
    title: "Obrador artesanal y bollería",
    titleEn: "Artisan bakery & pastries",
    text: "Croissants de mantequilla, napolitanas, caracoles y dulces recién horneados.",
    textEn: "Freshly baked butter croissants, chocolate pastries and traditional sweets.",
  },
  {
    src: "/manus-storage/async-images/EujPgDIPcbtATsDhasLWVD/image-2.webp",
    title: "Jamones ibéricos y corte a cuchillo",
    titleEn: "Iberian hams & master carving",
    text: "Piezas enteras 5 Jotas, Joselito y Extremadura, o sobres de 100 g envasados al vacío.",
    textEn: "Whole 5 Jotas, Joselito and Extremadura hams, or 100g vacuum-sealed packs.",
  },
  {
    src: "/manus-storage/async-images/EujPgDIPcbtATsDhasLWVD/image-3.webp",
    title: "Cafetería y desayunos del día",
    titleEn: "Specialty coffee & daily breakfasts",
    text: "Desayunos completos, brunch, zumo de naranja natural y promociones diarias.",
    textEn: "Full breakfasts, brunch, freshly squeezed orange juice and daily combos.",
  },
  {
    src: "/manus-storage/async-images/EujPgDIPcbtATsDhasLWVD/image-4.webp",
    title: "Bodega, vermut y degustación",
    titleEn: "Wine cellar, vermouth & tasting bar",
    text: "Copas de vino D.O., vermut de grifo, cervezas y tablas maridadas.",
    textEn: "D.O. wine glasses, Madrid draft vermouth, beers and paired boards.",
  },
  {
    src: "/manus-storage/async-images/EujPgDIPcbtATsDhasLWVD/image-5.webp",
    title: "Encargos gourmet y regalos",
    titleEn: "Gourmet pre-orders & gifts",
    text: "Piezas de jamón con corte gratuito, aceites AOVE, quesos selectos y cestas a medida.",
    textEn: "Whole hams with complimentary slicing, EVOO, artisan cheeses and bespoke baskets.",
  },
  {
    src: "/assets/corredera-bakery-interior.jpg",
    title: "El espacio Corredera en Calle de la Puebla, 15",
    titleEn: "The Corredera space at Calle de la Puebla, 15",
    text: "Panadería artesanal, cafetería y charcutería gourmet en el corazón de Madrid.",
    textEn: "Artisan bakery, coffee shop and gourmet charcuterie in central Madrid.",
  },
  {
    src: "/manus-storage/async-images/0ph7XQEFnMSHaCSLsIo0WO/image-1.webp",
    title: "Raciones frías y aperitivos",
    titleEn: "Cold portions & aperitifs",
    text: "Ensaladillas, hummus mediterráneos y propuestas listas para degustar.",
    textEn: "Salads, Mediterranean hummus and cold dishes ready to enjoy.",
  },
  {
    src: "/manus-storage/async-images/0ph7XQEFnMSHaCSLsIo0WO/image-2.webp",
    title: "Gildas, ahumados y conservas",
    titleEn: "Gildas, smoked fish & preserves",
    text: "Gildas clásicas, boquerones, sardinas y salmón ahumado seleccionado.",
    textEn: "Classic gildas, pickled anchovies, sardines and smoked salmon.",
  },
  {
    src: "/manus-storage/async-images/0ph7XQEFnMSHaCSLsIo0WO/image-3.webp",
    title: "Selección de quesos y tablas",
    titleEn: "Artisan cheese selection & boards",
    text: "Quesos nacionales e internacionales al corte por kilo, cuñas y tablas con vino.",
    textEn: "National and international cheeses by the kilo, wedges and wine boards.",
  },
  {
    src: "/manus-storage/async-images/0ph7XQEFnMSHaCSLsIo0WO/image-4.webp",
    title: "Tartas artesanas por encargo y al corte",
    titleEn: "Artisan cakes to order & by weight",
    text: "Tarta de queso, zanahoria, chocolate y bizcocho casero de naranja.",
    textEn: "Cheesecake, carrot cake, chocolate cake and homemade orange sponge.",
  },
  {
    src: "/manus-storage/async-images/0ph7XQEFnMSHaCSLsIo0WO/image-5.webp",
    title: "Bocadillos de jamón ibérico y focaccias",
    titleEn: "Iberian ham baguettes & focaccias",
    text: "Bocadillos recién preparados, empanada gallega artesana y promociones con bebida.",
    textEn: "Freshly prepared baguettes, handmade Galician pie and drink combos.",
  },
];

/**
 * Cartel oficial de Desayunos y Ofertas del Día (/assets/carta-cartel.jpg, editable desde el panel)
 * Extraído íntegramente con la actualización de precio en Croissant + Café (3,75 €)
 * e incluyendo la promoción de Perrito Caliente + Refresco (5,99 €) del local.
 */
export const BREAKFAST_POSTER_DATA = {
  posterImageUrl: "/assets/carta-cartel.jpg",
  mainHighlight: {
    id: "d8",
    titleEs: "Bocadillo Especial + Refresco",
    titleEn: "Special Baguette + Soft Drink",
    price: "8,99 €",
    badgeEs: "Oferta Estrella del Cartel",
    badgeEn: "Featured Daily Combo",
  },
  groups: [
    {
      id: "desayunos",
      titleEs: "Desayunos",
      titleEn: "Breakfast Combos",
      items: [
        {
          id: "d5",
          nameEs: "Brunch Completo",
          nameEn: "Complete Brunch",
          detailEs: "Café + tostada + zumo de naranja + bollería",
          detailEn: "Coffee + toast + fresh orange juice + pastry",
          price: "11,99 €",
        },
        {
          id: "d6",
          nameEs: "Croissant + Café",
          nameEn: "Croissant + Coffee",
          detailEs: "Croissant de mantequilla recién horneado con café incluido",
          detailEn: "Freshly baked butter croissant with coffee included",
          price: "3,75 €",
        },
        {
          id: "d7",
          nameEs: "Napolitana de Chocolate + Café",
          nameEn: "Chocolate Napolitana + Coffee",
          detailEs: "Hojaldre relleno de chocolate con café incluido",
          detailEn: "Chocolate-filled flaky pastry with coffee included",
          price: "4,50 €",
        },
      ],
    },
    {
      id: "bocadillos",
      titleEs: "Bocadillos con Bebida",
      titleEn: "Sandwich Combos",
      items: [
        {
          id: "d8",
          nameEs: "Bocadillo Especial + Refresco",
          nameEn: "Special Sandwich + Soft Drink",
          detailEs: "Bocadillo especial de la casa a elegir + refresco frío",
          detailEn: "House special baguette of your choice + chilled soft drink",
          price: "8,99 €",
        },
        {
          id: "d9",
          nameEs: "Bocadillo Jamón Ibérico + Refresco o Café",
          nameEn: "Iberian Ham Baguette + Soft Drink or Coffee",
          detailEs: "Bocadillo de jamón ibérico recién cortado + refresco o café",
          detailEn: "Freshly sliced Iberian ham baguette + soft drink or coffee",
          price: "7,50 €",
        },
      ],
    },
    {
      id: "snacks_perritos",
      titleEs: "Snacks y Perritos Calientes (Promoción Local)",
      titleEn: "Snacks & Hot Dog Store Combos",
      items: [
        {
          id: "d10",
          nameEs: "Empanadilla + Refresco",
          nameEn: "Savoury Empanadilla + Soft Drink",
          detailEs: "Empanadilla artesana horneada en obrador + refresco",
          detailEn: "Handmade bakery savoury pastry + soft drink",
          price: "5,99 €",
        },
        {
          id: "d11",
          nameEs: "Perrito Caliente + Refresco",
          nameEn: "Classic Hot Dog + Soft Drink",
          detailEs: "Promoción especial en local: perrito caliente recién preparado + refresco",
          detailEn: "In-store special combo: classic hot dog + soft drink",
          price: "5,99 €",
        },
      ],
    },
  ],
  includedDrinksEs:
    "Cafés incluidos: café solo, cortado o con leche · Refrescos incluidos: Coca-Cola, Fanta, Aquarius o Fuze Tea.",
  includedDrinksEn:
    "Included coffees: espresso, cortado or white coffee · Included soft drinks: Coca-Cola, Fanta, Aquarius or Fuze Tea.",
};

export const menuItems: MenuItem[] = [
  // ===========================================================================
  // 1. DESAYUNOS Y OFERTAS DEL DÍA (BAKERY)
  // ===========================================================================
  {
    id: "d1",
    mode: "bakery",
    category: "desayunos",
    name: "Desayuno Clásico",
    nameEn: "Classic Breakfast",
    desc: "Incluye café (solo, cortado o con leche) o infusión. Tostada de pan artesano con tomate natural o mermelada.",
    descEn: "Includes coffee (espresso, cortado or latte) or infusion. Artisan toast with grated tomato or jam.",
    price: "3,90 €",
    icon: "coffee",
  },
  {
    id: "d2",
    mode: "bakery",
    category: "desayunos",
    name: "Desayuno Dulce",
    nameEn: "Sweet Breakfast",
    desc: "Incluye café o infusión. Acompañado de croissant de mantequilla o palmerita artesana a elegir.",
    descEn: "Includes coffee or infusion. Paired with a butter croissant or artisan palmier.",
    price: "3,90 €",
    icon: "cake",
  },
  {
    id: "d3",
    mode: "bakery",
    category: "desayunos",
    name: "Desayuno Ibérico",
    nameEn: "Iberian Breakfast",
    desc: "Incluye café o infusión. Tostada en pan artesano con jamón ibérico recién cortado y AOVE.",
    descEn: "Includes coffee or infusion. Artisan toast with freshly sliced Iberian ham and EVOO.",
    price: "4,50 €",
    badge: "Clásico de la Casa",
    badgeEn: "House Classic",
    icon: "ham",
  },
  {
    id: "d4",
    mode: "bakery",
    category: "desayunos",
    name: "Extra · Zumo de Naranja Natural Pequeño",
    nameEn: "Extra · Small Fresh Orange Juice",
    desc: "Suplemento de zumo de naranja natural recién exprimido para acompañar tu desayuno.",
    descEn: "Freshly squeezed small orange juice add-on for any breakfast.",
    price: "+2,00 €",
    icon: "coffee",
  },
  {
    id: "d5",
    mode: "bakery",
    category: "desayunos",
    name: "Brunch Completo · Oferta del Día",
    nameEn: "Complete Brunch · Daily Offer",
    desc: "Incluye café (solo, cortado o con leche) + tostada + zumo de naranja natural + pieza de bollería.",
    descEn: "Includes coffee (espresso, cortado or latte) + toast + fresh orange juice + pastry.",
    price: "11,99 €",
    badge: "Brunch Completo",
    badgeEn: "Full Brunch",
    icon: "coffee",
    featured: true,
  },
  {
    id: "d6",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Croissant + Café",
    nameEn: "Croissant + Coffee Combo",
    desc: "Croissant de mantequilla recién horneado + café solo, cortado o con leche.",
    descEn: "Freshly baked butter croissant + espresso, cortado or white coffee.",
    price: "3,75 €",
    badge: "Oferta 3,75 €",
    badgeEn: "€3.75 Deal",
    icon: "cake",
    featured: true,
  },
  {
    id: "d7",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Napolitana de Chocolate + Café",
    nameEn: "Chocolate Napolitana + Coffee Combo",
    desc: "Napolitana de chocolate artesana + café solo, cortado o con leche.",
    descEn: "Artisan chocolate flaky pastry + espresso, cortado or white coffee.",
    price: "4,50 €",
    badge: "Oferta del día",
    badgeEn: "Daily Deal",
    icon: "cake",
  },
  {
    id: "d8",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Bocadillo Especial + Refresco",
    nameEn: "Special Baguette + Soft Drink Combo",
    desc: "Bocadillo especial de la casa a elegir + refresco (Coca-Cola, Fanta, Aquarius o Fuze Tea).",
    descEn: "House special baguette of choice + soft drink (Coca-Cola, Fanta, Aquarius or Fuze Tea).",
    price: "8,99 €",
    badge: "Destacado Cartel",
    badgeEn: "Poster Highlight",
    icon: "sandwich",
    featured: true,
  },
  {
    id: "d9",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Bocadillo Jamón Ibérico + Refresco o Café",
    nameEn: "Iberian Ham Baguette + Soft Drink or Coffee",
    desc: "Bocadillo de jamón ibérico + refresco (Coca-Cola, Fanta, Aquarius, Fuze Tea) o café incluido.",
    descEn: "Iberian ham baguette + soft drink (Coca-Cola, Fanta, Aquarius, Fuze Tea) or coffee included.",
    price: "7,50 €",
    badge: "Ibérico + Bebida",
    badgeEn: "Iberian Combo",
    icon: "ham",
    featured: true,
  },
  {
    id: "d10",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Snack · Empanadilla + Refresco",
    nameEn: "Snack Combo · Empanadilla + Soft Drink",
    desc: "Empanadilla artesana horneada en obrador + refresco frío (Coca-Cola, Fanta, Aquarius o Fuze Tea).",
    descEn: "Handmade bakery savoury pastry + chilled soft drink (Coca-Cola, Fanta, Aquarius or Fuze Tea).",
    price: "5,99 €",
    badge: "Snack + Bebida",
    badgeEn: "Snack Combo",
    icon: "bag",
  },
  {
    id: "d11",
    mode: "bakery",
    category: "desayunos",
    name: "Promoción Perrito Caliente + Refresco",
    nameEn: "Hot Dog + Soft Drink Store Promo",
    desc: "Promoción especial en el local: perrito caliente + refresco (Coca-Cola, Fanta, Aquarius o Fuze Tea).",
    descEn: "In-store special promotion: classic hot dog + soft drink (Coca-Cola, Fanta, Aquarius or Fuze Tea).",
    price: "5,99 €",
    badge: "Promo en Local",
    badgeEn: "In-Store Promo",
    icon: "sandwich",
  },

  // ===========================================================================
  // 2. CAFETERÍA Y BEBIDAS (BAKERY — Precios actualizados Sección 10)
  // ===========================================================================
  {
    id: "c1",
    mode: "bakery",
    category: "cafeteria",
    name: "Café Espresso",
    nameEn: "Espresso",
    desc: "Café arábica de tueste natural preparado al momento.",
    descEn: "Freshly extracted natural roast Arabica espresso.",
    price: "1,99 €",
    icon: "coffee",
  },
  {
    id: "c2",
    mode: "bakery",
    category: "cafeteria",
    name: "Americano",
    nameEn: "Americano",
    desc: "Café largo, aromático y equilibrado.",
    descEn: "Smooth, aromatic long black coffee.",
    price: "2,00 €",
    icon: "coffee",
  },
  {
    id: "c3",
    mode: "bakery",
    category: "cafeteria",
    name: "Cortado",
    nameEn: "Cortado",
    desc: "Espresso intenso con un toque de leche cremada.",
    descEn: "Rich espresso with a dash of steamed milk.",
    price: "2,10 €",
    icon: "coffee",
  },
  {
    id: "c4",
    mode: "bakery",
    category: "cafeteria",
    name: "Latte / Café con Leche",
    nameEn: "Caffè Latte",
    desc: "Espresso doble o sencillo con leche fresca vaporizada.",
    descEn: "Espresso with silky steamed milk.",
    price: "2,50 €",
    icon: "coffee",
  },
  {
    id: "c5",
    mode: "bakery",
    category: "cafeteria",
    name: "Capuchino",
    nameEn: "Cappuccino",
    desc: "Espresso, leche cremosa y corona de espuma sedosa.",
    descEn: "Espresso, steamed milk and velvety microfoam.",
    price: "2,99 €",
    icon: "coffee",
  },
  {
    id: "c6",
    mode: "bakery",
    category: "cafeteria",
    name: "Café Bombón",
    nameEn: "Bombón Coffee",
    desc: "Café espresso con leche condensada tradicional.",
    descEn: "Espresso layered with sweet condensed milk.",
    price: "2,99 €",
    icon: "coffee",
  },
  {
    id: "c7",
    mode: "bakery",
    category: "cafeteria",
    name: "Infusiones",
    nameEn: "Herbal Teas & Infusions",
    desc: "Selección de tés e infusiones naturales en hoja.",
    descEn: "Selection of natural herbal teas and infusions.",
    price: "2,50 €",
    icon: "coffee",
  },
  {
    id: "c8",
    mode: "bakery",
    category: "cafeteria",
    name: "Chai Latte",
    nameEn: "Spiced Chai Latte",
    desc: "Té negro especiado con canela, cardamomo y leche cremada.",
    descEn: "Spiced black tea with cinnamon, cardamom and steamed milk.",
    price: "3,99 €",
    icon: "coffee",
  },
  {
    id: "c9",
    mode: "bakery",
    category: "cafeteria",
    name: "Cola Cao",
    nameEn: "Cola Cao Hot Cocoa",
    desc: "Cacao clásico preparado con leche caliente o fría.",
    descEn: "Traditional Spanish cocoa drink with hot or cold milk.",
    price: "3,99 €",
    icon: "coffee",
  },
  {
    id: "c10",
    mode: "bakery",
    category: "cafeteria",
    name: "Vaso de Leche",
    nameEn: "Glass of Milk",
    desc: "Leche entera, semidesnatada, sin lactosa o bebida vegetal.",
    descEn: "Whole, semi-skimmed, lactose-free or plant-based milk.",
    price: "2,50 €",
    icon: "coffee",
  },
  {
    id: "c11",
    mode: "bakery",
    category: "cafeteria",
    name: "Zumo de Naranja Recién Exprimido",
    nameEn: "Freshly Squeezed Orange Juice",
    desc: "Elaborado al instante con naranjas seleccionadas.",
    descEn: "Pressed to order using selected sweet oranges.",
    price: "5,50 €",
    icon: "coffee",
  },
  {
    id: "c12",
    mode: "bakery",
    category: "cafeteria",
    name: "Refresco (Coca-Cola, Fanta, Aquarius o Fuze Tea)",
    nameEn: "Soft Drink (Coca-Cola, Fanta, Aquarius or Fuze Tea)",
    desc: "Refresco frío servido en local o para llevar.",
    descEn: "Chilled soft drink for dine-in or takeaway.",
    price: "2,50 €",
    icon: "coffee",
  },
  {
    id: "c13",
    mode: "bakery",
    category: "cafeteria",
    name: "Agua Mineral",
    nameEn: "Still Mineral Water",
    desc: "Botella de agua mineral natural fría o del tiempo.",
    descEn: "Natural still mineral water.",
    price: "1,90 €",
    icon: "coffee",
  },
  {
    id: "c14",
    mode: "bakery",
    category: "cafeteria",
    name: "Agua con Gas",
    nameEn: "Sparkling Mineral Water",
    desc: "Agua mineral natural carbónica bien fría.",
    descEn: "Chilled sparkling mineral water.",
    price: "1,90 €",
    icon: "coffee",
  },

  // ===========================================================================
  // 3. PANADERÍA Y BOLLERÍA (BAKERY — Sin productos retirados, precios actualizados)
  // ===========================================================================
  {
    id: "bo1",
    mode: "bakery",
    category: "bolleria",
    name: "Croissant de Mantequilla",
    nameEn: "Artisan Butter Croissant",
    desc: "Hojaldre laminado con mantequilla, horneado a diario en nuestro obrador.",
    descEn: "Flaky laminated butter croissant baked fresh every morning.",
    price: "2,00 €",
    badge: "Obrador Diario",
    badgeEn: "Baked Daily",
    icon: "cake",
  },
  {
    id: "bo2",
    mode: "bakery",
    category: "bolleria",
    name: "Caracol de Obrador",
    nameEn: "Artisan Pastry Swirl",
    desc: "Espiral hojaldrada tradicional recién horneada.",
    descEn: "Traditional flaky pastry swirl baked daily.",
    price: "2,20 €",
    icon: "cake",
  },
  {
    id: "bo3",
    mode: "bakery",
    category: "bolleria",
    name: "Napolitana de Bombón",
    nameEn: "Chocolate Bombón Napolitana",
    desc: "Hojaldre dorado relleno de intenso chocolate fundente.",
    descEn: "Golden flaky pastry filled with rich dark chocolate.",
    price: "2,50 €",
    badge: "Favorito",
    badgeEn: "Favourite",
    icon: "cake",
  },
  {
    id: "bo4",
    mode: "bakery",
    category: "bolleria",
    name: "Canolis",
    nameEn: "Artisan Cannoli",
    desc: "Crujiente especialidad dulce rellena al estilo tradicional.",
    descEn: "Crisp pastry shell with creamy sweet filling.",
    price: "2,30 €",
    icon: "cake",
  },
  {
    id: "bo5",
    mode: "bakery",
    category: "bolleria",
    name: "Palmeritas de Mantequilla",
    nameEn: "Butter Palmiers",
    desc: "Hojaldre fino caramelizado y crujiente.",
    descEn: "Crisp caramelized butter flaky palmier.",
    price: "1,10 €",
    icon: "cake",
  },
  {
    id: "bo6",
    mode: "bakery",
    category: "bolleria",
    name: "Palmeritas Rellenas",
    nameEn: "Filled Palmiers",
    desc: "Palmeritas artesanas con relleno cremoso.",
    descEn: "Handmade palmiers with sweet cream filling.",
    price: "1,35 €",
    icon: "cake",
  },
  {
    id: "bo7",
    mode: "bakery",
    category: "bolleria",
    name: "Palmera de Yema",
    nameEn: "Candied Yolk Palmier",
    desc: "Palmera de hojaldre artesano bañada en yema tostada.",
    descEn: "Flaky puff pastry palmier glazed with traditional egg yolk.",
    price: "3,50 €",
    icon: "cake",
  },
  {
    id: "bo13",
    mode: "bakery",
    category: "bolleria",
    name: "Abanicos de Mantequilla",
    nameEn: "Artisan Butter Fans",
    desc: "Galleta hojaldrada fina de mantequilla, venta al peso.",
    descEn: "Delicate crisp butter fan biscuits, sold by weight.",
    price: "38,00 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },
  {
    id: "bo14",
    mode: "bakery",
    category: "bolleria",
    name: "Teja de Almendra",
    nameEn: "Almond Tuiles",
    desc: "Tejas finas crujientes con almendra laminada tostada, venta al peso.",
    descEn: "Thin crisp almond tuiles crafted in our bakery, sold by weight.",
    price: "38,00 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },

  // ===========================================================================
  // 4. TARTAS Y REPOSTERÍA (BAKERY — Sin productos retirados, precios actualizados)
  // ===========================================================================
  {
    id: "t6",
    mode: "bakery",
    category: "tartas",
    name: "Bizcocho Casero de Naranja",
    nameEn: "Homemade Orange Sponge Cake",
    desc: "Elaborado en obrador con zumo y ralladura de naranja natural. Disponible al peso.",
    descEn: "Baked in-house with fresh orange juice and zest. Sold by weight.",
    price: "39,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },
  {
    id: "t7",
    mode: "bakery",
    category: "tartas",
    name: "Tarta de Zanahoria (Carrot Cake)",
    nameEn: "Artisan Carrot Cake",
    desc: "Bizcocho jugoso especiado con nueces y cobertura suave de queso crema.",
    descEn: "Moist spiced carrot cake with walnuts and cream cheese frosting.",
    price: "29,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },
  {
    id: "t8",
    mode: "bakery",
    category: "tartas",
    name: "Tarta de Chocolate Artesana",
    nameEn: "Artisan Chocolate Cake",
    desc: "Tarta intensa de cacao puro, disponible al corte por peso o por encargo.",
    descEn: "Rich pure cocoa cake, available by weight or whole to order.",
    price: "29,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },
  {
    id: "t9",
    mode: "bakery",
    category: "tartas",
    name: "Tarta de Queso Artesana (Cheesecake)",
    nameEn: "Artisan Basque Cheesecake",
    desc: "Cremosa, horneada lentamente en nuestro obrador. Disponible al peso o por encargo.",
    descEn: "Creamy slow-baked cheesecake crafted in our bakery. Sold by weight.",
    price: "29,99 € / kg",
    badge: "Especialidad Obrador",
    badgeEn: "Bakery Signature",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "cake",
  },
  {
    id: "t10",
    mode: "bakery",
    category: "tartas",
    name: "Tarta Pequeña · Encargo Completo",
    nameEn: "Small Whole Cake · Pre-Order",
    desc: "Tarta entera formato pequeño para celebraciones (sabores de obrador a elegir).",
    descEn: "Small whole artisan cake for celebrations (choose your signature flavour).",
    price: "27,99 €",
    badge: "Por encargo",
    badgeEn: "Pre-order",
    icon: "cake",
  },
  {
    id: "t11",
    mode: "bakery",
    category: "tartas",
    name: "Tarta Mediana · Encargo Completo",
    nameEn: "Medium Whole Cake · Pre-Order",
    desc: "Tarta entera formato mediano para compartir (sabores de obrador a elegir).",
    descEn: "Medium whole artisan cake to share (choose your signature flavour).",
    price: "32,99 €",
    badge: "Por encargo",
    badgeEn: "Pre-order",
    icon: "cake",
  },
  {
    id: "t12",
    mode: "bakery",
    category: "tartas",
    name: "Tarta Grande · Encargo Completo",
    nameEn: "Large Whole Cake · Pre-Order",
    desc: "Tarta entera formato grande para eventos y reuniones familiares.",
    descEn: "Large whole artisan cake for events and family celebrations.",
    price: "39,99 €",
    badge: "Celebraciones",
    badgeEn: "Celebrations",
    icon: "cake",
  },

  // ===========================================================================
  // 5. BOCADILLOS, EMPANADAS Y FOCACCIAS (BAKERY — Sin cocina caliente)
  // ===========================================================================
  {
    id: "b1",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo de Jamón Ibérico",
    nameEn: "Iberian Ham Baguette",
    desc: "Pan crujiente con jamón ibérico recién cortado y aceite de oliva virgen extra.",
    descEn: "Crusty baguette with freshly sliced Iberian ham and extra virgin olive oil.",
    price: "5,50 €",
    badge: "Especialidad Ibérica",
    badgeEn: "Iberian Specialty",
    icon: "ham",
  },
  {
    id: "b2",
    mode: "bakery",
    category: "bocadillos",
    name: "Croissant Mixto (Jamón y Queso)",
    nameEn: "Ham & Cheese Butter Croissant",
    desc: "Croissant de mantequilla relleno de jamón selecto y queso fundente.",
    descEn: "Butter croissant filled with select ham and cheese.",
    price: "3,99 €",
    icon: "sandwich",
  },
  {
    id: "b3",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo Especial · Mozzarella, Tomate y Pesto",
    nameEn: "Special Baguette · Mozzarella, Tomato & Pesto",
    desc: "Pan artesano con mozzarella fresca, tomate natural y hojas verdes.",
    descEn: "Artisan bread with fresh mozzarella, tomato and greens.",
    price: "6,99 €",
    icon: "sandwich",
  },
  {
    id: "b5",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo Especial · Pollo Asado y Mostaza Suave",
    nameEn: "Special Baguette · Roast Chicken & Mild Mustard",
    desc: "Bocadillo frío/templado de mostrador con lascas de pollo, tomate y mostaza antigua.",
    descEn: "Counter baguette with tender chicken slices, tomato and wholegrain mustard.",
    price: "6,99 €",
    icon: "sandwich",
  },
  {
    id: "b6",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo Especial · Tortilla y Jamón",
    nameEn: "Special Baguette · Spanish Omelette & Ham",
    desc: "Combinación tradicional de mostrador en pan recién horneado.",
    descEn: "Traditional counter combination served in freshly baked bread.",
    price: "6,99 €",
    icon: "sandwich",
  },
  {
    id: "b7",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo Especial · Pastrami",
    nameEn: "Special Baguette · Deli Pastrami",
    desc: "Finas lonchas de pastrami curado, pepinillo y mostaza en pan artesano.",
    descEn: "Thinly sliced cured pastrami, pickles and mustard on artisan bread.",
    price: "6,99 €",
    icon: "sandwich",
  },
  {
    id: "b8",
    mode: "bakery",
    category: "bocadillos",
    name: "Bocadillo Especial · Mortadela Italiana y Parmesano",
    nameEn: "Special Baguette · Italian Mortadella & Parmesan",
    desc: "Mortadela de pistacho al corte y lascas de Parmesano Reggiano.",
    descEn: "Sliced pistachio mortadella and Parmigiano Reggiano shavings.",
    price: "6,99 €",
    icon: "sandwich",
  },
  {
    id: "e1",
    mode: "bakery",
    category: "bocadillos",
    name: "Empanada Gallega Artesana",
    nameEn: "Handmade Galician Savoury Pie",
    desc: "Masa fina y crujiente horneada en obrador, disponible al corte por peso.",
    descEn: "Thin, crisp crust baked in our bakery, sold by weight.",
    price: "30,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "bag",
  },
  {
    id: "e2",
    mode: "bakery",
    category: "bocadillos",
    name: "Empanadillas Artesanas Variadas",
    nameEn: "Assorted Handmade Empanadillas",
    desc: "Empanadillas individuales horneadas a diario en nuestro obrador.",
    descEn: "Individual savoury pastries freshly baked every day.",
    price: "3,99 €",
    icon: "bag",
  },
  {
    id: "e3",
    mode: "bakery",
    category: "bocadillos",
    name: "Focaccia Artesana Rellena",
    nameEn: "Filled Artisan Focaccia",
    desc: "Focaccia con aceite de oliva virgen extra, romero y embutidos selectos.",
    descEn: "Focaccia with extra virgin olive oil, rosemary and select cold cuts.",
    price: "5,50 €",
    icon: "sandwich",
  },

  // ===========================================================================
  // 6. SWEET & SALTY PACKS (BAKERY — Encargos para oficina y reuniones)
  // ===========================================================================
  {
    id: "p1",
    mode: "bakery",
    category: "packs",
    name: "Sweet Pack · 8 unidades",
    nameEn: "Sweet Pack · 8 pieces",
    desc: "Selección de palmeritas artesanas y bollería de mantequilla para compartir.",
    descEn: "Assortment of artisan palmiers and butter pastries ready to share.",
    price: "7,90 €",
    icon: "bag",
  },
  {
    id: "p2",
    mode: "bakery",
    category: "packs",
    name: "Sweet Pack · 12 unidades",
    nameEn: "Sweet Pack · 12 pieces",
    desc: "Caja de 12 piezas de palmeritas y hojaldres de mantequilla para oficinas.",
    descEn: "Box of 12 artisan palmiers and butter pastries for office meetings.",
    price: "10,90 €",
    badge: "Oficinas",
    badgeEn: "Offices",
    icon: "bag",
  },
  {
    id: "p3",
    mode: "bakery",
    category: "packs",
    name: "Sweet Pack · 24 unidades",
    nameEn: "Sweet Pack · 24 pieces",
    desc: "Bandeja de 24 piezas dulces de obrador para eventos y celebraciones.",
    descEn: "Tray of 24 artisan bakery sweets for events and celebrations.",
    price: "20,00 €",
    badge: "Eventos",
    badgeEn: "Events",
    icon: "bag",
  },
  {
    id: "p4",
    mode: "bakery",
    category: "packs",
    name: "Salty Pack · 4 unidades",
    nameEn: "Salty Pack · 4 pieces",
    desc: "4 empanadillas artesanas variadas listas para llevar o servir.",
    descEn: "4 assorted handmade savoury pastries ready to serve.",
    price: "14,00 €",
    icon: "bag",
  },
  {
    id: "p5",
    mode: "bakery",
    category: "packs",
    name: "Salty Pack · 6 unidades",
    nameEn: "Salty Pack · 6 pieces",
    desc: "6 empanadillas artesanas variadas horneadas en obrador.",
    descEn: "6 assorted handmade savoury pastries freshly baked in-house.",
    price: "20,00 €",
    badge: "Reuniones",
    badgeEn: "Meetings",
    icon: "bag",
  },
  {
    id: "p6",
    mode: "bakery",
    category: "packs",
    name: "Salty Pack · 12 unidades",
    nameEn: "Salty Pack · 12 pieces",
    desc: "12 empanadillas artesanas variadas para eventos de empresa o reuniones.",
    descEn: "12 assorted handmade savoury pastries for corporate events or gatherings.",
    price: "38,00 €",
    badge: "Formato Evento",
    badgeEn: "Event Size",
    icon: "bag",
  },

  // ===========================================================================
  // 7. JAMONES IBÉRICOS ENTEROS (GOURMET — Sección 4 con Corte Gratuito)
  // ===========================================================================
  {
    id: "je1",
    mode: "gourmet",
    category: "jamones_enteros",
    name: "Jamón 5 Jotas · Pieza Entera",
    nameEn: "5 Jotas Acorn-Fed Iberian Ham · Whole Piece",
    desc: "Pieza exclusiva Cinco Jotas (7 a 8 kg aprox. · Precio orientativo: 89,90 €/kg). Incluye gratis a elección el servicio de corte y envasado al vacío al encargar tu pieza.",
    descEn: "Exclusive Cinco Jotas whole ham (approx. 7–8 kg · Ref: €89.90/kg). Includes complimentary optional slicing and vacuum-packing service upon pre-order.",
    price: "625,00 €",
    badge: "Corte y envasado gratis",
    badgeEn: "Free slicing & vacuum pack",
    unitInfo: "Precio por pieza entera",
    unitInfoEn: "Price per whole piece",
    weightInfo: "Peso aproximado: 7 a 8 kg",
    weightInfoEn: "Approx. weight: 7 to 8 kg",
    refPricePerKg: "89,90 €/kg",
    freeCuttingService: true,
    icon: "ham",
    featured: true,
  },
  {
    id: "je2",
    mode: "gourmet",
    category: "jamones_enteros",
    name: "Jamón Joselito · Pieza Entera",
    nameEn: "Joselito Gran Reserva Ham · Whole Piece",
    desc: "Pieza única Joselito Gran Reserva (7,5 a 8 kg aprox. · Precio orientativo: 80,99 €/kg). Incluye gratis a elección el servicio de corte y envasado al vacío al encargar tu pieza.",
    descEn: "Joselito Gran Reserva whole ham (approx. 7.5–8 kg · Ref: €80.99/kg). Includes complimentary optional slicing and vacuum-packing service upon pre-order.",
    price: "670,00 €",
    badge: "Corte y envasado gratis",
    badgeEn: "Free slicing & vacuum pack",
    unitInfo: "Precio por pieza entera",
    unitInfoEn: "Price per whole piece",
    weightInfo: "Peso aproximado: 7,5 a 8 kg",
    weightInfoEn: "Approx. weight: 7.5 to 8 kg",
    refPricePerKg: "80,99 €/kg",
    freeCuttingService: true,
    icon: "ham",
    featured: true,
  },
  {
    id: "je3",
    mode: "gourmet",
    category: "jamones_enteros",
    name: "Jamón de Extremadura · Pieza Entera",
    nameEn: "Extremadura Iberian Ham · Whole Piece",
    desc: "Pieza seleccionada de Extremadura (7 a 9 kg aprox. · Precio orientativo: 60,99 €/kg). Incluye gratis a elección el servicio de corte y envasado al vacío al encargar tu pieza.",
    descEn: "Selected Extremadura Iberian whole ham (approx. 7–9 kg · Ref: €60.99/kg). Includes complimentary optional slicing and vacuum-packing service upon pre-order.",
    price: "440,00 €",
    badge: "Corte y envasado gratis",
    badgeEn: "Free slicing & vacuum pack",
    unitInfo: "Precio por pieza entera",
    unitInfoEn: "Price per whole piece",
    weightInfo: "Peso aproximado: 7 a 9 kg",
    weightInfoEn: "Approx. weight: 7 to 9 kg",
    refPricePerKg: "60,99 €/kg",
    freeCuttingService: true,
    icon: "ham",
    featured: true,
  },
  {
    id: "je4",
    mode: "gourmet",
    category: "jamones_enteros",
    name: "Jamón Ibérico Cebo Campo · Pieza Entera",
    nameEn: "Cebo de Campo Iberian Ham · Whole Piece",
    desc: "Pieza de jamón ibérico Cebo de Campo (Precio orientativo: 38,99 €/kg · Peso según pieza). Incluye gratis a elección el servicio de corte y envasado al vacío al encargar tu pieza.",
    descEn: "Cebo de Campo free-range Iberian whole ham (Ref: €38.99/kg). Includes complimentary optional slicing and vacuum-packing service upon pre-order.",
    price: "280,00 €",
    badge: "Corte y envasado gratis",
    badgeEn: "Free slicing & vacuum pack",
    unitInfo: "Precio por pieza entera",
    unitInfoEn: "Price per whole piece",
    weightInfo: "Peso según pieza seleccionada",
    weightInfoEn: "Weight according to selected piece",
    refPricePerKg: "38,99 €/kg",
    freeCuttingService: true,
    icon: "ham",
    featured: true,
  },

  // ===========================================================================
  // 8. SOBRES DE JAMÓN IBÉRICO CORTADO Y ENVASADO AL VACÍO (100 g — Sección 6)
  // ===========================================================================
  {
    id: "sj1",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Joselito Cortado a Máquina (100 g)",
    nameEn: "Machine-Sliced Joselito Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón Joselito cortado a máquina y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of precision machine-sliced Joselito ham.",
    price: "24,49 €",
    badge: "Sobre 100 g · Vacío",
    badgeEn: "100g Vacuum Pack",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
    featured: true,
  },
  {
    id: "sj2",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Joselito Cortado a Mano (100 g)",
    nameEn: "Hand-Carved Joselito Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón Joselito cortado a cuchillo y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of master hand-carved Joselito ham.",
    price: "22,99 €",
    badge: "Corte a mano · 100 g",
    badgeEn: "Hand-Carved · 100g",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
    featured: true,
  },
  {
    id: "sj3",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón 5 Jotas (100 g)",
    nameEn: "5 Jotas Iberian Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón Cinco Jotas 100 % ibérico envasado al vacío.",
    descEn: "100g vacuum-sealed pack of Cinco Jotas 100% Iberian ham.",
    price: "22,99 €",
    badge: "Cinco Jotas · 100 g",
    badgeEn: "5 Jotas · 100g",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
    featured: true,
  },
  {
    id: "sj4",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Ibérico Extremadura (100 g)",
    nameEn: "Extremadura Iberian Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón ibérico de Extremadura cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Extremadura Iberian ham.",
    price: "19,80 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj5",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Ibérico Los Pedroches (100 g)",
    nameEn: "Los Pedroches Iberian Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón ibérico de Los Pedroches cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Los Pedroches Iberian ham.",
    price: "19,90 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj6",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Bellota 50 % Raza Ibérica (100 g)",
    nameEn: "50% Iberian Breed Acorn-Fed Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón de bellota 50 % raza ibérica envasado al vacío.",
    descEn: "100g vacuum-sealed pack of 50% Iberian breed acorn-fed ham.",
    price: "14,90 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj7",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Bellota Tapas (100 g)",
    nameEn: "Acorn-Fed Tapas Cut Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón de bellota corte tapas envasado al vacío.",
    descEn: "100g vacuum-sealed pack of tapas-cut acorn-fed ham.",
    price: "10,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj8",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Ibérico de Cebo (100 g)",
    nameEn: "Cebo Iberian Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón ibérico de cebo cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Cebo Iberian ham.",
    price: "8,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj9",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Cebo (100 g)",
    nameEn: "Sliced Cebo Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón de cebo cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Cebo ham.",
    price: "7,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "sj10",
    mode: "gourmet",
    category: "sobres_jamon",
    name: "Sobre Jamón Cruzado (100 g)",
    nameEn: "Crossbred Cured Ham Pack (100 g)",
    desc: "Sobre de 100 gramos de jamón cruzado cortado y envasado al vacío para consumo diario.",
    descEn: "100g vacuum-sealed pack of sliced crossbred cured ham.",
    price: "4,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },

  // ===========================================================================
  // 9. EMBUTIDOS Y ESPECIALIDADES IBÉRICAS POR KILO (GOURMET — Sección 5)
  // ===========================================================================
  {
    id: "em1",
    mode: "gourmet",
    category: "embutidos",
    name: "Presa Ibérica Curada",
    nameEn: "Cured Iberian Presa",
    desc: "Pieza o corte al peso de presa ibérica curada de extraordinaria infiltración.",
    descEn: "Exquisitely marbled cured Iberian presa sold by weight.",
    price: "98,00 € / kg",
    badge: "Alta Selección",
    badgeEn: "Prime Selection",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
    featured: true,
  },
  {
    id: "em2",
    mode: "gourmet",
    category: "embutidos",
    name: "Chorizo Joselito",
    nameEn: "Joselito Iberian Chorizo",
    desc: "Chorizo vela Joselito de curación natural en secadero tradicional, venta al peso.",
    descEn: "Naturally cured Joselito Iberian chorizo sold by weight.",
    price: "39,90 € / kg",
    badge: "Joselito",
    badgeEn: "Joselito",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
  },
  {
    id: "em3",
    mode: "gourmet",
    category: "embutidos",
    name: "Lomo Ibérico 100 % Bellota",
    nameEn: "100% Acorn-Fed Iberian Loin",
    desc: "Caña de lomo 100 % ibérico de bellota de curación lenta en bodega, venta al peso.",
    descEn: "Slow-cured 100% acorn-fed Iberian pork loin sold by weight.",
    price: "89,90 € / kg",
    badge: "100 % Bellota",
    badgeEn: "100% Acorn-Fed",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
    featured: true,
  },
  {
    id: "em4",
    mode: "gourmet",
    category: "embutidos",
    name: "Lomo Ibérico 75 % Bellota",
    nameEn: "75% Acorn-Fed Iberian Loin",
    desc: "Lomo ibérico de bellota 75 % raza ibérica al corte o por pieza al peso.",
    descEn: "75% Iberian breed acorn-fed cured pork loin sold by weight.",
    price: "72,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
  },
  {
    id: "em5",
    mode: "gourmet",
    category: "embutidos",
    name: "Salchichón Joselito",
    nameEn: "Joselito Iberian Salchichón",
    desc: "Salchichón Joselito elaborado con magros nobles, pimienta y sal marina, venta al peso.",
    descEn: "Joselito Iberian salchichón seasoned with black pepper and sea salt, sold by weight.",
    price: "39,90 € / kg",
    badge: "Joselito",
    badgeEn: "Joselito",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
  },
  {
    id: "em6",
    mode: "gourmet",
    category: "embutidos",
    name: "Lomo Ibérico Cebo Campo",
    nameEn: "Cebo de Campo Iberian Loin",
    desc: "Lomo ibérico de cebo de campo jugoso y aromático, venta al peso.",
    descEn: "Aromatic free-range Cebo de Campo Iberian loin sold by weight.",
    price: "47,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
  },
  {
    id: "em7",
    mode: "gourmet",
    category: "embutidos",
    name: "Chorizo Ibérico de Bellota",
    nameEn: "Acorn-Fed Iberian Chorizo",
    desc: "Chorizo ibérico de bellota adobado con pimentón tradicional, venta al peso.",
    descEn: "Acorn-fed Iberian chorizo cured with traditional paprika, sold by weight.",
    price: "37,99 € / kg",
    unitInfo: "Precio por kilo",
    unitInfoEn: "Price per kilo",
    icon: "ham",
  },
  {
    id: "g1",
    mode: "gourmet",
    category: "embutidos",
    name: "Ración de Jamón Ibérico 100 % Bellota a Cuchillo",
    nameEn: "Hand-Carved 100% Acorn-Fed Iberian Ham Plate",
    desc: "Plato recién cortado a cuchillo al momento para degustar en barra o llevar.",
    descEn: "Masterfully hand-carved to order for tasting at our bar or takeaway.",
    price: "24,50 €",
    badge: "Corte a cuchillo",
    badgeEn: "Hand-carved",
    icon: "ham",
  },
  {
    id: "g3",
    mode: "gourmet",
    category: "embutidos",
    name: "Ración de Cecina de León Reserva",
    nameEn: "León Cured Beef Reserve Plate",
    desc: "Láminas finas de cecina de León con aceite de oliva virgen extra.",
    descEn: "Fine slices of León cured beef dressed with extra virgin olive oil.",
    price: "16,50 €",
    icon: "ham",
  },

  // ===========================================================================
  // 10. SOBRES DE EMBUTIDOS IBÉRICOS CORTADOS AL VACÍO (100 g — Sección 7)
  // ===========================================================================
  {
    id: "se1",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Lomo Ibérico de Bellota (100 g)",
    nameEn: "Sliced Acorn-Fed Iberian Loin Pack (100 g)",
    desc: "Sobre de 100 gramos de lomo ibérico de bellota cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced acorn-fed Iberian loin.",
    price: "7,99 €",
    badge: "Sobre 100 g · Vacío",
    badgeEn: "100g Vacuum Pack",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se2",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Lomo Ibérico de Cebo (100 g)",
    nameEn: "Sliced Cebo Iberian Loin Pack (100 g)",
    desc: "Sobre de 100 gramos de lomo ibérico de cebo cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Cebo Iberian loin.",
    price: "5,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se3",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Salchichón de Bellota (100 g)",
    nameEn: "Sliced Acorn-Fed Salchichón Pack (100 g)",
    desc: "Sobre de 100 gramos de salchichón ibérico de bellota cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced acorn-fed Iberian salchichón.",
    price: "5,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se4",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Chorizo de Bellota (100 g)",
    nameEn: "Sliced Acorn-Fed Chorizo Pack (100 g)",
    desc: "Sobre de 100 gramos de chorizo ibérico de bellota cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced acorn-fed Iberian chorizo.",
    price: "5,99 €",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se5",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Cecina de León (100 g)",
    nameEn: "Sliced León Cured Beef Pack (100 g)",
    desc: "Sobre de 100 gramos de cecina de León cortada fina y envasada al vacío.",
    descEn: "100g vacuum-sealed pack of thinly sliced León cured beef.",
    price: "8,99 €",
    badge: "Cecina León · 100 g",
    badgeEn: "León Beef · 100g",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se6",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Salchichón Joselito (100 g)",
    nameEn: "Sliced Joselito Salchichón Pack (100 g)",
    desc: "Sobre de 100 gramos de salchichón Joselito cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Joselito salchichón.",
    price: "7,99 €",
    badge: "Joselito · 100 g",
    badgeEn: "Joselito · 100g",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },
  {
    id: "se7",
    mode: "gourmet",
    category: "sobres_embutidos",
    name: "Sobre Chorizo Joselito (100 g)",
    nameEn: "Sliced Joselito Chorizo Pack (100 g)",
    desc: "Sobre de 100 gramos de chorizo Joselito cortado y envasado al vacío.",
    descEn: "100g vacuum-sealed pack of sliced Joselito chorizo.",
    price: "7,99 €",
    badge: "Joselito · 100 g",
    badgeEn: "Joselito · 100g",
    unitInfo: "Sobre 100 g envasado al vacío",
    unitInfoEn: "100g vacuum-sealed pack",
    icon: "ham",
  },

  // ===========================================================================
  // 11. NUESTRA SELECCIÓN DE QUESOS (GOURMET — Sección 9: Por kilo y Por unidad)
  // ===========================================================================
  {
    id: "q1",
    mode: "gourmet",
    category: "quesos",
    name: "Queso con Champiñones y Castañas",
    nameEn: "Cheese with Mushrooms & Chestnuts",
    desc: "Queso de autor afinado con notas otoñales de boletus y castaña. Venta al corte por kilo.",
    descEn: "Specialty cheese infused with mushrooms and roasted chestnuts. Sold by weight.",
    price: "48,99 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q2",
    mode: "gourmet",
    category: "quesos",
    name: "Queso Bóer con Miel y Trufa",
    nameEn: "Boer Cheese with Honey & Truffle",
    desc: "Equilibrio aromático entre el dulzor de la miel y el perfume de la trufa. Venta por kilo.",
    descEn: "Aromatic balance of natural honey and black truffle notes. Sold by weight.",
    price: "49,99 € / kg",
    badge: "Especialidad",
    badgeEn: "Specialty",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
    featured: true,
  },
  {
    id: "q3",
    mode: "gourmet",
    category: "quesos",
    name: "Pecorino Trufado",
    nameEn: "Truffled Pecorino Sheep Cheese",
    desc: "Queso italiano de leche de oveja con vetas de trufa negra. Venta al corte por kilo.",
    descEn: "Italian sheep's milk cheese veined with black truffle. Sold by weight.",
    price: "49,99 € / kg",
    badge: "Trufado",
    badgeEn: "Truffled",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
    featured: true,
  },
  {
    id: "q4",
    mode: "gourmet",
    category: "quesos",
    name: "Parmesano Reggiano",
    nameEn: "Parmigiano Reggiano",
    desc: "Curación prolongada, textura cristalina y sabor umami intenso. Venta al corte por kilo.",
    descEn: "Long-aged Italian Parmesan with crystalline texture and rich umami. Sold by weight.",
    price: "39,99 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q5",
    mode: "gourmet",
    category: "quesos",
    name: "Queso Manchego de Oveja",
    nameEn: "Manchego Sheep Cheese",
    desc: "Queso tradicional de leche de oveja de pasta firme y sabor persistente. Venta por kilo.",
    descEn: "Traditional Spanish sheep's milk cheese with firm paste and lingering finish. Sold by weight.",
    price: "39,90 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q6",
    mode: "gourmet",
    category: "quesos",
    name: "Queso Majorero",
    nameEn: "Majorero Goat Cheese",
    desc: "Queso canario de cabra de textura mantecosa y carácter único. Venta al corte por kilo.",
    descEn: "Canary Islands goat cheese with a buttery texture and distinctive character. Sold by weight.",
    price: "39,90 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q7",
    mode: "gourmet",
    category: "quesos",
    name: "Gouda con Pesto Rojo",
    nameEn: "Red Pesto Gouda",
    desc: "Queso Gouda aromatizado con tomate seco, albahaca y especias mediterráneas. Venta por kilo.",
    descEn: "Creamy Gouda infused with sun-dried tomato, basil and Mediterranean herbs. Sold by weight.",
    price: "29,99 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q8",
    mode: "gourmet",
    category: "quesos",
    name: "Gouda con Pesto Verde",
    nameEn: "Green Basil Pesto Gouda",
    desc: "Queso Gouda con albahaca fresca y ajo suave, vistoso y muy aromático. Venta por kilo.",
    descEn: "Vibrant green Gouda infused with fresh basil pesto. Sold by weight.",
    price: "29,99 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q9",
    mode: "gourmet",
    category: "quesos",
    name: "Queso Payoyo",
    nameEn: "Payoyo Sierra de Cádiz Cheese",
    desc: "Emblemático queso de la Sierra de Grazalema, cremoso y con personalidad. Venta por kilo.",
    descEn: "Iconic artisan cheese from Sierra de Cádiz, rich and expressive. Sold by weight.",
    price: "39,99 € / kg",
    badge: "Artesano",
    badgeEn: "Artisan",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "q10",
    mode: "gourmet",
    category: "quesos",
    name: "Queso Comté",
    nameEn: "French Comté Cheese",
    desc: "Clásico alpino de leche cruda con notas de avellana tostada y mantequilla. Venta por kilo.",
    descEn: "Classic French Alpine raw-milk cheese with roasted hazelnut notes. Sold by weight.",
    price: "49,99 € / kg",
    unitInfo: "Queso al corte por kilo",
    unitInfoEn: "Sold by weight (/kg)",
    subGroup: "por_kilo",
    icon: "cheese",
  },
  {
    id: "qu1",
    mode: "gourmet",
    category: "quesos",
    name: "Cuña de Queso San Antonio (Por unidad)",
    nameEn: "San Antonio Cheese Wedge (Per unit)",
    desc: "Cuña cerrada lista para llevar o incluir en tu encargo gourmet. Precio por unidad.",
    descEn: "Pre-packed artisan cheese wedge ready for takeaway or gift baskets. Price per unit.",
    price: "9,99 €",
    badge: "Cuña por unidad",
    badgeEn: "Wedge per unit",
    unitInfo: "Precio por cuña (unidad)",
    unitInfoEn: "Price per wedge (unit)",
    subGroup: "por_unidad",
    icon: "cheese",
  },
  {
    id: "qu2",
    mode: "gourmet",
    category: "quesos",
    name: "Cuña de Queso Ahuyentalobos (Por unidad)",
    nameEn: "Ahuyentalobos Cheese Wedge (Per unit)",
    desc: "Cuña seleccionada de carácter intenso lista para llevar. Precio por unidad.",
    descEn: "Selected full-bodied cheese wedge ready to take home. Price per unit.",
    price: "10,99 €",
    badge: "Cuña por unidad",
    badgeEn: "Wedge per unit",
    unitInfo: "Precio por cuña (unidad)",
    unitInfoEn: "Price per wedge (unit)",
    subGroup: "por_unidad",
    icon: "cheese",
  },

  // ===========================================================================
  // 12. ACEITES DE OLIVA VIRGEN EXTRA (GOURMET — Sección 8)
  // ===========================================================================
  {
    id: "ao1",
    mode: "gourmet",
    category: "aceites",
    name: "Aceite de Oliva Ecológico en Lata",
    nameEn: "Organic Extra Virgin Olive Oil in Tin",
    desc: "Aceite de oliva virgen extra de cultivo ecológico presentado en lata protectora.",
    descEn: "Organic extra virgin olive oil presented in a light-protective tin.",
    price: "14,99 €",
    badge: "Ecológico",
    badgeEn: "Organic",
    unitInfo: "Formato lata · Precio por unidad",
    unitInfoEn: "Tin format · Price per unit",
    icon: "wine",
    featured: true,
  },
  {
    id: "ao2",
    mode: "gourmet",
    category: "aceites",
    name: "Aceite de Oliva Virgen Extra Arbequina",
    nameEn: "Arbequina Extra Virgin Olive Oil",
    desc: "Monovarietal Arbequina frutado, suave y almendrado, ideal para tostas, ensaladas y repostería.",
    descEn: "Fruity, delicate Arbequina single-estate EVOO with almond notes.",
    price: "22,99 €",
    badge: "AOVE Selección",
    badgeEn: "Select EVOO",
    unitInfo: "Precio por unidad",
    unitInfoEn: "Price per unit",
    icon: "wine",
  },
  {
    id: "ao3",
    mode: "gourmet",
    category: "aceites",
    name: "Aceite de Oliva Virgen Extra Lucio Picual",
    nameEn: "Lucio Picual Extra Virgin Olive Oil",
    desc: "AOVE variedad Picual de cosecha temprana, con carácter herbáceo y gran riqueza en antioxidantes.",
    descEn: "Early-harvest Picual EVOO with vibrant herbaceous notes and rich polyphenols.",
    price: "22,99 €",
    unitInfo: "Precio por unidad",
    unitInfoEn: "Price per unit",
    icon: "wine",
  },
  {
    id: "ao4",
    mode: "gourmet",
    category: "aceites",
    name: "Aceite de Oliva Virgen Extra Lucio Milenium",
    nameEn: "Lucio Milenium Extra Virgin Olive Oil",
    desc: "Edición especial Lucio Milenium procedente de olivos seleccionados, elegante y equilibrado.",
    descEn: "Special Lucio Milenium edition from selected olive groves, balanced and expressive.",
    price: "22,99 €",
    badge: "Edición Gourmet",
    badgeEn: "Gourmet Edition",
    unitInfo: "Precio por unidad",
    unitInfoEn: "Price per unit",
    icon: "wine",
  },
  {
    id: "ao5",
    mode: "gourmet",
    category: "aceites",
    name: "Aceite de Oliva Virgen Extra El Silencio",
    nameEn: "El Silencio Extra Virgin Olive Oil",
    desc: "Aceite de oliva virgen extra de extracción en frío, limpio y fragante en boca.",
    descEn: "Cold-extracted extra virgin olive oil, fragrant and harmonious on the palate.",
    price: "17,99 €",
    unitInfo: "Precio por unidad",
    unitInfoEn: "Price per unit",
    icon: "wine",
  },
  {
    id: "ao6",
    mode: "gourmet",
    category: "aceites",
    name: "AOVE Señoríos de Relleu · Formato Pequeño",
    nameEn: "Señoríos de Relleu EVOO · Small Bottle",
    desc: "Aceite de autor alicantino premiado internacionalmente, ideal para degustación o regalo gourmet.",
    descEn: "Award-winning boutique Alicante EVOO in a compact tasting/gift format.",
    price: "9,99 €",
    unitInfo: "Formato pequeño · Precio por unidad",
    unitInfoEn: "Small format · Price per unit",
    icon: "wine",
  },
  {
    id: "ao7",
    mode: "gourmet",
    category: "aceites",
    name: "AOVE Señoríos de Relleu · Formato Botella",
    nameEn: "Señoríos de Relleu EVOO · Full Bottle",
    desc: "Botella de diseño de Señoríos de Relleu con coupage de variedades autóctonas mediterráneas.",
    descEn: "Signature design bottle of Señoríos de Relleu crafted from native Mediterranean olives.",
    price: "22,99 €",
    badge: "Alta Almazara",
    badgeEn: "Boutique Mill",
    unitInfo: "Formato botella · Precio por unidad",
    unitInfoEn: "Full bottle · Price per unit",
    icon: "wine",
  },

  // ===========================================================================
  // 13. BODEGA, VINOS, VERMUT Y CERVEZA (GOURMET — Precios actualizados Sección 10)
  // ===========================================================================
  {
    id: "g8",
    mode: "gourmet",
    category: "vinos",
    name: "Copa de Vino Selección (Ribera / Rioja / Blanco)",
    nameEn: "Glass of Selected D.O. Wine",
    desc: "Copa de vino tinto o blanco D.O. seleccionada para maridar con jamón ibérico y quesos.",
    descEn: "Glass of selected D.O. red or white wine paired with Iberian ham and cheeses.",
    price: "4,50 €",
    badge: "Bodega",
    badgeEn: "Cellar",
    icon: "wine",
  },
  {
    id: "g9",
    mode: "gourmet",
    category: "vinos",
    name: "Copa de Vermut",
    nameEn: "Glass of Traditional Vermouth",
    desc: "Vermut servido bien frío con aceituna y piel de cítrico para el aperitivo.",
    descEn: "Chilled traditional vermouth served with olive and citrus peel.",
    price: "4,50 €",
    badge: "Aperitivo",
    badgeEn: "Aperitif",
    icon: "wine",
  },
  {
    id: "g20",
    mode: "gourmet",
    category: "vinos",
    name: "Cerveza Tercio",
    nameEn: "Bottled Beer (33 cl)",
    desc: "Tercio de cerveza bien fría perfecta para acompañar bocadillos, gildas o tablas.",
    descEn: "Ice-cold 33cl bottled beer, ideal with Iberian baguettes, gildas or boards.",
    price: "4,50 €",
    icon: "wine",
  },

  // ===========================================================================
  // 14. CONSERVAS, GILDAS Y APERITIVOS (GOURMET — Gilda actualizada a 2,80 €)
  // ===========================================================================
  {
    id: "c15",
    mode: "gourmet",
    category: "conservas",
    name: "Gilda Clásica",
    nameEn: "Classic Gilda Skewer",
    desc: "Aperitivo emblemático de aceituna, piparra tierna y anchoa seleccionada.",
    descEn: "Iconic skewer with olive, tender guindilla pepper and salted anchovy.",
    price: "2,80 €",
    badge: "Aperitivo",
    badgeEn: "Aperitif",
    unitInfo: "Precio por unidad",
    unitInfoEn: "Price per unit",
    icon: "bag",
  },
  {
    id: "c16",
    mode: "gourmet",
    category: "conservas",
    name: "Aceitunas Variadas de Aperitivo",
    nameEn: "Assorted Marinated Olives",
    desc: "Selección de aceitunas aliñadas listas para degustar en barra o llevar.",
    descEn: "Selection of marinated olives ready to enjoy at the bar or take home.",
    price: "3,90 €",
    icon: "bag",
  },
  {
    id: "c17",
    mode: "gourmet",
    category: "conservas",
    name: "Boquerones en Conserva",
    nameEn: "Pickled White Anchovies",
    desc: "Conserva tradicional del mar aliñada con aceite de oliva virgen extra.",
    descEn: "Traditional marinated white anchovies dressed with extra virgin olive oil.",
    price: "4,50 €",
    icon: "bag",
  },
  {
    id: "c18",
    mode: "gourmet",
    category: "conservas",
    name: "Sardinas en Conserva",
    nameEn: "Preserved Atlantic Sardines",
    desc: "Sardinas seleccionadas en aceite de oliva para compartir en el aperitivo.",
    descEn: "Selected Atlantic sardines in olive oil, ideal for sharing.",
    price: "6,90 €",
    icon: "bag",
  },
  {
    id: "c19",
    mode: "gourmet",
    category: "conservas",
    name: "Salmón Ahumado Selección",
    nameEn: "Premium Smoked Salmon",
    desc: "Láminas de salmón ahumado en frío listas para degustar.",
    descEn: "Delicate cold-smoked salmon slices ready to enjoy.",
    price: "7,90 €",
    icon: "bag",
  },

  // ===========================================================================
  // 15. RACIONES FRÍAS, TOSTAS Y TABLAS (GOURMET — Sin cocina caliente)
  // ===========================================================================
  {
    id: "g6",
    mode: "gourmet",
    category: "bocadillos",
    name: "Tosta de Cecina de León y Parmesano",
    nameEn: "León Cured Beef & Parmesan Toast",
    desc: "Rebanada de hogaza artesana con cecina de León, rúcula y lascas de Parmesano Reggiano.",
    descEn: "Artisan bread slice topped with León cured beef, rocket and Parmigiano Reggiano.",
    price: "8,50 €",
    icon: "sandwich",
  },
  {
    id: "g7",
    mode: "gourmet",
    category: "bocadillos",
    name: "Bocadillo Gourmet de Jamón de Bellota",
    nameEn: "Acorn-Fed Iberian Ham Gourmet Baguette",
    desc: "Pan crujiente con jamón ibérico de bellota cortado al momento y AOVE.",
    descEn: "Crisp bread with freshly sliced acorn-fed Iberian ham and extra virgin olive oil.",
    price: "9,50 €",
    badge: "Bellota",
    badgeEn: "Acorn-Fed",
    icon: "sandwich",
  },
  {
    id: "r1",
    mode: "gourmet",
    category: "raciones",
    name: "Ensaladilla Clásica",
    nameEn: "Classic Russian Salad",
    desc: "Ración fría tradicional lista para tomar en barra o llevar.",
    descEn: "Classic cold salad portion ready for the tasting bar or takeaway.",
    price: "5,90 €",
    icon: "cheese",
  },
  {
    id: "r2",
    mode: "gourmet",
    category: "raciones",
    name: "Ensaladilla con Toque al Curry",
    nameEn: "Mild Curry Salad Portion",
    desc: "Elaboración fría de vitrina con suave matiz especiado.",
    descEn: "Chilled deli salad with a gentle spiced curry dressing.",
    price: "5,90 €",
    icon: "cheese",
  },
  {
    id: "r3",
    mode: "gourmet",
    category: "raciones",
    name: "Ensaladilla de Ahumados y Arenque",
    nameEn: "Herring & Smoked Fish Salad",
    desc: "Ración fría marinera ideal para el aperitivo.",
    descEn: "Chilled sea-inspired salad portion ideal as an aperitif.",
    price: "5,90 €",
    icon: "cheese",
  },
  {
    id: "r4",
    mode: "gourmet",
    category: "raciones",
    name: "Hummus con Mango y Toque Picante",
    nameEn: "Spicy Mango Hummus",
    desc: "Crema fría de garbanzo y mango para dipear con picos y regañás.",
    descEn: "Chilled chickpea and mango dip served with crisp breadsticks.",
    price: "5,90 €",
    icon: "cheese",
  },
  {
    id: "r5",
    mode: "gourmet",
    category: "raciones",
    name: "Hummus Mediterráneo de Berenjena",
    nameEn: "Mediterranean Aubergine Hummus",
    desc: "Crema fría de berenjena asada con aceite de oliva virgen extra.",
    descEn: "Chilled roasted aubergine dip dressed with extra virgin olive oil.",
    price: "5,90 €",
    icon: "cheese",
  },
  {
    id: "r6",
    mode: "gourmet",
    category: "raciones",
    name: "Ensalada Fresca de Tomate, Aguacate y Espárragos",
    nameEn: "Fresh Tomato, Avocado & Asparagus Salad",
    desc: "Elaboración fría aliñada con nuestro aceite de oliva virgen extra.",
    descEn: "Fresh cold salad dressed with our extra virgin olive oil.",
    price: "6,90 €",
    icon: "cheese",
  },
  {
    id: "g2",
    mode: "gourmet",
    category: "tablas",
    name: "Tabla Imperial de Ibéricos",
    nameEn: "Imperial Iberian Charcuterie Board",
    desc: "Selección de jamón ibérico, lomo de bellota, salchichón y chorizo Joselito con picos artesanos.",
    descEn: "Selection of Iberian ham, acorn-fed loin, Joselito salchichón and chorizo with breadsticks.",
    price: "28,00 €",
    badge: "Para compartir",
    badgeEn: "To share",
    icon: "ham",
  },
  {
    id: "t13",
    mode: "gourmet",
    category: "tablas",
    name: "Tabla de Quesos Seleccionados + 2 Copas de Vino",
    nameEn: "Artisan Cheese Board + 2 Glasses of Wine",
    desc: "Degustación de nuestros quesos nacionales e internacionales acompañada de dos copas de vino.",
    descEn: "Tasting board of our national and international cheeses with two glasses of wine.",
    price: "22,99 €",
    badge: "Para compartir",
    badgeEn: "To share",
    icon: "cheese",
  },
  {
    id: "t14",
    mode: "gourmet",
    category: "tablas",
    name: "Tabla de Ibéricos + 2 Copas de Vino",
    nameEn: "Iberian Board + 2 Glasses of Wine",
    desc: "Surtido de ibéricos de bellota recién cortados acompañado de dos copas de vino.",
    descEn: "Freshly sliced acorn-fed Iberian charcuterie board with two glasses of wine.",
    price: "29,90 €",
    icon: "ham",
  },
  {
    id: "t15",
    mode: "gourmet",
    category: "tablas",
    name: "Tabla Mixta de Jamón Ibérico y Quesos + 2 Copas",
    nameEn: "Mixed Iberian Ham & Cheese Board + 2 Glasses",
    desc: "Lo mejor de nuestra charcutería ibérica y selección de quesos con dos copas de vino.",
    descEn: "The best of our Iberian charcuterie and artisan cheeses with two glasses of wine.",
    price: "32,90 €",
    badge: "Favorita",
    badgeEn: "Favourite",
    icon: "ham",
    featured: true,
  },
  {
    id: "t16",
    mode: "gourmet",
    category: "tablas",
    name: "Tabla Italiana + 2 Copas de Vino",
    nameEn: "Italian Board + 2 Glasses of Wine",
    desc: "Mortadela, Pecorino trufado, Parmesano Reggiano y dos copas de vino.",
    descEn: "Mortadella, truffled Pecorino, Parmigiano Reggiano and two glasses of wine.",
    price: "20,90 €",
    icon: "cheese",
  },
  // Frutería y Carnicería del mismo local: precio según mercado y peso, confirmado al encargar.
  {
    id: "fr1",
    mode: "gourmet",
    category: "fruteria",
    name: "Fruta de temporada",
    nameEn: "Seasonal fruit",
    desc: "Selección diaria de fruta fresca: cítricos, manzanas, peras, uva o fruta de hueso según la época. Por kilo o por piezas.",
    descEn: "Fresh fruit picked daily: citrus, apples, pears, grapes or stone fruit depending on the season. By the kilo or by the piece.",
    price: "Consultar",
    unitInfo: "Precio según mercado, confirmado por WhatsApp",
    unitInfoEn: "Market price, confirmed via WhatsApp",
    badge: "Cada día",
    badgeEn: "Daily",
    icon: "bag",
  },
  {
    id: "fr2",
    mode: "gourmet",
    category: "fruteria",
    name: "Verdura y hortaliza fresca",
    nameEn: "Fresh vegetables",
    desc: "Lechugas, pimientos, calabacín, cebolla, patata y hortaliza de temporada para la compra de cada día.",
    descEn: "Lettuce, peppers, courgette, onions, potatoes and seasonal vegetables for your everyday shopping.",
    price: "Consultar",
    unitInfo: "Precio según mercado, confirmado por WhatsApp",
    unitInfoEn: "Market price, confirmed via WhatsApp",
    icon: "bag",
  },
  {
    id: "fr3",
    mode: "gourmet",
    category: "fruteria",
    name: "Tomate de temporada",
    nameEn: "Seasonal tomatoes",
    desc: "Tomate maduro y sabroso, perfecto para ensalada, tostada con aceite de oliva virgen extra o salmorejo.",
    descEn: "Ripe, flavourful tomatoes, perfect for salads, toast with extra virgin olive oil or salmorejo.",
    price: "Consultar",
    unitInfo: "Precio según mercado, confirmado por WhatsApp",
    unitInfoEn: "Market price, confirmed via WhatsApp",
    icon: "bag",
  },
  {
    id: "fr4",
    mode: "gourmet",
    category: "fruteria",
    name: "Aguacate y fruta tropical",
    nameEn: "Avocado & tropical fruit",
    desc: "Aguacate en su punto, mango, piña y otras frutas tropicales listas para disfrutar.",
    descEn: "Avocados at their best, mango, pineapple and other tropical fruit ready to enjoy.",
    price: "Consultar",
    unitInfo: "Precio según mercado, confirmado por WhatsApp",
    unitInfoEn: "Market price, confirmed via WhatsApp",
    icon: "bag",
  },
  {
    id: "fr5",
    mode: "gourmet",
    category: "fruteria",
    name: "Frutos rojos",
    nameEn: "Berries",
    desc: "Fresas, frambuesas y arándanos frescos en su temporada, en bandeja.",
    descEn: "Fresh strawberries, raspberries and blueberries in season, by the tray.",
    price: "Consultar",
    unitInfo: "Precio según mercado, confirmado por WhatsApp",
    unitInfoEn: "Market price, confirmed via WhatsApp",
    icon: "bag",
  },
  {
    id: "fr6",
    mode: "gourmet",
    category: "fruteria",
    name: "Cesta de fruta por encargo",
    nameEn: "Fruit basket to order",
    desc: "Cesta de fruta fresca montada al momento para regalar, para la oficina o para una celebración. Dinos tu presupuesto y la preparamos.",
    descEn: "Fresh fruit basket assembled to order as a gift, for the office or a celebration. Tell us your budget and we will prepare it.",
    price: "Consultar",
    unitInfo: "Por encargo, según presupuesto",
    unitInfoEn: "To order, to your budget",
    badge: "Ideal para regalar",
    badgeEn: "Great gift",
    icon: "bag",
  },
  {
    id: "ca1",
    mode: "gourmet",
    category: "carniceria",
    name: "Ternera",
    nameEn: "Beef",
    desc: "Filetes, chuletas, solomillo, entrecot y carne para guisar, cortados al momento a tu gusto.",
    descEn: "Steaks, chops, tenderloin, entrecôte and stewing beef, cut to order the way you like.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    badge: "Corte al momento",
    badgeEn: "Cut to order",
    icon: "ham",
  },
  {
    id: "ca2",
    mode: "gourmet",
    category: "carniceria",
    name: "Cerdo ibérico fresco",
    nameEn: "Fresh Iberian pork",
    desc: "Presa, secreto, pluma y lagarto ibérico fresco para plancha o brasa.",
    descEn: "Fresh Iberian presa, secreto, pluma and lagarto for the grill or barbecue.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    icon: "ham",
  },
  {
    id: "ca3",
    mode: "gourmet",
    category: "carniceria",
    name: "Pollo y aves",
    nameEn: "Chicken & poultry",
    desc: "Pollo entero o troceado, pechugas fileteadas, muslos y contramuslos limpios.",
    descEn: "Whole or jointed chicken, sliced breasts, cleaned thighs and drumsticks.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    icon: "ham",
  },
  {
    id: "ca4",
    mode: "gourmet",
    category: "carniceria",
    name: "Cordero",
    nameEn: "Lamb",
    desc: "Chuletillas, paletilla y pierna de cordero para asar o a la parrilla.",
    descEn: "Lamb chops, shoulder and leg for roasting or grilling.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    icon: "ham",
  },
  {
    id: "ca5",
    mode: "gourmet",
    category: "carniceria",
    name: "Carne picada y hamburguesas caseras",
    nameEn: "Minced meat & homemade burgers",
    desc: "Carne picada al momento (ternera, cerdo o mixta) y hamburguesas elaboradas en nuestra carnicería.",
    descEn: "Freshly minced meat (beef, pork or mixed) and burgers made in our butcher's shop.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    badge: "Elaboración propia",
    badgeEn: "Made in-house",
    icon: "ham",
  },
  {
    id: "ca6",
    mode: "gourmet",
    category: "carniceria",
    name: "Elaborados de carnicería",
    nameEn: "Butcher's specialties",
    desc: "Chorizo fresco, longaniza, pinchos morunos y brochetas preparados en tienda.",
    descEn: "Fresh chorizo, longaniza, pinchos morunos and skewers prepared in store.",
    price: "Consultar",
    unitInfo: "Precio según corte y peso, confirmado por WhatsApp",
    unitInfoEn: "Price by cut and weight, confirmed via WhatsApp",
    icon: "ham",
  },
];


/**
 * Fotografía gastronómica real asignada a cada referencia del catálogo actualizado.
 */
export const PRODUCT_REAL_PHOTOS: Record<string, string> = Object.fromEntries([
  ...menuItems.map(
    (item) => [item.id, `/assets/products/${item.id}.jpg`] as const
  ),
]);

export const menuImageById: Record<string, string> = { ...PRODUCT_REAL_PHOTOS };

export function menuImageFor(item: MenuItem & { imageUrl?: string }): string {
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl;
  }
  return PRODUCT_REAL_PHOTOS[item.id] ?? `/assets/products/${item.id}.jpg`;
}

export function menuImageStatusFor(_item: MenuItem): ImageValidationStatus {
  return "specific generated";
}

export function productRealPhotoFor(item: MenuItem & { imageUrl?: string }): string {
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl;
  }
  return PRODUCT_REAL_PHOTOS[item.id] ?? `/assets/products/${item.id}.jpg`;
}

export function menuPriceStatusFor(item: MenuItem): PriceValidationStatus {
  if (item.price === "Consultar") return "pending_owner_price_consultar";
  if (item.price.includes("/ kg")) return "confirmed_by_owner_by_weight";
  if (item.price.includes("/ unidad")) return "confirmed_by_owner_per_unit";
  if (item.price.startsWith("+")) return "confirmed_by_owner_addon";
  return "confirmed_by_owner_fixed";
}

export const categories: Record<Mode, { id: Category; es: string; en: string }[]> = {
  bakery: [
    { id: "todos", es: "Todo", en: "All" },
    { id: "desayunos", es: "Desayunos y Ofertas", en: "Breakfast & Promos" },
    { id: "cafeteria", es: "Cafetería y Bebidas", en: "Coffee & Drinks" },
    { id: "bolleria", es: "Panadería y Bollería", en: "Bakery & Pastries" },
    { id: "tartas", es: "Tartas", en: "Cakes" },
    { id: "bocadillos", es: "Bocadillos y Empanadas", en: "Sandwiches & Pies" },
    { id: "packs", es: "Sweet & Salty Packs", en: "Sweet & Salty Packs" },
  ],
  gourmet: [
    { id: "todos", es: "Todo", en: "All" },
    { id: "jamones_enteros", es: "Jamones Enteros", en: "Whole Hams" },
    { id: "sobres_jamon", es: "Jamón Envasado (100 g)", en: "Sliced Ham (100g)" },
    { id: "embutidos", es: "Embutidos por Kilo", en: "Iberian Charcuterie (/kg)" },
    { id: "sobres_embutidos", es: "Embutidos Envasados (100 g)", en: "Sliced Charcuterie (100g)" },
    { id: "quesos", es: "Selección de Quesos", en: "Artisan Cheeses" },
    { id: "aceites", es: "Aceites AOVE", en: "Extra Virgin Olive Oils" },
    { id: "tablas", es: "Tablas y Maridaje", en: "Sharing Boards" },
    { id: "conservas", es: "Gildas y Conservas", en: "Gildas & Preserves" },
    { id: "raciones", es: "Raciones Frías", en: "Cold Portions" },
    { id: "bocadillos", es: "Tostas e Ibéricos", en: "Gourmet Toasts" },
    { id: "vinos", es: "Vinos, Vermut y Cerveza", en: "Wine, Vermouth & Beer" },
    { id: "fruteria", es: "Frutería", en: "Greengrocer" },
    { id: "carniceria", es: "Carnicería", en: "Butcher" },
  ],
};

/**
 * Helper que determina si un producto puede ser encargado online (domicilio o recogida).
 * Regla de negocio estricta del propietario:
 * - Gourmet (jamones, embutidos, quesos, aceites, tablas, conservas, raciones, vinos): SÍ se puede encargar.
 * - Packs de catering / eventos ("packs"): SÍ se pueden encargar.
 * - Cafetería, desayunos del día, bollería y porciones de obrador: NO se encargan online, consumo exclusivo en local.
 */
export function canOrderOnline(item: MenuItem): boolean {
  if (item.mode === "gourmet") return true;
  if (item.category === "packs") return true;
  return false;
}

/**
 * Productos destacados de mayor margen y potencial de compra (100% Gourmet y Delicatessen):
 * - je1: Jamón 5 Jotas · Pieza Entera (625 € con corte y envasado gratis)
 * - je2: Jamón Joselito Gran Reserva · Pieza Entera (670 € con corte y envasado gratis)
 * - je3: Jamón de Extremadura · Pieza Entera (440 € con corte y envasado gratis)
 * - sj2: Sobre Joselito Cortado a Mano 100 g (22,99 €)
 * - sj3: Sobre Jamón 5 Jotas 100 g (22,99 €)
 * - em1: Presa Ibérica Curada (98,00 € / kg)
 * - em3: Lomo Ibérico 100 % Bellota (89,90 € / kg)
 * - q3: Pecorino Trufado (49,99 € / kg)
 * - q2: Queso Bóer con Miel y Trufa (49,99 € / kg)
 * - ao1: Aceite de Oliva Ecológico en Lata (14,99 €)
 * - t15: Tabla Mixta de Jamón Ibérico y Quesos + 2 Copas (32,90 €)
 */
export const FEATURED_IDS = [
  "je1",
  "je2",
  "je3",
  "sj2",
  "sj3",
  "em1",
  "em3",
  "q3",
  "q2",
  "ao1",
  "t15",
] as const;

export const UPSELL_IDS = ["sj2", "sj3", "ao1", "t15"] as const;

export function filterCatalogItems(params: {
  items?: MenuItem[];
  mode: Mode;
  category: Category;
  query: string;
}): MenuItem[] {
  const { items = menuItems, mode, category, query } = params;
  const normalizedQuery = normalizeSearchText(query);

  return items.filter((item) => {
    if (item.mode !== mode) return false;
    if (category !== "todos") {
      if (category === "ibericos") {
        if (
          ![
            "jamones_enteros",
            "sobres_jamon",
            "embutidos",
            "sobres_embutidos",
            "ibericos",
          ].includes(item.category)
        ) {
          return false;
        }
      } else if (item.category !== category) {
        return false;
      }
    }
    if (!normalizedQuery) return true;

    const catMeta = categories[item.mode].find((c) => c.id === item.category);
    const searchable = normalizeSearchText(
      [
        item.id,
        item.name,
        item.nameEn,
        item.desc,
        item.descEn,
        item.price,
        item.badge ?? "",
        item.badgeEn ?? "",
        item.unitInfo ?? "",
        item.weightInfo ?? "",
        item.refPricePerKg ?? "",
        catMeta?.es ?? "",
        catMeta?.en ?? "",
      ].join(" ")
    );
    return searchable.includes(normalizedQuery);
  });
}

export function buildWhatsAppOrderMessage(params: {
  items: { item: MenuItem; qty: number }[];
  modality: OrderModality;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  hamCuttingPreference?: HamCuttingPreference;
  desiredTime: string;
  notes: string;
  lang: Lang;
}): string {
  const {
    items,
    modality,
    customerName,
    customerPhone = "",
    deliveryAddress = "",
    hamCuttingPreference,
    desiredTime,
    notes,
    lang,
  } = params;

  const modalityLabels: Record<OrderModality, { es: string; en: string }> = {
    pickup: {
      es: "Recogida en el establecimiento (Calle de la Puebla, 15)",
      en: "In-store pickup (Calle de la Puebla, 15)",
    },
    delivery: {
      es: "Entrega a domicilio (gastos de envío aparte, a confirmar por el establecimiento)",
      en: "Home delivery (shipping fee calculated and confirmed separately by the store)",
    },
    reservation: {
      es: "Reserva de mesa / barra de degustación",
      en: "Table / tasting bar reservation",
    },
    event: {
      es: "Encargo especial para evento / empresa / regalo gourmet",
      en: "Corporate / event / bespoke gourmet gift order",
    },
  };

  if (items.length === 0) {
    return lang === "es"
      ? `Hola Corredera Bakery & Gourmet, quisiera realizar una solicitud de encargo (${modalityLabels[modality].es}).`
      : `Hello Corredera Bakery & Gourmet, I would like to submit an order request (${modalityLabels[modality].en}).`;
  }

  let numericTotal = 0;
  let hasConsultItems = false;
  let hasWholeHam = false;

  const lines = items.map(({ item, qty }) => {
    if (item.category === "jamones_enteros" || item.freeCuttingService) {
      hasWholeHam = true;
    }
    const unit = parsePriceEuros(item.price);
    const title = lang === "es" ? item.name : item.nameEn;
    if (unit !== null && !item.price.includes("/ kg")) {
      numericTotal += unit * qty;
      return `• ${qty}x ${title} (${formatPrice(item.price, lang)}) = ${formatEuros(unit * qty, lang)}`;
    }
    hasConsultItems = true;
    return `• ${qty}x ${title} (${formatPrice(item.price, lang)})`;
  });

  const header =
    lang === "es"
      ? "Hola Corredera Bakery & Gourmet, quiero realizar la siguiente solicitud de encargo:"
      : "Hello Corredera Bakery & Gourmet, I would like to submit the following order request:";

  const cuttingLabel =
    hasWholeHam && hamCuttingPreference
      ? hamCuttingPreference === "free_sliced_vacuum"
        ? lang === "es"
          ? "Preferencia pieza de jamón: Cortado y envasado al vacío (servicio gratuito incluido)"
          : "Whole ham preference: Hand-sliced & vacuum-packed (complimentary service included)"
        : lang === "es"
          ? "Preferencia pieza de jamón: Pieza entera sin empezar"
          : "Whole ham preference: Whole uncut piece"
      : "";

  const shippingNote =
    modality === "delivery"
      ? lang === "es"
        ? "🚚 Envío a domicilio: El coste del envío se calcula aparte y se confirma antes de finalizar el pedido."
        : "🚚 Home delivery: Shipping cost is calculated separately and confirmed before finalizing the order."
      : "";

  const parts = [
    header,
    "",
    ...lines,
    "",
    numericTotal > 0
      ? lang === "es"
        ? `Importe orientativo de productos: ${formatEuros(numericTotal, lang)}${hasConsultItems ? " (+ productos al corte por kilo)" : ""}`
        : `Estimated products subtotal: ${formatEuros(numericTotal, lang)}${hasConsultItems ? " (+ by-weight items)" : ""}`
      : hasConsultItems
        ? lang === "es"
          ? "Importe: A confirmar según peso exacto al corte por WhatsApp"
          : "Subtotal: Pending exact weight confirmation via WhatsApp"
        : "",
    `${lang === "es" ? "Modalidad de entrega" : "Delivery / Pickup"}: ${modalityLabels[modality][lang]}`,
    cuttingLabel,
    customerName.trim() ? `${lang === "es" ? "Nombre" : "Name"}: ${customerName.trim()}` : "",
    customerPhone.trim() ? `${lang === "es" ? "Teléfono" : "Phone"}: ${customerPhone.trim()}` : "",
    deliveryAddress.trim()
      ? `${lang === "es" ? "Dirección de entrega" : "Delivery address"}: ${deliveryAddress.trim()}`
      : "",
    desiredTime.trim() ? `${lang === "es" ? "Fecha / Hora deseada" : "Desired Date / Time"}: ${desiredTime.trim()}` : "",
    notes.trim() ? `${lang === "es" ? "Observaciones" : "Notes"}: ${notes.trim()}` : "",
    shippingNote,
  ].filter(Boolean);

  return parts.join("\n");
}
