import { z } from "zod";
import { SAFE_IMAGE_URL_REGEX } from "./catalogAdminSchema";

const noHtmlRefine = (val: string) => !/[<>]/.test(val);
const noHtmlMsg = "No se permiten etiquetas HTML (< o >) por seguridad (prevención XSS)";

const safeText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar ${max} caracteres`)
    .refine(noHtmlRefine, noHtmlMsg);

const optionalSafeText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar ${max} caracteres`)
    .refine(noHtmlRefine, noHtmlMsg)
    .default("");

const safeHttpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(8, `${label} es obligatorio`)
    .max(512, `${label} es demasiado largo`)
    .refine(
      (v) => /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(v) && !/[<>'"]/.test(v),
      `${label} debe ser una URL HTTPS válida`
    );

const safeImagePath = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(512, `${label} es demasiado largo`)
    .refine(
      (v) =>
        SAFE_IMAGE_URL_REGEX.test(v) &&
        !/javascript:|data:|vbscript:/i.test(v) &&
        !v.includes("..") &&
        !/[<>'"]/.test(v),
      `${label} debe ser una ruta local segura (/assets/...) o URL HTTPS verificada`
    );

export const SEASONAL_THEMES = [
  "festive_gold",
  "christmas_burgundy",
  "bakery_warm",
  "urgent_notice",
] as const;

export type SeasonalTheme = (typeof SEASONAL_THEMES)[number];

export const seasonalCampaignSchema = z.object({
  enabled: z.boolean().default(false),
  theme: z.enum(SEASONAL_THEMES).default("festive_gold"),
  badgeEs: safeText(2, 80, "Etiqueta de campaña (ES)"),
  badgeEn: safeText(2, 80, "Etiqueta de campaña (EN)"),
  titleEs: safeText(4, 180, "Título de campaña (ES)"),
  titleEn: safeText(4, 180, "Título de campaña (EN)"),
  descriptionEs: safeText(10, 600, "Descripción de campaña (ES)"),
  descriptionEn: safeText(10, 600, "Descripción de campaña (EN)"),
  ctaTextEs: safeText(2, 80, "Texto del botón (ES)"),
  ctaTextEn: safeText(2, 80, "Texto del botón (EN)"),
  whatsappPrefillEs: safeText(5, 300, "Mensaje WhatsApp de campaña (ES)"),
  whatsappPrefillEn: safeText(5, 300, "Mensaje WhatsApp de campaña (EN)"),
  imageUrl: safeImagePath("Imagen de campaña"),
});

export const siteHeroSchema = z.object({
  toplineEs: safeText(5, 180, "Barra superior (ES)"),
  toplineEn: safeText(5, 180, "Barra superior (EN)"),
  heroKickerEs: safeText(3, 120, "Antetítulo de portada (ES)"),
  heroKickerEn: safeText(3, 120, "Antetítulo de portada (EN)"),
  heroTitleEs: safeText(10, 220, "Título principal H1 (ES)"),
  heroTitleEn: safeText(10, 220, "Título principal H1 (EN)"),
  heroTextEs: safeText(10, 500, "Subtítulo de portada (ES)"),
  heroTextEn: safeText(10, 500, "Subtítulo de portada (EN)"),
  heroBakeryImageUrl: safeImagePath("Imagen portada Bakery"),
  heroGourmetImageUrl: safeImagePath("Imagen portada Gourmet"),
  interiorImageUrl: safeImagePath("Imagen interior mostrador"),
  bakeryCardDescEs: safeText(10, 260, "Resumen tarjeta Bakery (ES)"),
  bakeryCardDescEn: safeText(10, 260, "Resumen tarjeta Bakery (EN)"),
  gourmetCardDescEs: safeText(10, 260, "Resumen tarjeta Gourmet (ES)"),
  gourmetCardDescEn: safeText(10, 260, "Resumen tarjeta Gourmet (EN)"),
});

export const siteContactSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{9,15}$/, "El número de WhatsApp debe contener entre 9 y 15 dígitos (ej. 34640341932)"),
  whatsappDisplay: safeText(6, 32, "Teléfono WhatsApp visible"),
  landlineNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "El teléfono fijo debe contener entre 9 y 15 dígitos"),
  landlineDisplay: safeText(6, 32, "Teléfono fijo visible"),
  contactEmail: z.string().trim().email("Correo electrónico de contacto inválido").max(160),
  addressLine: safeText(5, 160, "Dirección postal"),
  neighborhoodNoteEs: safeText(5, 300, "Indicaciones de zona/metro (ES)"),
  neighborhoodNoteEn: safeText(5, 300, "Indicaciones de zona/metro (EN)"),
  instagramUrl: safeHttpsUrl("URL de Instagram"),
  instagramHandle: safeText(2, 60, "Usuario de Instagram"),
  tiktokUrl: safeHttpsUrl("URL de TikTok"),
  googleMapsUrl: safeHttpsUrl("URL de Google Maps"),
  whatsappOrdersEnabled: z.boolean().default(true),
  homeDeliveryEnabled: z.boolean().default(true),
  shippingNoticeEs: optionalSafeText(400, "Texto informativo de gastos de envío (ES)").default(
    "Realiza tu encargo y recíbelo en tu domicilio. El coste del envío se calcula aparte y se confirma antes de finalizar el pedido."
  ),
  shippingNoticeEn: optionalSafeText(400, "Texto informativo de gastos de envío (EN)").default(
    "Place your custom order for home delivery. Shipping fees are calculated separately and confirmed before finalizing your order."
  ),
  pauseOrdersNoticeEs: optionalSafeText(300, "Aviso de pausa de pedidos (ES)"),
  pauseOrdersNoticeEn: optionalSafeText(300, "Aviso de pausa de pedidos (EN)"),
});

export const siteScheduleSchema = z.object({
  bakeryWeekdaysEs: safeText(3, 100, "Horario Bakery L-J (ES)"),
  bakeryWeekdaysEn: safeText(3, 100, "Horario Bakery L-J (EN)"),
  bakeryWeekendEs: safeText(3, 100, "Horario Bakery V-S (ES)"),
  bakeryWeekendEn: safeText(3, 100, "Horario Bakery V-S (EN)"),
  bakerySundayEs: safeText(3, 100, "Horario Bakery Domingo (ES)"),
  bakerySundayEn: safeText(3, 100, "Horario Bakery Domingo (EN)"),
  gourmetHoursEs: safeText(3, 100, "Horario Gourmet L-S (ES)"),
  gourmetHoursEn: safeText(3, 100, "Horario Gourmet L-S (EN)"),
  gourmetClosedNoteEs: safeText(3, 120, "Nota cierre Gourmet (ES)"),
  gourmetClosedNoteEn: safeText(3, 120, "Nota cierre Gourmet (EN)"),
  specialHolidayHoursEs: optionalSafeText(220, "Horario especial festivos/Navidad (ES)"),
  specialHolidayHoursEn: optionalSafeText(220, "Horario especial festivos/Navidad (EN)"),
});

export const siteSectionsSchema = z.object({
  featuredTitleEs: safeText(5, 220, "Título sección Destacados (ES)"),
  featuredTitleEn: safeText(5, 220, "Título sección Destacados (EN)"),
  featuredTextEs: safeText(10, 500, "Texto sección Destacados (ES)"),
  featuredTextEn: safeText(10, 500, "Texto sección Destacados (EN)"),
  packsTitleEs: safeText(5, 220, "Título sección Packs y Eventos (ES)"),
  packsTitleEn: safeText(5, 220, "Título sección Packs y Eventos (EN)"),
  packsTextEs: safeText(10, 500, "Texto sección Packs y Eventos (ES)"),
  packsTextEn: safeText(10, 500, "Texto sección Packs y Eventos (EN)"),
  conceptTitleEs: safeText(5, 220, "Título sección Áreas (ES)"),
  conceptTitleEn: safeText(5, 220, "Título sección Áreas (EN)"),
  bakeryAreaDescEs: safeText(10, 600, "Descripción Área Bakery (ES)"),
  bakeryAreaDescEn: safeText(10, 600, "Descripción Área Bakery (EN)"),
  gourmetAreaDescEs: safeText(10, 600, "Descripción Área Gourmet (ES)"),
  gourmetAreaDescEn: safeText(10, 600, "Descripción Área Gourmet (EN)"),
  allergenNoticeEs: safeText(10, 450, "Nota de alérgenos (ES)"),
  allergenNoticeEn: safeText(10, 450, "Nota de alérgenos (EN)"),
  footerNoteEs: safeText(10, 360, "Nota de pie de página (ES)"),
  footerNoteEn: safeText(10, 360, "Nota de pie de página (EN)"),
});

export const siteLegalSchema = z.object({
  companyName: safeText(2, 160, "Razón social"),
  tradeName: safeText(2, 160, "Nombre comercial"),
  nif: safeText(5, 120, "NIF/CIF"),
  registeredAddress: safeText(5, 240, "Domicilio social"),
  registryInfo: safeText(5, 300, "Datos registrales"),
  privacyEmail: z.string().trim().email("Email de privacidad").max(160),
  orderRetentionDays: z.number().int().min(1).max(3650).default(90),
});

export const starItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: safeText(2, 180, "Nombre en español"),
  nameEn: safeText(2, 180, "Nombre en inglés"),
  desc: safeText(3, 600, "Descripción en español"),
  descEn: safeText(3, 600, "Descripción en inglés"),
  price: z.string().trim().min(1).max(80),
  badge: optionalSafeText(80, "Etiqueta destacada (ES)"),
  badgeEn: optionalSafeText(80, "Etiqueta destacada (EN)"),
  mediaUrl: safeImagePath("Foto o vídeo del producto"),
  mode: z.enum(["bakery", "gourmet"]).default("bakery"),
  category: z.string().default("desayunos"),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
});

export const starsSectionSchema = z.object({
  kickerEs: safeText(3, 140, "Antetítulo estrellas (ES)").default("Selección estrella · Mayor potencial de compra"),
  kickerEn: safeText(3, 140, "Antetítulo estrellas (EN)").default("Top Picks · High-Conversion Favorites"),
  titleEs: safeText(5, 220, "Título sección estrellas (ES)").default("Imprescindibles de Corredera: Desayunos, Croissants, Packs, Tablas, Cheesecake y Vino."),
  titleEn: safeText(5, 220, "Título sección estrellas (EN)").default("Corredera Essentials: Breakfasts, Croissants, Office Packs, Iberian Boards, Cheesecake & Wine."),
  textEs: safeText(10, 500, "Texto sección estrellas (ES)").default("Nuestra selección de mayor demanda con imagen individual por plato. Añade al pedido en 1 clic con cálculo automático o confirma directamente por WhatsApp (+34 640 34 19 32)."),
  textEn: safeText(10, 500, "Texto sección estrellas (EN)").default("Our highest-demand selection with dedicated photography per dish. Add to your order in 1 click with live total calculation or confirm via WhatsApp (+34 640 34 19 32)."),
  items: z.array(starItemSchema).default([]),
});

export const familyCardSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: safeText(2, 140, "Título de familia (ES)"),
  titleEn: safeText(2, 140, "Título de familia (EN)"),
  text: safeText(3, 400, "Descripción de familia (ES)"),
  textEn: safeText(3, 400, "Descripción de familia (EN)"),
  mediaUrl: safeImagePath("Imagen o vídeo de familia"),
  badge: optionalSafeText(80, "Etiqueta (ES)"),
  badgeEn: optionalSafeText(80, "Etiqueta (EN)"),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
});

export const serviceItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: safeText(2, 140, "Título de servicio (ES)"),
  titleEn: safeText(2, 140, "Título de servicio (EN)"),
  sub: safeText(2, 260, "Subtítulo de servicio (ES)"),
  subEn: safeText(2, 260, "Subtítulo de servicio (EN)"),
  actionType: z.enum(["whatsapp", "category", "link"]).default("whatsapp"),
  actionTarget: z.string().trim().default(""),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
});

export const familiesSectionSchema = z.object({
  kickerEs: safeText(3, 140, "Antetítulo familias (ES)").default("Espacio, familias de producto y servicios"),
  kickerEn: safeText(3, 140, "Antetítulo familias (EN)").default("Space, product families & services"),
  titleEs: safeText(5, 220, "Título familias (ES)").default("Del obrador matinal a la barra de degustación."),
  titleEn: safeText(5, 220, "Título familias (EN)").default("From the morning bakery to the tasting bar."),
  textEs: safeText(10, 500, "Texto familias (ES)").default("Recorrido por las familias de producto de Corredera y fotografía real de nuestra vitrina en Calle de la Puebla, 15."),
  textEn: safeText(10, 500, "Texto familias (EN)").default("A tour through Corredera's product families alongside an actual photograph of our counter at Calle de la Puebla, 15."),
  families: z.array(familyCardSchema).default([]),
  services: z.array(serviceItemSchema).default([]),
});

export const marketDepartmentsSchema = z.object({
  kickerEs: safeText(3, 140, "Antetítulo mercado (ES)").default("Mercado Tradicional & Gourmet en el Centro de Madrid"),
  kickerEn: safeText(3, 140, "Antetítulo mercado (EN)").default("Traditional Market & Gourmet Deli in Central Madrid"),
  titleEs: safeText(5, 220, "Título mercado (ES)").default("Frutería de Proximidad, Carnicería de Autor y Bodega de Vinos"),
  titleEn: safeText(5, 220, "Título mercado (EN)").default("Farm-Fresh Produce, Artisan Butchery & Curated Wine Cellar"),
  textEs: safeText(10, 500, "Texto mercado (ES)").default("Bajo un mismo techo en Calle de la Puebla 15, aunamos la frescura de la huerta, cortes cárnicos seleccionados y una cuidada bodega de vinos D.O. para llevar o degustar en barra."),
  textEn: safeText(10, 500, "Texto mercado (EN)").default("Under one roof at Calle de la Puebla 15, we bring together fresh orchard produce, prime artisan meats and a curated cellar of Spanish D.O. wines."),
  fruteriaTitleEs: safeText(2, 140, "Título Frutería (ES)").default("Frutería Selecta"),
  fruteriaTitleEn: safeText(2, 140, "Título Frutería (EN)").default("Select Produce & Fresh Fruit"),
  fruteriaDescEs: safeText(5, 350, "Descripción Frutería (ES)").default("Fruta y hortaliza fresca de temporada, tomate rosa madurado en mata, aguacates del sur y frutos rojos diarios para llevar o consumir al momento."),
  fruteriaDescEn: safeText(5, 350, "Descripción Frutería (EN)").default("Fresh seasonal fruit and vegetables, heirloom vine tomatoes, tropical avocados and daily berries for takeaway or immediate enjoying."),
  fruteriaImageUrl: safeImagePath("Imagen Frutería").default("/assets/products/fr1.jpg"),
  carniceriaTitleEs: safeText(2, 140, "Título Carnicería (ES)").default("Carnicería de Autor"),
  carniceriaTitleEn: safeText(2, 140, "Título Carnicería (EN)").default("Artisan Butchery & Steaks"),
  carniceriaDescEs: safeText(5, 350, "Descripción Carnicería (ES)").default("Cortes de ternera con I.G.P. Sierra de Guadarrama, chuletón madurado dry-aged, presa ibérica fresca de bellota y hamburguesas artesanas de buey."),
  carniceriaDescEn: safeText(5, 350, "Descripción Carnicería (EN)").default("Guadarrama mountain beef, dry-aged ribeye steaks, fresh acorn-fed Iberian cuts and handcrafted ox burgers prepared daily."),
  carniceriaImageUrl: safeImagePath("Imagen Carnicería").default("/assets/products/ca1.jpg"),
  vinosTitleEs: safeText(2, 140, "Título Vinos (ES)").default("Bodega & Vinos Selectos"),
  vinosTitleEn: safeText(2, 140, "Título Vinos (EN)").default("Curated Wine Cellar & Vermouth"),
  vinosDescEs: safeText(5, 350, "Descripción Vinos (ES)").default("Selección de tintos Ribera del Duero y Rioja, blancos Rías Baixas y Rueda, cavas reserva y vermut de grifo para maridar con tus tablas o llevar a casa."),
  vinosDescEn: safeText(5, 350, "Descripción Vinos (EN)").default("Curated Ribera del Duero and Rioja reds, Rías Baixas and Rueda whites, reserve cavas and draft vermouth for tasting bar pairing or home cellars."),
  vinosImageUrl: safeImagePath("Imagen Vinos").default("/assets/products/g8.jpg"),
});

export const sectionVisibilitySchema = z.object({
  hero: z.boolean().default(true),
  seasonalCampaign: z.boolean().default(true),
  proof: z.boolean().default(true),
  stars: z.boolean().default(true),
  marketDepartments: z.boolean().default(true),
  menu: z.boolean().default(true),
  packs: z.boolean().default(true),
  concept: z.boolean().default(true),
  families: z.boolean().default(true),
  services: z.boolean().default(true),
  story: z.boolean().default(true),
  visit: z.boolean().default(true),
});

/** Internal storefront link: "/", "/tienda", "/gourmet/jamones", "/producto/je1", "/#servicio-corte"… */
const safeInternalHref = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(160, `${label} es demasiado largo`)
    .refine((v) => /^\/[a-zA-Z0-9/_#?=&.-]*$/.test(v) && !v.includes(".."), `${label} debe ser una ruta interna (p. ej. /gourmet/jamones)`);

export const announcementSchema = z.object({
  textEs: safeText(3, 140, "Aviso (ES)"),
  textEn: safeText(3, 140, "Aviso (EN)"),
});

export const heroSlideSchema = z.object({
  id: z.string().trim().min(1).max(40),
  imageUrl: safeImagePath("Imagen de la diapositiva"),
  titleEs: safeText(3, 90, "Título de la diapositiva (ES)"),
  titleEn: safeText(3, 90, "Título de la diapositiva (EN)"),
  textEs: safeText(3, 220, "Texto de la diapositiva (ES)"),
  textEn: safeText(3, 220, "Texto de la diapositiva (EN)"),
  ctaEs: safeText(2, 40, "Botón (ES)"),
  ctaEn: safeText(2, 40, "Botón (EN)"),
  href: safeInternalHref("Enlace del botón"),
  /** Optional MP4/WebM uploaded from the panel; plays over the image. */
  videoUrl: z
    .string()
    .trim()
    .max(512)
    .refine((v) => v === "" || (/^\/assets\/[a-zA-Z0-9/_.-]+\.(mp4|webm)$/.test(v) && !v.includes("..")), "El vídeo debe ser un MP4 o WebM subido desde el panel")
    .default(""),
  visible: z.boolean().default(true),
});

const pageTileSchema = z.object({
  titleEs: safeText(2, 60, "Título del bloque (ES)"),
  titleEn: safeText(2, 60, "Título del bloque (EN)"),
  textEs: safeText(2, 120, "Texto del bloque (ES)"),
  textEn: safeText(2, 120, "Texto del bloque (EN)"),
  imageUrl: safeImagePath("Imagen del bloque"),
  href: safeInternalHref("Enlace del bloque"),
});

/** Every photo and editorial text of the storefront that is not a product. */
export const pagesSchema = z.object({
  homeTiles: z.array(pageTileSchema).length(3),
  whyImageUrl: safeImagePath("Imagen de «¿Por qué Corredera?»"),
  carvingImageUrl: safeImagePath("Imagen del servicio de corte"),
  carvingTitleEs: safeText(5, 140, "Título del servicio de corte (ES)"),
  carvingTitleEn: safeText(5, 140, "Título del servicio de corte (EN)"),
  carvingTextEs: safeText(10, 500, "Texto del servicio de corte (ES)"),
  carvingTextEn: safeText(10, 500, "Texto del servicio de corte (EN)"),
  aboutImageUrl: safeImagePath("Imagen de «Somos Corredera»"),
  aboutTitleEs: safeText(3, 80, "Título de «Somos Corredera» (ES)"),
  aboutTitleEn: safeText(3, 80, "Título de «Somos Corredera» (EN)"),
  aboutText1Es: safeText(10, 700, "Primer párrafo (ES)"),
  aboutText1En: safeText(10, 700, "Primer párrafo (EN)"),
  aboutText2Es: optionalSafeText(700, "Segundo párrafo (ES)"),
  aboutText2En: optionalSafeText(700, "Segundo párrafo (EN)"),
  departmentImages: z.array(z.object({ slug: z.string().trim().min(1).max(40), imageUrl: safeImagePath("Imagen de la categoría") })).max(12),
  cartaPosterUrl: safeImagePath("Cartel de la carta"),
  cartaTitleEs: safeText(3, 80, "Título de la carta (ES)"),
  cartaTitleEn: safeText(3, 80, "Título de la carta (EN)"),
  cartaIntroEs: safeText(10, 500, "Introducción de la carta (ES)"),
  cartaIntroEn: safeText(10, 500, "Introducción de la carta (EN)"),
  /** Official logos uploaded by the owner: shown on every product of that brand. */
  brandLogos: z.array(z.object({ brand: z.string().trim().min(1).max(80), logoUrl: safeImagePath("Logo de la marca") })).max(60).default([]),
});

export type PagesContent = z.infer<typeof pagesSchema>;

export const DEFAULT_PAGES: PagesContent = {
  brandLogos: [],
  homeTiles: [
    {
      titleEs: "Tienda gourmet",
      titleEn: "Gourmet shop",
      textEs: "Ibéricos, quesos y aceites seleccionados",
      textEn: "Selected Iberian ham, cheeses and oils",
      imageUrl: "/assets/products/em3.jpg",
      href: "/tienda",
    },
    {
      titleEs: "Servicio de corte",
      titleEn: "Carving service",
      textEs: "Gratis con tu jamón entero",
      textEn: "Free with your whole ham",
      imageUrl: "/assets/products/sj2.jpg",
      href: "/#servicio-corte",
    },
    {
      titleEs: "Carta & Café",
      titleEn: "Menu & Café",
      textEs: "Desayunos, café y obrador en tienda",
      textEn: "Breakfast, coffee and bakery in store",
      imageUrl: "/assets/corredera-bakery-interior.jpg",
      href: "/bakery-cafe",
    },
  ],
  whyImageUrl: "/assets/products/je1.jpg",
  carvingImageUrl: "/assets/home/carving-bg.jpg",
  carvingTitleEs: "Tu jamón, cortado a cuchillo y envasado al vacío. Gratis.",
  carvingTitleEn: "Your ham, hand-carved and vacuum packed. Free.",
  carvingTextEs:
    "Al encargar cualquiera de nuestros jamones enteros te regalamos el corte profesional a cuchillo y el envasado al vacío en sobres. Toda la pieza, lista para servir y sin esfuerzo.",
  carvingTextEn:
    "When you order any of our whole hams we include professional hand-carving and vacuum packing at no cost. The whole piece, ready to serve, effortlessly.",
  aboutImageUrl: "/assets/corredera-bakery-interior.jpg",
  aboutTitleEs: "Somos Corredera",
  aboutTitleEn: "We are Corredera",
  aboutText1Es:
    "En pleno centro de Madrid, en Calle de la Puebla, 15, Corredera Gourmet nace para acercar a cada cliente lo mejor de la despensa española: jamones ibéricos de las casas más reconocidas, embutidos de bellota, quesos de autor y aceites de oliva virgen extra.",
  aboutText1En:
    "In the heart of Madrid, at Calle de la Puebla, 15, Corredera Gourmet was born to bring the best of the Spanish pantry to every customer: Iberian hams from the most renowned houses, acorn-fed charcuterie, artisan cheeses and extra virgin olive oils.",
  aboutText2Es:
    "Cortamos a cuchillo, envasamos al vacío y preparamos cada encargo como si fuera para nuestra propia mesa. Y para empezar el día, nuestro obrador y cafetería te esperan con café recién hecho y bollería artesana.",
  aboutText2En:
    "We hand-carve, vacuum-pack and prepare every order as if it were for our own table. And to start your day, our bakery and café await with fresh coffee and artisan pastries.",
  departmentImages: [
    { slug: "jamones", imageUrl: "/assets/products/je1.jpg" },
    { slug: "jamon-cortado", imageUrl: "/assets/products/sj2.jpg" },
    { slug: "sobres-jamon", imageUrl: "/assets/products/sj3.jpg" },
    { slug: "embutidos", imageUrl: "/assets/products/em3.jpg" },
    { slug: "sobres-embutidos", imageUrl: "/assets/products/se1.jpg" },
    { slug: "quesos", imageUrl: "/assets/products/q5.jpg" },
    { slug: "aceites", imageUrl: "/assets/products/ao2.jpg" },
  ],
  cartaPosterUrl: "/assets/carta-cartel.jpg",
  cartaTitleEs: "Carta Bakery & Café",
  cartaTitleEn: "Bakery & Café menu",
  cartaIntroEs:
    "Empieza el día en Corredera: café recién hecho, bollería de obrador, bocadillos y tartas artesanas. Para tomar en nuestro local de Calle de la Puebla, 15.",
  cartaIntroEn:
    "Start your day at Corredera: fresh coffee, bakery pastries, sandwiches and artisan cakes. To enjoy at our shop on Calle de la Puebla, 15.",
};

export const storefrontSchema = z.object({
  announcements: z.array(announcementSchema).min(1, "Debe haber al menos un aviso").max(5),
  heroSlides: z.array(heroSlideSchema).min(1, "Debe haber al menos una diapositiva").max(6),
});

export type HeroSlide = z.infer<typeof heroSlideSchema>;

export const DEFAULT_STOREFRONT: z.infer<typeof storefrontSchema> = {
  announcements: [
    {
      textEs: "Corte a cuchillo y envasado al vacío gratis en jamones enteros",
      textEn: "Free hand-carving & vacuum packing on whole hams",
    },
    {
      textEs: "Recogida en Calle de la Puebla, 15 · Madrid o envío a domicilio",
      textEn: "Pickup at Calle de la Puebla, 15 · Madrid or home delivery",
    },
    {
      textEs: "Encargos y consultas por WhatsApp +34 640 34 19 32",
      textEn: "Orders & enquiries on WhatsApp +34 640 34 19 32",
    },
  ],
  heroSlides: [
    {
      id: "jamones",
      imageUrl: "/assets/home/hero-jamon.jpg",
      titleEs: "Jamones 5 Jotas y Joselito",
      titleEn: "5 Jotas & Joselito hams",
      textEs: "Corte a cuchillo y envasado al vacío gratis al encargar tu pieza entera",
      textEn: "Free hand-carving and vacuum packing when you order a whole ham",
      ctaEs: "Elegir jamón",
      ctaEn: "Choose a ham",
      href: "/gourmet/jamones",
      videoUrl: "",
      visible: true,
    },
    {
      id: "loncheados",
      imageUrl: "/assets/home/hero-loncheado.jpg",
      titleEs: "Loncheados de 100 g",
      titleEn: "100 g sliced packs",
      textEs: "Ibéricos cortados a mano y envasados al vacío, listos para servir",
      textEn: "Hand-sliced Iberian ham, vacuum packed and ready to serve",
      ctaEs: "Comprar loncheados",
      ctaEn: "Shop sliced packs",
      href: "/gourmet/sobres-jamon",
      videoUrl: "",
      visible: true,
    },
    {
      id: "quesos",
      imageUrl: "/assets/home/hero-quesos.jpg",
      titleEs: "Nuestra cava de quesos",
      titleEn: "Our cheese cellar",
      textEs: "Payoyo, Pecorino trufado, Comté y curados de autor al corte",
      textEn: "Payoyo, truffled Pecorino, Comté and artisan cheeses cut to order",
      ctaEs: "Descubrir quesos",
      ctaEn: "Discover cheeses",
      href: "/gourmet/quesos",
      videoUrl: "",
      visible: true,
    },
  ],
};

export const siteSettingsSchema = z.object({
  seasonalCampaign: seasonalCampaignSchema,
  hero: siteHeroSchema,
  contact: siteContactSchema,
  schedule: siteScheduleSchema,
  sections: siteSectionsSchema,
  legal: siteLegalSchema,
  starsSection: starsSectionSchema.default({
    kickerEs: "Selección estrella · Mayor potencial de compra",
    kickerEn: "Top Picks · High-Conversion Favorites",
    titleEs: "Imprescindibles de Corredera: Desayunos, Croissants, Packs, Tablas, Cheesecake y Vino.",
    titleEn: "Corredera Essentials: Breakfasts, Croissants, Office Packs, Iberian Boards, Cheesecake & Wine.",
    textEs: "Nuestra selección de mayor demanda con imagen individual por plato. Añade al pedido en 1 clic con cálculo automático o confirma directamente por WhatsApp (+34 640 34 19 32).",
    textEn: "Our highest-demand selection with dedicated photography per dish. Add to your order in 1 click with live total calculation or confirm via WhatsApp (+34 640 34 19 32).",
    items: [],
  }),
  familiesSection: familiesSectionSchema.default({
    kickerEs: "Espacio, familias de producto y servicios",
    kickerEn: "Space, product families & services",
    titleEs: "Del obrador matinal a la barra de degustación.",
    titleEn: "From the morning bakery to the tasting bar.",
    textEs: "Recorrido por las familias de producto de Corredera y fotografía real de nuestra vitrina en Calle de la Puebla, 15.",
    textEn: "A tour through Corredera's product families alongside an actual photograph of our counter at Calle de la Puebla, 15.",
    families: [],
    services: [],
  }),
  marketDepartments: marketDepartmentsSchema.default({
    kickerEs: "Mercado Tradicional & Gourmet en el Centro de Madrid",
    kickerEn: "Traditional Market & Gourmet Deli in Central Madrid",
    titleEs: "Frutería de Proximidad, Carnicería de Autor y Bodega de Vinos",
    titleEn: "Farm-Fresh Produce, Artisan Butchery & Curated Wine Cellar",
    textEs: "Bajo un mismo techo en Calle de la Puebla 15, aunamos la frescura de la huerta, cortes cárnicos seleccionados y una cuidada bodega de vinos D.O. para llevar o degustar en barra.",
    textEn: "Under one roof at Calle de la Puebla 15, we bring together fresh orchard produce, prime artisan meats and a curated cellar of Spanish D.O. wines.",
    fruteriaTitleEs: "Frutería Selecta",
    fruteriaTitleEn: "Select Produce & Fresh Fruit",
    fruteriaDescEs: "Fruta y hortaliza fresca de temporada, tomate rosa madurado en mata, aguacates del sur y frutos rojos diarios para llevar o consumir al momento.",
    fruteriaDescEn: "Fresh seasonal fruit and vegetables, heirloom vine tomatoes, tropical avocados and daily berries for takeaway or immediate enjoying.",
    fruteriaImageUrl: "/assets/products/fr1.jpg",
    carniceriaTitleEs: "Carnicería de Autor",
    carniceriaTitleEn: "Artisan Butchery & Steaks",
    carniceriaDescEs: "Cortes de ternera con I.G.P. Sierra de Guadarrama, chuletón madurado dry-aged, presa ibérica fresca de bellota y hamburguesas artesanas de buey.",
    carniceriaDescEn: "Guadarrama mountain beef, dry-aged ribeye steaks, fresh acorn-fed Iberian cuts and handcrafted ox burgers prepared daily.",
    carniceriaImageUrl: "/assets/products/ca1.jpg",
    vinosTitleEs: "Bodega & Vinos Selectos",
    vinosTitleEn: "Curated Wine Cellar & Vermouth",
    vinosDescEs: "Selección de tintos Ribera del Duero y Rioja, blancos Rías Baixas y Rueda, cavas reserva y vermut de grifo para maridar con tus tablas o llevar a casa.",
    vinosDescEn: "Curated Ribera del Duero and Rioja reds, Rías Baixas and Rueda whites, reserve cavas and draft vermouth for tasting bar pairing or home cellars.",
    vinosImageUrl: "/assets/products/g8.jpg",
  }),
  sectionVisibility: sectionVisibilitySchema.default({
    hero: true,
    seasonalCampaign: true,
    proof: true,
    stars: true,
    marketDepartments: true,
    menu: true,
    packs: true,
    concept: true,
    families: true,
    services: true,
    story: true,
    visit: true,
  }),
  storefront: storefrontSchema.default(DEFAULT_STOREFRONT),
  pages: pagesSchema.default(DEFAULT_PAGES),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type StarItem = z.infer<typeof starItemSchema>;
export type FamilyCard = z.infer<typeof familyCardSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type SectionVisibility = z.infer<typeof sectionVisibilitySchema>;

export type ManagedSiteSettings = SiteSettings & {
  version: number;
  updatedAt: string;
  updatedBy: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  seasonalCampaign: {
    enabled: false,
    theme: "festive_gold",
    badgeEs: "CAMPAÑA ESPECIAL · ENCARGOS ABIERTOS",
    badgeEn: "SEASONAL SPECIAL · PRE-ORDERS OPEN",
    titleEs: "Cestas Gourmet, Tablas Ibéricas y Packs de Obrador por Encargo",
    titleEn: "Bespoke Gourmet Baskets, Iberian Sharing Boards & Artisan Pastry Packs",
    descriptionEs:
      "Reserva con antelación nuestras cestas gourmet personalizadas, tablas de jamón 100% ibérico cortado a cuchillo, tartas enteras y bandejas dulces o saladas para celebraciones, Navidad o reuniones de empresa.",
    descriptionEn:
      "Pre-order our bespoke gourmet gift baskets, hand-carved 100% Iberian ham boards, whole artisan cakes and sweet or savory trays for celebrations, Christmas or corporate events.",
    ctaTextEs: "Reservar Encargo Especial por WhatsApp",
    ctaTextEn: "Pre-order via WhatsApp",
    whatsappPrefillEs:
      "Hola Corredera Bakery & Gourmet, quisiera información y reservar un encargo de vuestra campaña especial.",
    whatsappPrefillEn:
      "Hello Corredera Bakery & Gourmet, I would like information to pre-order from your seasonal special campaign.",
    imageUrl: "/assets/home/hero-loncheado.jpg",
  },
  hero: {
    toplineEs: "Encargos Gourmet por WhatsApp: +34 640 34 19 32 · Calle de la Puebla, 15 (Madrid)",
    toplineEn: "Gourmet Pre-orders via WhatsApp: +34 640 34 19 32 · Calle de la Puebla, 15 (Madrid)",
    heroKickerEs: "EL ARTE DEL BUEN GOURMET",
    heroKickerEn: "THE ART OF FINE GOURMET",
    heroTitleEs:
      "Una selección de jamones ibéricos y productos gourmet elegidos para quienes valoran la calidad y el sabor.",
    heroTitleEn:
      "A curated selection of Iberian hams and gourmet products chosen for those who value quality and flavor.",
    heroTextEs:
      "Especialistas en jamones ibéricos enteros con servicio gratuito de corte a cuchillo y envasado al vacío, sobres de 100 g, embutidos de bellota, quesos seleccionados y aceites de oliva virgen extra en el corazón de Madrid.",
    heroTextEn:
      "Specialists in whole Iberian hams with complimentary hand-carving and vacuum-packing service, 100g pouches, acorn-fed charcuterie, selected cheeses and extra virgin olive oils in central Madrid.",
    heroBakeryImageUrl: "/assets/corredera-bakery-interior.jpg",
    heroGourmetImageUrl: "/assets/home/hero-jamon.jpg",
    interiorImageUrl: "/assets/corredera-bakery-interior.jpg",
    bakeryCardDescEs:
      "Carta de cafetería, desayunos del día y bollería artesana para disfrutar en nuestro local de Calle de la Puebla, 15.",
    bakeryCardDescEn:
      "In-store cafe menu, daily breakfast combos and artisan pastries at Calle de la Puebla, 15.",
    gourmetCardDescEs:
      "Jamones 5 Jotas, Joselito, Extremadura y Cebo Campo con corte gratis, sobres de 100 g al vacío, embutidos, quesos y AOVE.",
    gourmetCardDescEn:
      "5 Jotas, Joselito, Extremadura & Cebo Campo hams with free slicing, 100g vacuum packs, charcuterie, cheeses and EVOO.",
  },
  contact: {
    whatsappNumber: "34640341932",
    whatsappDisplay: "+34 640 34 19 32",
    landlineNumber: "+34919471449",
    landlineDisplay: "919 47 14 49",
    contactEmail: "info@correderagourmet.com",
    addressLine: "Calle de la Puebla, 15 · 28004 Madrid",
    neighborhoodNoteEs:
      "Entre Gran Vía y Corredera Baja de San Pablo. Acceso a pie desde Metro Callao (L3, L5), Gran Vía (L1, L5) y Tribunal (L1, L10).",
    neighborhoodNoteEn:
      "Between Gran Vía and Corredera Baja de San Pablo. Walking access from Callao (L3, L5), Gran Vía (L1, L5) and Tribunal (L1, L10) metro stations.",
    instagramUrl: "https://www.instagram.com/correderagourmet",
    instagramHandle: "@correderagourmet",
    tiktokUrl: "https://www.tiktok.com/@correderagourmet",
    googleMapsUrl: "https://maps.app.goo.gl/CLJfpGTwYuojACUz6",
    whatsappOrdersEnabled: true,
    homeDeliveryEnabled: true,
    shippingNoticeEs:
      "También puedes solicitar entrega a domicilio. Los gastos de envío se cobran aparte y se confirman antes de gestionar el pedido.",
    shippingNoticeEn:
      "You can also request home delivery. Shipping costs are charged separately and confirmed before processing the order.",
    pauseOrdersNoticeEs: "",
    pauseOrdersNoticeEn: "",
  },
  schedule: {
    bakeryWeekdaysEs: "L–J: 08:00 – 21:00",
    bakeryWeekdaysEn: "Mon–Thu: 08:00 – 21:00",
    bakeryWeekendEs: "V–S: 08:00 – 23:00",
    bakeryWeekendEn: "Fri–Sat: 08:00 – 23:00",
    bakerySundayEs: "D: 09:00 – 21:00",
    bakerySundayEn: "Sun: 09:00 – 21:00",
    gourmetHoursEs: "L–S: 09:00 – 21:00",
    gourmetHoursEn: "Mon–Sat: 09:00 – 21:00",
    gourmetClosedNoteEs: "Domingos y festivos cerrado",
    gourmetClosedNoteEn: "Closed Sundays & public holidays",
    specialHolidayHoursEs: "",
    specialHolidayHoursEn: "",
  },
  sections: {
    featuredTitleEs: "NUESTRA SELECCIÓN GOURMET",
    featuredTitleEn: "OUR GOURMET SELECTION",
    featuredTextEs:
      "Productos seleccionados para disfrutar de la calidad y el sabor de las mejores especialidades.",
    featuredTextEn:
      "Selected products to enjoy the quality and flavor of the finest specialties.",
    packsTitleEs: "Packs para reuniones, encargos gourmet y reservas en barra.",
    packsTitleEn: "Packs for meetings, bespoke gourmet pre-orders and tasting bar bookings.",
    packsTextEs:
      "Bandejas dulces y saladas listas para servir, piezas enteras de jamón con servicio gratuito de corte y envasado al vacío, tablas con 2 copas de vino y cestas gourmet.",
    packsTextEn:
      "Ready-to-serve sweet and savory boxes, whole hams with complimentary slicing and vacuum packing, wine-paired boards and bespoke gourmet baskets.",
    conceptTitleEs: "Especialistas en alta charcutería ibérica, quesos seleccionados y productos gourmet.",
    conceptTitleEn: "Specialists in fine Iberian charcuterie, selected cheeses and gourmet products.",
    bakeryAreaDescEs:
      "Desayunos y promociones diarias (Croissant + Café 3,75 €, Brunch completo 11,99 €, Bocadillo especial + refresco 8,99 €), panadería y bollería artesana, tartas al peso o enteras por encargo y Sweet & Salty Packs.",
    bakeryAreaDescEn:
      "Daily breakfast combos (Croissant + Coffee €3.75, Complete Brunch €11.99, Special sandwich + drink €8.99), artisan pastries, cakes by weight or whole to order, and Sweet & Salty office packs.",
    gourmetAreaDescEs:
      "Jamones enteros (5 Jotas, Joselito, Extremadura y Cebo Campo) con corte y envasado al vacío gratuito al encargar la pieza, sobres de 100 g de jamón y embutidos ibéricos, selección de quesos por kilo y por cuña, aceites AOVE, conservas, raciones frías y vinos.",
    gourmetAreaDescEn:
      "Whole Iberian hams (5 Jotas, Joselito, Extremadura & Cebo Campo) with complimentary slicing and vacuum packing, 100g packs of ham and charcuterie, cheeses by kilo or wedge, EVOO oils, preserves, cold portions and wines.",
    allergenNoticeEs:
      "Precios en euros con IVA incluido. También puedes solicitar entrega a domicilio; los gastos de envío se cobran aparte y se confirman antes de gestionar el pedido.",
    allergenNoticeEn:
      "Prices in euros including VAT. You can also request home delivery; shipping costs are charged separately and confirmed before processing the order.",
    footerNoteEs:
      "Selección de jamones ibéricos, embutidos, quesos seleccionados, aceites de oliva virgen extra y cafetería artesanal en Calle de la Puebla, 15 (Madrid).",
    footerNoteEn:
      "Curated Iberian hams, charcuterie, selected cheeses, extra virgin olive oils and artisan cafe at Calle de la Puebla, 15 (Madrid).",
  },
  legal: {
    companyName: "Vallejo Lorenzo S.L.",
    tradeName: "Corredera Bakery & Gourmet",
    nif: "[PENDIENTE DE COMPLETAR POR EL PROPIETARIO: NIF/CIF]",
    registeredAddress: "Calle de la Puebla, 15, 28004 Madrid, España",
    registryInfo:
      "[PENDIENTE DE COMPLETAR POR EL PROPIETARIO: Datos de inscripción en el Registro Mercantil de Madrid]",
    privacyEmail: "info@correderagourmet.com",
    orderRetentionDays: 90,
  },
  starsSection: {
    kickerEs: "Selección Destacada · Corredera Gourmet",
    kickerEn: "Featured Selection · Corredera Gourmet",
    titleEs: "NUESTRA SELECCIÓN GOURMET",
    titleEn: "OUR GOURMET SELECTION",
    textEs: "Productos seleccionados para disfrutar de la calidad y el sabor de las mejores especialidades.",
    textEn: "Selected products to enjoy the quality and flavor of the finest specialties.",
    items: [
      {
        id: "je1",
        name: "Jamón 5 Jotas · Pieza Entera",
        nameEn: "5 Jotas Acorn-Fed Iberian Ham · Whole Piece",
        desc: "Pieza de 7 a 8 kg aprox. (Ref: 89,90 €/kg). Incluye gratis el servicio de corte y envasado al vacío al encargar tu pieza.",
        descEn: "Approx. 7–8 kg whole ham (Ref: €89.90/kg). Includes complimentary hand-slicing & vacuum packing.",
        price: "625,00 €",
        badge: "Corte y envasado gratis",
        badgeEn: "Free slicing & vacuum pack",
        mediaUrl: "/assets/products/je1.jpg",
        mode: "gourmet",
        category: "jamones_enteros",
        visible: true,
        sortOrder: 1,
      },
      {
        id: "je2",
        name: "Jamón Joselito · Pieza Entera",
        nameEn: "Joselito Gran Reserva Ham · Whole Piece",
        desc: "Pieza de 7,5 a 8 kg aprox. (Ref: 80,99 €/kg). Incluye gratis el servicio de corte y envasado al vacío al encargar tu pieza.",
        descEn: "Approx. 7.5–8 kg whole ham (Ref: €80.99/kg). Includes complimentary hand-slicing & vacuum packing.",
        price: "670,00 €",
        badge: "Gran Reserva · Corte gratis",
        badgeEn: "Gran Reserva · Free slicing",
        mediaUrl: "/assets/products/je2.jpg",
        mode: "gourmet",
        category: "jamones_enteros",
        visible: true,
        sortOrder: 2,
      },
      {
        id: "sj2",
        name: "Sobre Joselito Cortado a Mano (100 g)",
        nameEn: "Hand-Carved Joselito Ham Pack (100 g)",
        desc: "Sobre de 100 gramos cortado a mano a cuchillo por maestro jamonero y envasado al vacío.",
        descEn: "100g vacuum-sealed pack of artisanal hand-carved Joselito Iberian ham.",
        price: "22,99 €",
        badge: "Corte a Cuchillo",
        badgeEn: "Hand-Carved",
        mediaUrl: "/assets/products/sj2.jpg",
        mode: "gourmet",
        category: "sobres_jamon",
        visible: true,
        sortOrder: 3,
      },
      {
        id: "sj3",
        name: "Sobre Jamón 5 Jotas (100 g)",
        nameEn: "5 Jotas Iberian Ham Pack (100 g)",
        desc: "100% ibérico de bellota cortado y envasado al vacío listo para abrir y atemperar.",
        descEn: "100% acorn-fed Iberian ham pack ready to temper and serve.",
        price: "22,99 €",
        badge: "100% Bellota",
        badgeEn: "100% Acorn-Fed",
        mediaUrl: "/assets/products/sj3.jpg",
        mode: "gourmet",
        category: "sobres_jamon",
        visible: true,
        sortOrder: 4,
      },
      {
        id: "je3",
        name: "Jamón de Extremadura · Pieza Entera",
        nameEn: "D.O. Dehesa de Extremadura Ham · Whole Piece",
        desc: "Pieza de 7 a 7,5 kg aprox. (Ref: 58,00 €/kg). Corte y envasado al vacío GRATIS incluido.",
        descEn: "Approx. 7–7.5 kg whole ham. Free slicing & vacuum-packing service included.",
        price: "440,00 €",
        badge: "D.O. Extremadura · Corte gratis",
        badgeEn: "D.O. Extremadura · Free slicing",
        mediaUrl: "/assets/products/je3.jpg",
        mode: "gourmet",
        category: "jamones_enteros",
        visible: true,
        sortOrder: 5,
      },
      {
        id: "em1",
        name: "Presa Ibérica Curada",
        nameEn: "Cured Iberian Presa",
        desc: "Corte noble de cerdo ibérico curado lentamente, infiltración de grasa insuperable.",
        descEn: "Noble cut of cured Iberian pork with supreme marbled fat and depth of flavor.",
        price: "98,00 € / kg",
        badge: "Alta Charcutería",
        badgeEn: "Artisan Charcuterie",
        mediaUrl: "/assets/products/em1.jpg",
        mode: "gourmet",
        category: "embutidos",
        visible: true,
        sortOrder: 6,
      },
      {
        id: "em3",
        name: "Lomo Ibérico 100 % Bellota",
        nameEn: "100% Acorn-Fed Iberian Loin",
        desc: "Lomo embuchado artesanal de cerdo ibérico alimentado con bellota en dehesa.",
        descEn: "Pure acorn-fed Iberian cured pork loin seasoned and cured in natural dehesa.",
        price: "89,90 € / kg",
        badge: "100% Bellota",
        badgeEn: "Pure Bellota",
        mediaUrl: "/assets/products/em3.jpg",
        mode: "gourmet",
        category: "embutidos",
        visible: true,
        sortOrder: 7,
      },
      {
        id: "q3",
        name: "Pecorino Trufado",
        nameEn: "Truffled Pecorino Sheep Cheese",
        desc: "Queso italiano de oveja con trufa negra dentro de nuestra selección de quesos al corte.",
        descEn: "Italian sheep's milk cheese veined with black truffle, sold by weight.",
        price: "49,99 € / kg",
        badge: "Selección Quesos",
        badgeEn: "Cheese Selection",
        mediaUrl: "/assets/products/q3.jpg",
        mode: "gourmet",
        category: "quesos",
        visible: true,
        sortOrder: 8,
      },
      {
        id: "q2",
        name: "Queso Bóer con Miel y Trufa",
        nameEn: "Boer Cheese with Honey & Truffle",
        desc: "Queso holandés artesano madurado con notas sutiles de miel silvestre y trufa.",
        descEn: "Dutch artisan matured cheese infused with raw blossom honey and truffle notes.",
        price: "49,99 € / kg",
        badge: "Exclusivo Corredera",
        badgeEn: "Corredera Exclusive",
        mediaUrl: "/assets/products/q2.jpg",
        mode: "gourmet",
        category: "quesos",
        visible: true,
        sortOrder: 9,
      },
      {
        id: "ao1",
        name: "Aceite de Oliva Ecológico en Lata",
        nameEn: "Organic Extra Virgin Olive Oil in Tin",
        desc: "Aceite de oliva virgen extra ecológico en lata protectora de nuestra colección de AOVE.",
        descEn: "Organic extra virgin olive oil in a protective tin from our EVOO collection.",
        price: "14,99 €",
        badge: "AOVE Ecológico",
        badgeEn: "Organic EVOO",
        mediaUrl: "/assets/products/ao1.jpg",
        mode: "gourmet",
        category: "aceites",
        visible: true,
        sortOrder: 10,
      },
      {
        id: "t15",
        name: "Tabla Mixta de Jamón Ibérico y Quesos + 2 Copas",
        nameEn: "Mixed Iberian Ham & Cheese Board + 2 Wine Glasses",
        desc: "Jamón ibérico recién cortado, quesos curados de autor, picos artesanos y dos copas de vino.",
        descEn: "Freshly sliced Iberian ham, curated cheeses, artisan breadsticks and two glasses of wine.",
        price: "32,90 €",
        badge: "Barra & Terraza",
        badgeEn: "Tasting Bar",
        mediaUrl: "/assets/products/t15.jpg",
        mode: "gourmet",
        category: "tablas",
        visible: true,
        sortOrder: 11,
      },
    ],
  },
  familiesSection: {
    kickerEs: "Espacio, familias de producto y servicios",
    kickerEn: "Space, product families & services",
    titleEs: "Del obrador matinal a la barra de degustación.",
    titleEn: "From the morning bakery to the tasting bar.",
    textEs: "Recorrido por las familias de producto de Corredera y fotografía real de nuestra vitrina en Calle de la Puebla, 15.",
    textEn: "A tour through Corredera's product families alongside an actual photograph of our counter at Calle de la Puebla, 15.",
    families: [
      {
        id: "fam1",
        title: "Obrador artesanal",
        titleEn: "Artisan bakery",
        text: "Bollería recién horneada a diario, pan de masa madre y dulces tradicionales listos para compartir.",
        textEn: "Daily fresh-baked butter pastries, artisan sourdough breads and sweets made to share.",
        mediaUrl: "/assets/products/bo1.jpg",
        badge: "01 · Obrador",
        badgeEn: "01 · Bakery",
        visible: true,
        sortOrder: 1,
      },
      {
        id: "fam2",
        title: "Corte a cuchillo de ibéricos",
        titleEn: "Hand-sliced Iberian delicacies",
        text: "Jamón ibérico 100% bellota cortado al momento por maestros jamoneros, lomo, chorizo y cecina de León.",
        textEn: "100% acorn-fed Iberian ham hand-sliced to order, cured loin, chorizo and León cured beef.",
        mediaUrl: "/assets/products/g1.jpg",
        badge: "02 · Ibéricos",
        badgeEn: "02 · Charcuterie",
        visible: true,
        sortOrder: 2,
      },
      {
        id: "fam3",
        title: "Café de especialidad y desayunos",
        titleEn: "Specialty coffee & breakfasts",
        text: "Una pausa con café arábica seleccionado, infusiones naturales, zumos recién exprimidos y tostas.",
        textEn: "A relaxed pause with select Arabica coffees, herbal teas, freshly squeezed juices and toasts.",
        mediaUrl: "/assets/products/c5.jpg",
        badge: "03 · Cafetería",
        badgeEn: "03 · Specialty Coffee",
        visible: true,
        sortOrder: 3,
      },
      {
        id: "fam4",
        title: "Bodega selecta & Vinos D.O.",
        titleEn: "Curated wine cellar & vermouth",
        text: "Vinos escogidos de Ribera del Duero, Rioja, Rueda, Rías Baixas, cavas reserva y vermut de grifo madrileño.",
        textEn: "Selected Ribera del Duero, Rioja, Rueda and Albariño wines, reserve sparkling cavas and draft vermouth.",
        mediaUrl: "/assets/products/g8.jpg",
        badge: "04 · Bodega",
        badgeEn: "04 · Wine Cellar",
        visible: true,
        sortOrder: 4,
      },
      {
        id: "fam5",
        title: "Frutería selecta y huerta fresca",
        titleEn: "Select produce & orchard fruit",
        text: "Fruta fresca de temporada, tomate rosa de mata, aguacate hass y frutos rojos para llevar o consumo diario.",
        textEn: "Seasonal farm produce, vine-ripened pink tomatoes, hass avocados and daily fresh berries.",
        mediaUrl: "/assets/products/fr1.jpg",
        badge: "05 · Frutería",
        badgeEn: "05 · Produce",
        visible: true,
        sortOrder: 5,
      },
      {
        id: "fam6",
        title: "Carnicería de autor & Madurados",
        titleEn: "Artisan butchery & aged steaks",
        text: "Ternera con certificación I.G.P. Sierra de Guadarrama, chuletón dry aged, presa ibérica y hamburguesas de buey.",
        textEn: "Certified Guadarrama beef, dry-aged ribeye steaks, fresh Iberian cuts and handmade ox burgers.",
        mediaUrl: "/assets/products/ca1.jpg",
        badge: "06 · Carnicería",
        badgeEn: "06 · Butchery",
        visible: true,
        sortOrder: 6,
      },
      {
        id: "fam7",
        title: "Cestas gourmet y regalos a medida",
        titleEn: "Bespoke gift baskets",
        text: "Cestas personalizadas con conservas del mar, vinos de autor, ibéricos y pastelería fina para particulares y empresas.",
        textEn: "Tailored gift baskets with seafood preserves, boutique wines, Iberian ham and fine bakery goods.",
        mediaUrl: "/assets/products/fr6.jpg",
        badge: "07 · Regalos",
        badgeEn: "07 · Gifts",
        visible: true,
        sortOrder: 7,
      },
      {
        id: "fam8",
        title: "Quesería artesana y tablas de autor",
        titleEn: "Artisan cheese pantry & boards",
        text: "Manchego curado, oveja trufado, Gouda añejo y azul de Valdeón servidos con nueces y regañás crujientes.",
        textEn: "Aged Manchego, truffled sheep cheese, vintage Gouda and Valdeón blue served with crackers and nuts.",
        mediaUrl: "/assets/products/t13.jpg",
        badge: "08 · Quesos",
        badgeEn: "08 · Cheeses",
        visible: true,
        sortOrder: 8,
      },
      {
        id: "fam9",
        title: "Conservas del mar y encurtidos",
        titleEn: "Seafood preserves & pickles",
        text: "Gildas madrileñas, boquerones en vinagre, sardinillas de las rías gallegas y salmón ahumado.",
        textEn: "Traditional Madrid gildas, pickled white anchovies, Galician sardines and premium smoked salmon.",
        mediaUrl: "/assets/products/c15.jpg",
        badge: "09 · Aperitivo",
        badgeEn: "09 · Preserves",
        visible: true,
        sortOrder: 9,
      },
      {
        id: "fam10",
        title: "El espacio físico Corredera",
        titleEn: "The physical Corredera space",
        text: "Un mercado de barrio tradicional con espíritu gourmet en Calle de la Puebla, 15 (Centro - Malasaña).",
        textEn: "A traditional neighbourhood market with a gourmet spirit at Calle de la Puebla 15 (Central Madrid).",
        mediaUrl: "/assets/corredera-bakery-interior.jpg",
        badge: "10 · Espacio Real",
        badgeEn: "10 · Storefront",
        visible: true,
        sortOrder: 10,
      },
    ],
    services: [
      {
        id: "srv1",
        title: "Sweet & Salty Packs para oficinas y reuniones",
        titleEn: "Sweet & Salty Packs for offices and meetings",
        sub: "Packs listos para servir en 8, 12 o 24 unidades con recogida inmediata o encargo por WhatsApp.",
        subEn: "Ready-to-serve boxes of 8, 12 or 24 pieces for instant pickup or WhatsApp order.",
        actionType: "category",
        actionTarget: "packs",
        visible: true,
        sortOrder: 1,
      },
      {
        id: "srv2",
        title: "Tablas maridadas con 2 vinos y reserva de barra",
        titleEn: "Wine-paired sharing boards & tasting bar bookings",
        sub: "Degustación de ibéricos 100% bellota o quesos artesanos maridados con dos copas de Ribera o Rioja.",
        subEn: "Tasting of 100% acorn-fed Iberian ham or artisan cheeses paired with two glasses of wine.",
        actionType: "category",
        actionTarget: "tablas",
        visible: true,
        sortOrder: 2,
      },
      {
        id: "srv3",
        title: "Cortador de jamón ibérico profesional para eventos",
        titleEn: "Master ham carver service for private & corporate events",
        sub: "Servicio exclusivo para bodas, celebraciones y eventos de empresa en la Comunidad de Madrid.",
        subEn: "Exclusive master slicing service for weddings and corporate gatherings in Madrid.",
        actionType: "whatsapp",
        actionTarget: "Hola Corredera Bakery & Gourmet, quisiera presupuesto para servicio de cortador de jamón ibérico en evento.",
        visible: true,
        sortOrder: 3,
      },
      {
        id: "srv4",
        title: "Encargos de Frutería, Carnicería y Cestas Gourmet",
        titleEn: "Special orders for Fruit, Butchery and Gourmet Baskets",
        sub: "Chuletones madurados al peso, cestas de fruta fresca y lotes de bodega personalizados por WhatsApp.",
        subEn: "Dry-aged steaks cut to weight, fresh fruit baskets and bespoke cellar lots via WhatsApp.",
        actionType: "whatsapp",
        actionTarget: "Hola Corredera Bakery & Gourmet, quisiera información sobre encargos de carnicería / frutería / cestas gourmet.",
        visible: true,
        sortOrder: 4,
      },
    ],
  },
  marketDepartments: {
    kickerEs: "Mercado Tradicional & Gourmet en el Centro de Madrid",
    kickerEn: "Traditional Market & Gourmet Deli in Central Madrid",
    titleEs: "Frutería de Proximidad, Carnicería de Autor y Bodega de Vinos",
    titleEn: "Farm-Fresh Produce, Artisan Butchery & Curated Wine Cellar",
    textEs: "Bajo un mismo techo en Calle de la Puebla 15, aunamos la frescura de la huerta, cortes cárnicos seleccionados y una cuidada bodega de vinos D.O. para llevar o degustar en barra.",
    textEn: "Under one roof at Calle de la Puebla 15, we bring together fresh orchard produce, prime artisan meats and a curated cellar of Spanish D.O. wines.",
    fruteriaTitleEs: "Frutería Selecta",
    fruteriaTitleEn: "Select Produce & Fresh Fruit",
    fruteriaDescEs: "Fruta y hortaliza fresca de temporada, tomate rosa madurado en mata, aguacates del sur y frutos rojos diarios para llevar o consumir al momento.",
    fruteriaDescEn: "Fresh seasonal fruit and vegetables, heirloom vine tomatoes, tropical avocados and daily berries for takeaway or immediate enjoying.",
    fruteriaImageUrl: "/assets/products/fr1.jpg",
    carniceriaTitleEs: "Carnicería de Autor",
    carniceriaTitleEn: "Artisan Butchery & Steaks",
    carniceriaDescEs: "Cortes de ternera con I.G.P. Sierra de Guadarrama, chuletón madurado dry-aged, presa ibérica fresca de bellota y hamburguesas artesanas de buey.",
    carniceriaDescEn: "Guadarrama mountain beef, dry-aged ribeye steaks, fresh acorn-fed Iberian cuts and handcrafted ox burgers prepared daily.",
    carniceriaImageUrl: "/assets/products/ca1.jpg",
    vinosTitleEs: "Bodega & Vinos Selectos",
    vinosTitleEn: "Curated Wine Cellar & Vermouth",
    vinosDescEs: "Selección de tintos Ribera del Duero y Rioja, blancos Rías Baixas y Rueda, cavas reserva y vermut de grifo para maridar con tus tablas o llevar a casa.",
    vinosDescEn: "Curated Ribera del Duero and Rioja reds, Rías Baixas and Rueda whites, reserve cavas and draft vermouth for tasting bar pairing or home cellars.",
    vinosImageUrl: "/assets/products/g8.jpg",
  },
  sectionVisibility: {
    hero: true,
    seasonalCampaign: true,
    proof: true,
    stars: true,
    marketDepartments: true,
    menu: true,
    packs: true,
    concept: true,
    families: true,
    services: true,
    story: true,
    visit: true,
  },
  storefront: DEFAULT_STOREFRONT,
  pages: DEFAULT_PAGES,
};

export const SEASONAL_CAMPAIGN_PRESETS: Record<
  string,
  { label: string; config: SiteSettings["seasonalCampaign"] }
> = {
  navidad: {
    label: "Campaña de Navidad y Cestas Gourmet",
    config: {
      enabled: true,
      theme: "christmas_burgundy",
      badgeEs: "ESPECIAL NAVIDAD · ENCARGOS ABIERTOS",
      badgeEn: "CHRISTMAS SPECIAL · PRE-ORDERS OPEN",
      titleEs: "Cestas Gourmet de Navidad, Jamón Ibérico a Cuchillo y Bandejas para tus Fiestas",
      titleEn: "Christmas Gourmet Gift Baskets, Hand-Carved Iberian Ham & Festive Pastry Trays",
      descriptionEs:
        "Adelanta tus encargos de Navidad en Corredera: cestas de regalo personalizadas para empresas y particulares, bandejas de jamón ibérico 100% bellota recién cortado, quesos D.O., tartas enteras y Sweet & Salty Packs para Nochebuena y Nochevieja.",
      descriptionEn:
        "Place your Christmas pre-orders at Corredera: bespoke gift baskets for companies and families, freshly hand-sliced 100% acorn-fed Iberian ham trays, aged cheeses, whole cakes and Sweet & Salty Packs for Christmas Eve and New Year's Eve.",
      ctaTextEs: "Reservar Encargo de Navidad por WhatsApp",
      ctaTextEn: "Pre-Order Christmas Special via WhatsApp",
      whatsappPrefillEs:
        "Hola Corredera, quisiera reservar un encargo de vuestra Campaña Especial de Navidad (cesta gourmet / bandeja de ibéricos / pastelería).",
      whatsappPrefillEn:
        "Hello Corredera, I would like to place a Christmas Special pre-order (gourmet gift basket / Iberian ham tray / pastry pack).",
      imageUrl: "/assets/home/hero-loncheado.jpg",
    },
  },
  reyes: {
    label: "Especial Reyes y Cajas Dulces de Obrador",
    config: {
      enabled: true,
      theme: "festive_gold",
      badgeEs: "ESPECIAL REYES · OBRADOR ARTESANAL",
      badgeEn: "EPIPHANY SPECIAL · ARTISAN BAKERY",
      titleEs: "Desayunos de Reyes, Tartas Artesanas Enteras y Sweet Packs por Encargo",
      titleEn: "Three Kings Breakfasts, Whole Artisan Cakes & Sweet Pastry Boxes",
      descriptionEs:
        "Celebra la mañana de Reyes con nuestra bollería recién horneada, chocolate caliente, tartas completas por encargo y cajas de mini croissants y palmeritas de mantequilla listas para compartir en familia.",
      descriptionEn:
        "Celebrate Three Kings morning with our freshly baked pastries, hot chocolate, whole cakes to order and boxes of butter mini croissants and palmiers ready to share.",
      ctaTextEs: "Encargar para Reyes por WhatsApp",
      ctaTextEn: "Pre-Order for Three Kings via WhatsApp",
      whatsappPrefillEs:
        "Hola Corredera, quisiera hacer un encargo dulce para el Día de Reyes.",
      whatsappPrefillEn:
        "Hello Corredera, I would like to pre-order pastries/cakes for Three Kings Day.",
      imageUrl: "/assets/products/fr6.jpg",
    },
  },
  catas: {
    label: "Catas de Vino, Vermut y Tablas Ibéricas",
    config: {
      enabled: true,
      theme: "bakery_warm",
      badgeEs: "EXPERIENCIA GOURMET · PLAZAS LIMITADAS",
      badgeEn: "GOURMET EXPERIENCE · LIMITED SEATING",
      titleEs: "Catas de Vino con Maridaje Ibérico y Reservas en Barra de Degustación",
      titleEn: "Guided Wine Tastings with Iberian Pairing & Tasting Bar Bookings",
      descriptionEs:
        "Reserva tu mesa o plaza para nuestras degustaciones guiadas de vinos D.O. Ribera del Duero, Rioja y Rueda maridados con jamón ibérico de bellota cortado a cuchillo y quesos artesanos en Calle de la Puebla, 15.",
      descriptionEn:
        "Book your table or spot for our guided tastings of Ribera del Duero, Rioja and Rueda wines paired with hand-sliced acorn-fed Iberian ham and artisan cheeses at Calle de la Puebla, 15.",
      ctaTextEs: "Reservar Cata o Mesa por WhatsApp",
      ctaTextEn: "Book Wine Tasting via WhatsApp",
      whatsappPrefillEs:
        "Hola Corredera, quisiera consultar próximas fechas y reservar plaza para cata de vino o mesa en barra.",
      whatsappPrefillEn:
        "Hello Corredera, I would like to check dates and book a wine tasting or tasting bar table.",
      imageUrl: "/assets/products/g8.jpg",
    },
  },
  festivo: {
    label: "Aviso de Horario Especial / Festivo en Madrid",
    config: {
      enabled: true,
      theme: "urgent_notice",
      badgeEs: "AVISO DE HORARIO ESPECIAL",
      badgeEn: "SPECIAL OPENING HOURS NOTICE",
      titleEs: "Horario Especial de Apertura y Recogida de Encargos en Calle de la Puebla, 15",
      titleEn: "Special Opening & Pickup Hours at Calle de la Puebla, 15",
      descriptionEs:
        "Durante estos días festivos atendemos encargos de panadería, packs de oficina y tablas gourmet con horario especial. Escríbenos por WhatsApp para confirmar la hora exacta de recogida de tu pedido.",
      descriptionEn:
        "During the upcoming holidays we are serving bakery pre-orders, office packs and gourmet boards under special hours. Message us on WhatsApp to confirm your exact pickup time.",
      ctaTextEs: "Confirmar Horario por WhatsApp",
      ctaTextEn: "Confirm Hours via WhatsApp",
      whatsappPrefillEs:
        "Hola Corredera, quisiera confirmar vuestro horario especial de apertura para pasar a recoger un pedido.",
      whatsappPrefillEn:
        "Hello Corredera, I would like to confirm your special opening hours for order pickup.",
      imageUrl: "/assets/corredera-bakery-interior.jpg",
    },
  },
};

