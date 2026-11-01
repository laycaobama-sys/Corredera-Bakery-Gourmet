import { menuItems, type MenuItem } from "./catalog";

export interface CategoryFaqItem {
  questionEs: string;
  questionEn: string;
  answerEs: string;
  answerEn: string;
}

export interface GourmetCategoryPageConfig {
  slug: string;
  path: string;
  navLabelEs: string;
  navLabelEn: string;
  kickerEs: string;
  kickerEn: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  introEs: string;
  introEn: string;
  editorialTitleEs: string;
  editorialTitleEn: string;
  editorialBodyEs: string;
  editorialBodyEn: string;
  editorialHighlightsEs: string[];
  editorialHighlightsEn: string[];
  bannerImage: string;
  cardImage: string;
  cardBadgeEs: string;
  cardBadgeEn: string;
  seoTitleEs: string;
  seoTitleEn: string;
  seoDescriptionEs: string;
  seoDescriptionEn: string;
  filterItems: (items: MenuItem[]) => MenuItem[];
  faqs: CategoryFaqItem[];
  relatedSlugs: string[];
  isGourmetPrimary: boolean;
}

export const GOURMET_CATEGORY_PAGES: GourmetCategoryPageConfig[] = [
  {
    slug: "jamones",
    path: "/gourmet/jamones",
    navLabelEs: "Jamones",
    navLabelEn: "Whole Hams",
    kickerEs: "Alta Charcutería Ibérica · Piezas Enteras",
    kickerEn: "Fine Iberian Charcuterie · Whole Pieces",
    titleEs: "Jamones Ibéricos Enteros",
    titleEn: "Whole Iberian Hams",
    subtitleEs:
      "Piezas seleccionadas de 5 Jotas, Joselito, Dehesa de Extremadura y Cebo de Campo con servicio gratuito de corte a cuchillo y envasado al vacío.",
    subtitleEn:
      "Selected whole pieces from 5 Jotas, Joselito, Dehesa de Extremadura and Cebo de Campo with complimentary hand-carving and vacuum-packing service.",
    introEs:
      "En Corredera Bakery & Gourmet seleccionamos piezas enteras de las casas más prestigiosas del mundo ibérico. Puedes encargar tu jamón en pieza entera tradicional o solicitar sin ningún coste adicional nuestro servicio profesional de corte y envasado al vacío en sobres listos para degustar.",
    introEn:
      "At Corredera Bakery & Gourmet we select whole pieces from the most prestigious Iberian houses. You can pre-order your ham as a traditional whole piece or request our complimentary professional slicing and vacuum-packing service in ready-to-serve pouches.",
    editorialTitleEs: "El arte de elegir y disfrutar un gran jamón ibérico",
    editorialTitleEn: "The art of choosing and enjoying a fine Iberian ham",
    editorialBodyEs:
      "Cada pieza de nuestra cava ha sido escogida por su curación lenta, infiltración armónica y perfil aromático. Si prefieres la comodidad de recibir la pieza ya loncheada, nuestro equipo realiza el corte completo y envasa al vacío los sobres junto con los tacos y huesos aprovechables, de forma totalmente gratuita al encargar tu jamón.",
    editorialBodyEn:
      "Every piece in our cellar is selected for its slow curing, balanced marbling and aromatic depth. If you prefer the convenience of receiving your ham already sliced, our team performs the full carving and vacuum-packs the pouches along with diced trimmings and bones completely free when ordering your whole piece.",
    editorialHighlightsEs: [
      "Servicio de corte y envasado al vacío GRATUITO incluido al encargar tu pieza entera",
      "Selección de pesos orientativos (de 7 a 8,5 kg según referencia) y precio de referencia por kilo",
      "Recogida en Calle de la Puebla, 15 (Madrid) o entrega a domicilio (gastos de envío aparte)",
    ],
    editorialHighlightsEn: [
      "FREE slicing and vacuum-packing service included when ordering your whole piece",
      "Indicative weight ranges (7 to 8.5 kg depending on reference) and reference price per kilo",
      "In-store pickup at Calle de la Puebla, 15 (Madrid) or home delivery (shipping calculated separately)",
    ],
    bannerImage: "/assets/products/je1.jpg",
    cardImage: "/assets/products/je1.jpg",
    cardBadgeEs: "Corte y envasado gratis",
    cardBadgeEn: "Free slicing & vacuum pack",
    seoTitleEs: "Jamones Ibéricos Enteros 5 Jotas y Joselito en Madrid | Corredera Gourmet",
    seoTitleEn: "Whole Iberian Hams 5 Jotas & Joselito in Madrid | Corredera Gourmet",
    seoDescriptionEs:
      "Encarga jamones ibéricos enteros 5 Jotas, Joselito, Dehesa de Extremadura y Cebo de Campo en Madrid con corte y envasado al vacío gratis en Corredera Gourmet.",
    seoDescriptionEn:
      "Pre-order whole Iberian hams from 5 Jotas, Joselito, Extremadura and Cebo de Campo in Madrid with complimentary slicing and vacuum packing at Corredera Gourmet.",
    filterItems: (items) => items.filter((item) => item.category === "jamones_enteros"),
    faqs: [
      {
        questionEs: "¿El corte y envasado al vacío de la pieza entera tiene coste adicional?",
        questionEn: "Does slicing and vacuum-packing a whole ham have an extra cost?",
        answerEs:
          "No. En Corredera Bakery & Gourmet el servicio de corte y envasado al vacío es totalmente gratuito al encargar cualquiera de nuestras piezas enteras de jamón.",
        answerEn:
          "No. At Corredera Bakery & Gourmet, the slicing and vacuum-packing service is completely free when you order any of our whole hams.",
      },
      {
        questionEs: "¿Cómo se confirma el peso exacto y la disponibilidad de la pieza?",
        questionEn: "How are the exact weight and availability confirmed?",
        answerEs:
          "Al enviar tu solicitud de encargo por WhatsApp, nuestro equipo verifica en tienda las piezas disponibles dentro del rango de peso indicado y te confirma los detalles antes de cerrar el pedido.",
        answerEn:
          "When you send your order request via WhatsApp, our team checks the pieces available in store within the indicated weight range and confirms all details before finalizing.",
      },
      {
        questionEs: "¿Puedo solicitar entrega a domicilio de un jamón entero o loncheado?",
        questionEn: "Can I request home delivery for a whole or sliced ham?",
        answerEs:
          "Sí. Puedes recoger tu pieza en Calle de la Puebla, 15 o solicitar entrega a domicilio. Los gastos de envío se cobran aparte y se confirman antes de gestionar el pedido.",
        answerEn:
          "Yes. You can pick up your ham at Calle de la Puebla, 15 or request home delivery. Shipping costs are charged separately and confirmed before processing the order.",
      },
    ],
    relatedSlugs: ["jamon-cortado", "sobres-jamon", "embutidos", "quesos"],
    isGourmetPrimary: true,
  },
  {
    slug: "jamon-cortado",
    path: "/gourmet/jamon-cortado",
    navLabelEs: "Jamón Cortado",
    navLabelEn: "Sliced Ham",
    kickerEs: "Maestría en el Corte · Envasado de Alta Conservación",
    kickerEn: "Master Slicing · High-Preservation Vacuum Pack",
    titleEs: "Jamón Cortado a Cuchillo y Envasado al Vacío",
    titleEn: "Hand-Carved & Vacuum-Packed Iberian Ham",
    subtitleEs:
      "La experiencia del mejor jamón ibérico lista para emplatar: desde el corte gratuito de tu pieza entera hasta nuestros sobres de 100 g y raciones recién cortadas.",
    subtitleEn:
      "The finest Iberian ham experience ready to plate: from complimentary slicing of your whole ham to our 100g vacuum pouches and freshly carved portions.",
    introEs:
      "Un gran jamón ibérico alcanza su máxima expresión cuando se corta en lonchas finas, respetando la veta y la temperatura óptima de consumo. Descubre nuestras opciones de jamón cortado a mano y envasado al vacío, o encarga una pieza entera con servicio de corte gratuito incluido.",
    introEn:
      "A great Iberian ham reaches its peak expression when carved into thin slices, respecting the grain and optimal serving temperature. Discover our hand-carved and vacuum-packed ham options, or order a whole piece with complimentary slicing included.",
    editorialTitleEs: "Ventajas del corte profesional y envasado al vacío",
    editorialTitleEn: "Benefits of professional slicing and vacuum packing",
    editorialBodyEs:
      "El envasado al vacío permite conservar intactos los matices organolépticos del jamón de bellota durante semanas, ocupando mínimo espacio y facilitando abrir únicamente la cantidad que vayas a disfrutar en cada ocasión. Basta con atemperar el sobre entre 15 y 20 minutos antes de emplatar.",
    editorialBodyEn:
      "Vacuum packing preserves the full sensory nuances of acorn-fed ham for weeks, taking up minimal space and letting you open only the exact amount you wish to serve. Simply let the pouch come to room temperature for 15–20 minutes before plating.",
    editorialHighlightsEs: [
      "Corte gratuito y envasado en sobres al encargar cualquier jamón entero",
      "Sobres individuales de 100 g de Joselito (cortado a mano) y 5 Jotas disponibles por unidad",
      "Raciones y tablas de degustación preparadas al momento",
    ],
    editorialHighlightsEn: [
      "Complimentary slicing and pouch vacuum-packing when ordering any whole ham",
      "Individual 100g pouches of hand-carved Joselito and 5 Jotas available per unit",
      "Freshly prepared tasting portions and charcuterie boards",
    ],
    bannerImage: "/assets/products/sj2.jpg",
    cardImage: "/assets/products/sj2.jpg",
    cardBadgeEs: "Corte Profesional",
    cardBadgeEn: "Professional Slicing",
    seoTitleEs: "Jamón Ibérico Cortado a Cuchillo y Envasado al Vacío | Corredera Gourmet",
    seoTitleEn: "Hand-Carved & Vacuum-Packed Iberian Ham | Corredera Gourmet",
    seoDescriptionEs:
      "Jamón ibérico cortado a cuchillo y envasado al vacío en Madrid. Servicio gratuito de corte en piezas enteras y sobres de 100 g listos para degustar.",
    seoDescriptionEn:
      "Hand-carved and vacuum-packed Iberian ham in Madrid. Free slicing service on whole hams and 100g pouches ready to serve.",
    filterItems: (items) =>
      items.filter(
        (item) =>
          item.category === "jamones_enteros" ||
          item.category === "sobres_jamon" ||
          item.id === "g1" ||
          item.id === "g2" ||
          item.id === "t14" ||
          item.id === "t15",
      ),
    faqs: [
      {
        questionEs: "¿Cómo debo conservar y servir los sobres de jamón envasados al vacío?",
        questionEn: "How should I store and serve vacuum-packed ham pouches?",
        answerEs:
          "Consérvalos en lugar fresco o refrigerado suave y sácalos unos 20 minutos antes de su consumo para que la grasa infiltrada recupere su brillo y textura fundente.",
        answerEn:
          "Keep them in a cool place or mild refrigeration and take them out about 20 minutes before serving so the marbled fat regains its sheen and melt-in-the-mouth texture.",
      },
      {
        questionEs: "¿Qué diferencia hay entre encargar una pieza entera cortada o sobres sueltos?",
        questionEn: "What is the difference between ordering a sliced whole ham vs individual pouches?",
        answerEs:
          "Al encargar una pieza entera obtienes el rendimiento completo del jamón con el corte y envasado al vacío incluido gratis. Los sobres de 100 g te permiten disfrutar o regalar la cantidad exacta que desees por unidad.",
        answerEn:
          "Ordering a whole piece gives you the full yield of the ham with slicing and vacuum-packing included for free. The 100g pouches let you enjoy or gift the exact number of packs you wish.",
      },
    ],
    relatedSlugs: ["jamones", "sobres-jamon", "sobres-embutidos", "quesos"],
    isGourmetPrimary: true,
  },
  {
    slug: "sobres-jamon",
    path: "/gourmet/sobres-jamon",
    navLabelEs: "Sobres de Jamón",
    navLabelEn: "Ham Pouches (100g)",
    kickerEs: "Formato Degustación · 100 Gramos al Vacío",
    kickerEn: "Tasting Format · 100g Vacuum Pouches",
    titleEs: "Sobres de Jamón Ibérico (100 g)",
    titleEn: "Iberian Ham Vacuum Pouches (100 g)",
    subtitleEs:
      "Sobres de 100 gramos envasados al vacío de Joselito (cortado a máquina y a mano), 5 Jotas, Extremadura, Los Pedroches, Bellota 50 %, Tapas y Cebo.",
    subtitleEn:
      "100-gram vacuum-sealed pouches of Joselito (machine-sliced and hand-carved), 5 Jotas, Extremadura, Los Pedroches, 50% Bellota, Tapas and Cebo.",
    introEs:
      "Nuestros sobres de 100 gramos de jamón ibérico están pensados para que disfrutes en casa, en la oficina o en tus regalos gastronómicos de las mejores firmas ibéricas con total comodidad. Abre, atempera unos minutos y sirve.",
    introEn:
      "Our 100-gram pouches of Iberian ham are designed so you can enjoy the finest Iberian brands at home, at the office or as gastronomic gifts with effortless convenience. Open, let breathe for a few minutes and serve.",
    editorialTitleEs: "Diez referencias de jamón en formato de 100 g",
    editorialTitleEn: "Ten ham references in 100g format",
    editorialBodyEs:
      "Desde la exclusividad del sobre Joselito (cortado a máquina o a mano) y el 5 Jotas hasta el jamón de Extremadura, Los Pedroches, Bellota 50 % raza ibérica, corte tapas, cebo o cruzado. Combina diferentes orígenes y curaciones en un mismo encargo para crear tu propia cata ibérica.",
    editorialBodyEn:
      "From the exclusivity of Joselito (machine-sliced or hand-carved) and 5 Jotas pouches to Extremadura, Los Pedroches, 50% Iberian breed acorn-fed, tapas cut, cebo or crossbred ham. Combine different origins and curings in a single pre-order to build your own Iberian tasting.",
    editorialHighlightsEs: [
      "Formato homogéneo en sobres de 100 gramos envasados al vacío",
      "Diez referencias confirmadas desde 4,99 € hasta 24,49 € por sobre",
      "Ideales para degustación inmediata, cenas gourmet o cestas personalizadas",
    ],
    editorialHighlightsEn: [
      "Uniform 100-gram vacuum-sealed pouch format",
      "Ten confirmed references ranging from €4.99 to €24.49 per pouch",
      "Ideal for immediate tasting, gourmet dinners or bespoke gift baskets",
    ],
    bannerImage: "/assets/products/sj3.jpg",
    cardImage: "/assets/products/sj3.jpg",
    cardBadgeEs: "Sobres 100 g",
    cardBadgeEn: "100g Pouches",
    seoTitleEs: "Sobres de Jamón Ibérico 100 g al Vacío (5 Jotas, Joselito) | Corredera Gourmet",
    seoTitleEn: "100g Vacuum-Packed Iberian Ham Pouches (5 Jotas, Joselito) | Corredera Gourmet",
    seoDescriptionEs:
      "Sobres de 100 g de jamón ibérico envasado al vacío en Madrid: Joselito cortado a mano y a máquina, 5 Jotas, Extremadura y Los Pedroches. Encargos por WhatsApp.",
    seoDescriptionEn:
      "100g vacuum-sealed Iberian ham pouches in Madrid: Joselito, 5 Jotas, Extremadura and Los Pedroches. Direct WhatsApp pre-orders.",
    filterItems: (items) => items.filter((item) => item.category === "sobres_jamon"),
    faqs: [
      {
        questionEs: "¿Qué peso tiene cada sobre de jamón ibérico?",
        questionEn: "What is the weight of each Iberian ham pouch?",
        answerEs:
          "Todos los sobres de esta selección se presentan en formato de 100 gramos envasados al vacío.",
        answerEn:
          "All pouches in this selection come in a 100-gram vacuum-sealed format.",
      },
      {
        questionEs: "¿Puedo combinar varios sobres diferentes en un mismo encargo?",
        questionEn: "Can I combine several different pouches in one order?",
        answerEs:
          "Por supuesto. Puedes añadir tantos sobres como quieras de distintas variedades (Joselito, 5 Jotas, Extremadura, Los Pedroches, Bellota 50 %...) en una única solicitud de encargo.",
        answerEn:
          "Of course. You can add as many pouches as you like from different varieties (Joselito, 5 Jotas, Extremadura, Los Pedroches, 50% Bellota...) in a single order request.",
      },
    ],
    relatedSlugs: ["jamones", "jamon-cortado", "sobres-embutidos", "quesos"],
    isGourmetPrimary: true,
  },
  {
    slug: "embutidos",
    path: "/gourmet/embutidos",
    navLabelEs: "Embutidos",
    navLabelEn: "Charcuterie",
    kickerEs: "Dehesa y Curación Artesanal · Venta al Peso",
    kickerEn: "Dehesa & Artisan Curing · Sold by Weight",
    titleEs: "Embutidos Ibéricos y Curados Selectos",
    titleEn: "Iberian Charcuterie & Selected Cured Meats",
    subtitleEs:
      "Presa ibérica curada, lomo 100 % y 75 % bellota, lomo cebo de campo, chorizo y salchichón Joselito y de bellota seleccionados por pieza o al corte.",
    subtitleEn:
      "Cured Iberian presa, 100% and 75% acorn-fed loin, Cebo de Campo loin, and Joselito and acorn-fed chorizo and salchichón available by weight.",
    introEs:
      "Nuestra selección de embutidos ibéricos reúne los cortes más nobles del cerdo ibérico y curados tradicionales elaborados en secaderos naturales. Referencias de intenso aroma, adobo equilibrado y textura jugosa con precios expresados por kilogramo.",
    introEn:
      "Our Iberian charcuterie selection brings together the noblest cuts of Iberian pork and traditional cured meats crafted in natural drying cellars. Richly aromatic references with balanced seasoning and juicy texture, priced per kilogram.",
    editorialTitleEs: "Cortes nobles curados con tiempo y maestría",
    editorialTitleEn: "Noble cuts cured with time and craftsmanship",
    editorialBodyEs:
      "La presa ibérica curada (98,00 €/kg) y la caña de lomo 100 % ibérico de bellota (89,90 €/kg) representan la cumbre de la charcutería española. Acompáñalos con nuestro chorizo y salchichón Joselito (39,90 €/kg), lomo 75 % bellota, lomo cebo de campo o chorizo de bellota para componer una tabla gourmet inolvidable.",
    editorialBodyEn:
      "Cured Iberian presa (€98.00/kg) and 100% acorn-fed Iberian cured loin (€89.90/kg) represent the pinnacle of Spanish charcuterie. Pair them with our Joselito chorizo and salchichón (€39.90/kg), 75% acorn-fed loin, Cebo de Campo loin or acorn-fed chorizo to compose an unforgettable gourmet board.",
    editorialHighlightsEs: [
      "Cortes nobles: Presa ibérica curada (98,00 €/kg), Lomo 100 % bellota (89,90 €/kg) y Lomo 75 % bellota (72,99 €/kg)",
      "Curados de firma: Chorizo y Salchichón Joselito (39,90 €/kg), Chorizo de bellota y Lomo cebo de campo",
      "Indica en tu encargo la cantidad deseada al corte o por pieza",
    ],
    editorialHighlightsEn: [
      "Noble cuts: Cured Iberian presa (€98.00/kg), 100% acorn-fed loin (€89.90/kg) and 75% acorn-fed loin (€72.99/kg)",
      "Signature cured meats: Joselito Chorizo & Salchichón (€39.90/kg), Acorn-fed chorizo and Cebo de Campo loin",
      "Specify your desired weight or piece preference in your pre-order",
    ],
    bannerImage: "/assets/products/em1.jpg",
    cardImage: "/assets/products/em1.jpg",
    cardBadgeEs: "Alta Charcutería",
    cardBadgeEn: "Fine Charcuterie",
    seoTitleEs: "Embutidos Ibéricos de Bellota, Presa, Lomo y Joselito en Madrid | Corredera Gourmet",
    seoTitleEn: "Acorn-Fed Iberian Charcuterie, Presa, Loin & Joselito in Madrid | Corredera Gourmet",
    seoDescriptionEs:
      "Compra y encarga embutidos ibéricos en Madrid: presa ibérica curada, lomo 100 % bellota, chorizo y salchichón Joselito en Corredera Gourmet.",
    seoDescriptionEn:
      "Pre-order Iberian charcuterie in Madrid: cured Iberian presa, 100% acorn-fed loin, and Joselito chorizo and salchichón at Corredera Gourmet.",
    filterItems: (items) => items.filter((item) => item.category === "embutidos"),
    faqs: [
      {
        questionEs: "¿Cómo se calculan los precios de los embutidos por kilo?",
        questionEn: "How are per-kilo charcuterie prices calculated?",
        answerEs:
          "El precio indicado corresponde al kilogramo (€/kg). En tu solicitud de encargo puedes indicar el peso aproximado que deseas (por ejemplo, 250 g, 500 g o pieza entera) y te confirmamos el importe exacto al pesarlo en tienda.",
        answerEn:
          "The price shown is per kilogram (€/kg). In your order request you can state the approximate weight you want (e.g. 250g, 500g or a whole piece) and we confirm the exact total upon weighing in store.",
      },
      {
        questionEs: "¿Tenéis también estos embutidos ya cortados en sobres de 100 g?",
        questionEn: "Do you also offer these cured meats already sliced in 100g pouches?",
        answerEs:
          "Sí, disponemos de una categoría específica de Sobres de Embutidos de 100 g envasados al vacío con lomo de bellota, lomo de cebo, cecina de León, salchichón y chorizo (de bellota y Joselito).",
        answerEn:
          "Yes, we have a dedicated category of 100g Vacuum-Packed Charcuterie Pouches featuring acorn-fed loin, cebo loin, León cecina, salchichón and chorizo (acorn-fed and Joselito).",
      },
    ],
    relatedSlugs: ["sobres-embutidos", "jamones", "quesos", "aceites"],
    isGourmetPrimary: true,
  },
  {
    slug: "sobres-embutidos",
    path: "/gourmet/sobres-embutidos",
    navLabelEs: "Sobres de Embutidos",
    navLabelEn: "Charcuterie Pouches",
    kickerEs: "Listos para Servir · Sobres de 100 g al Vacío",
    kickerEn: "Ready to Serve · 100g Vacuum Pouches",
    titleEs: "Sobres de Embutidos Ibéricos (100 g)",
    titleEn: "Iberian Charcuterie Vacuum Pouches (100 g)",
    subtitleEs:
      "Lomo ibérico de bellota y de cebo, cecina de León, salchichón y chorizo de bellota y Joselito en prácticos sobres de 100 g al vacío.",
    subtitleEn:
      "Acorn-fed and cebo Iberian loin, León cured beef, and acorn-fed and Joselito salchichón and chorizo in convenient 100g vacuum pouches.",
    introEs:
      "Disfruta de nuestra alta charcutería ya loncheada y envasada al vacío en sobres de 100 gramos. La forma más ágil de preparar una tabla de ibéricos variada en pocos minutos manteniendo toda la jugosidad y aroma del recién cortado.",
    introEn:
      "Enjoy our fine charcuterie already sliced and vacuum-sealed in 100-gram pouches. The fastest way to prepare a varied Iberian board in minutes while preserving the juiciness and aroma of freshly sliced cuts.",
    editorialTitleEs: "Variedad gourmet siempre a punto en tu despensa",
    editorialTitleEn: "Gourmet variety always ready in your pantry",
    editorialBodyEs:
      "Combina nuestros sobres de 100 g de lomo ibérico de bellota (7,99 €), cecina de León (8,99 €), salchichón y chorizo Joselito (7,99 €) y embutidos de bellota y cebo (5,99 €). Cada sobre está envasado para conservar su frescura hasta el momento de emplatar.",
    editorialBodyEn:
      "Combine our 100g pouches of acorn-fed Iberian loin (€7.99), León cured beef (€8.99), Joselito salchichón and chorizo (€7.99), and acorn-fed and cebo charcuterie (€5.99). Every pouch is vacuum-sealed to lock in freshness until plating.",
    editorialHighlightsEs: [
      "Siete variedades selectas en sobres de 100 gramos al vacío",
      "Desde 5,99 € hasta 8,99 € por sobre con precio cerrado",
      "Combinación perfecta con nuestros sobres de jamón ibérico y quesos",
    ],
    editorialHighlightsEn: [
      "Seven select varieties in 100-gram vacuum-sealed pouches",
      "Fixed pricing from €5.99 to €8.99 per pouch",
      "Perfect pairing with our Iberian ham pouches and cheeses",
    ],
    bannerImage: "/assets/products/se1.jpg",
    cardImage: "/assets/products/se1.jpg",
    cardBadgeEs: "Sobres 100 g",
    cardBadgeEn: "100g Pouches",
    seoTitleEs: "Sobres de Embutidos Ibéricos 100 g (Lomo, Cecina, Joselito) | Corredera Gourmet",
    seoTitleEn: "100g Iberian Charcuterie Pouches (Loin, Cecina, Joselito) | Corredera Gourmet",
    seoDescriptionEs:
      "Sobres de embutidos ibéricos de 100 g envasados al vacío en Madrid: lomo de bellota, cecina de León, chorizo y salchichón Joselito y de bellota.",
    seoDescriptionEn:
      "100g vacuum-packed Iberian charcuterie pouches in Madrid: acorn-fed loin, León cecina, and Joselito and acorn-fed chorizo and salchichón.",
    filterItems: (items) => items.filter((item) => item.category === "sobres_embutidos"),
    faqs: [
      {
        questionEs: "¿Todos los sobres de embutido pesan 100 gramos?",
        questionEn: "Do all charcuterie pouches weigh 100 grams?",
        answerEs:
          "Sí, todas las referencias de esta familia vienen presentadas en sobres de 100 gramos envasados al vacío.",
        answerEn:
          "Yes, all references in this family are presented in 100-gram vacuum-sealed pouches.",
      },
      {
        questionEs: "¿Puedo pedir una selección variada para regalo o evento?",
        questionEn: "Can I order a mixed selection for a gift or event?",
        answerEs:
          "Sí, puedes añadir cualquier combinación de sobres a tu solicitud de encargo e indicarnos en las notas si los deseas preparados para regalo o cesta gourmet.",
        answerEn:
          "Yes, you can add any combination of pouches to your pre-order request and let us know in the notes if you want them prepared as a gift or gourmet basket.",
      },
    ],
    relatedSlugs: ["embutidos", "sobres-jamon", "quesos", "aceites"],
    isGourmetPrimary: true,
  },
  {
    slug: "quesos",
    path: "/gourmet/quesos",
    navLabelEs: "Quesos",
    navLabelEn: "Cheeses",
    kickerEs: "Afinado y Tradición Quesera · Al Corte y por Pieza",
    kickerEn: "Cheese Affinage & Tradition · By Weight & Per Unit",
    titleEs: "Quesos Seleccionados Nacionales y Europeos",
    titleEn: "Selected Spanish & European Artisan Cheeses",
    subtitleEs:
      "Desde Payoyo, Pecorino trufado, Bóer con miel y trufa, Comté e Idiazábal al corte (€/kg) hasta cuñas seleccionadas de San Antonio y Ahuyentalobos por unidad.",
    subtitleEn:
      "From Payoyo, truffled Pecorino, Boer with honey & truffle, Comté and Idiazábal by weight (€/kg) to selected San Antonio and Ahuyentalobos wedges per unit.",
    introEs:
      "Nuestra cava de quesos reúne doce referencias con personalidad propia: quesos de oveja y cabra de queserías artesanas españolas junto a especialidades europeas como el Comté francés, el Pecorino trufado o los Gouda al pesto verde y con miel.",
    introEn:
      "Our cheese selection brings together twelve distinctive references: sheep and goat cheeses from Spanish artisan dairies alongside European specialties such as French Comté, truffled Pecorino and Dutch Gouda with green pesto or honey.",
    editorialTitleEs: "Quesos al corte (€/kg) y cuñas seleccionadas por unidad",
    editorialTitleEn: "Cheeses by weight (€/kg) and selected wedges per unit",
    editorialBodyEs:
      "Distinguimos con total claridad nuestras diez referencias de venta al peso (€/kg) —Queso de Oveja Elaff, Bóer con miel y trufa, Pecorino trufado, Payoyo Semicurado y Curado, Maestrazgo, Gouda al pesto, Gouda con miel, Idiazábal D.O.P. y Comté francés— de las dos cuñas de venta por unidad: Queso de Cabra San Antonio (8,99 €) y Queso de Oveja Ahuyentalobos (9,99 €).",
    editorialBodyEn:
      "We clearly distinguish our ten references sold by weight (€/kg)—Elaff Sheep Cheese, Boer with honey & truffle, Truffled Pecorino, Semi-Cured & Cured Payoyo, Maestrazgo, Green Pesto Gouda, Honey Gouda, Idiazábal D.O.P. and French Comté—from our two wedges sold per unit: San Antonio Goat Cheese (€8.99) and Ahuyentalobos Sheep Cheese (€9.99).",
    editorialHighlightsEs: [
      "10 referencias de quesos artesanos al corte con precio por kilogramo (€/kg)",
      "2 cuñas seleccionadas con precio cerrado por unidad (San Antonio 8,99 € y Ahuyentalobos 9,99 €)",
      "Asesoramiento en tienda y por WhatsApp para tablas de quesos y maridajes",
    ],
    editorialHighlightsEn: [
      "10 artisan cheese references sold by weight with price per kilogram (€/kg)",
      "2 selected wedges with fixed price per unit (San Antonio €8.99 and Ahuyentalobos €9.99)",
      "In-store and WhatsApp guidance for cheese boards and wine pairings",
    ],
    bannerImage: "/assets/products/q3.jpg",
    cardImage: "/assets/products/q3.jpg",
    cardBadgeEs: "Cava de Quesos",
    cardBadgeEn: "Artisan Cheeses",
    seoTitleEs: "Quesos Artesanos y Gourmet en Madrid (Payoyo, Pecorino Trufado, Comté) | Corredera",
    seoTitleEn: "Artisan & Gourmet Cheeses in Madrid (Payoyo, Truffled Pecorino, Comté) | Corredera",
    seoDescriptionEs:
      "Selección de quesos gourmet en Madrid: Payoyo, Pecorino trufado, Bóer con miel y trufa, Comté, Idiazábal y cuñas artesanas. Encargos en Corredera Gourmet.",
    seoDescriptionEn:
      "Curated gourmet cheeses in Madrid: Payoyo, truffled Pecorino, Boer with honey & truffle, Comté, Idiazábal and artisan wedges. Pre-order at Corredera Gourmet.",
    filterItems: (items) => items.filter((item) => item.category === "quesos"),
    faqs: [
      {
        questionEs: "¿Qué quesos se venden por kilo y cuáles por unidad?",
        questionEn: "Which cheeses are sold per kilo and which per unit?",
        answerEs:
          "En cada ficha indicamos claramente si el precio es por kilogramo (€/kg) o por unidad. Las 10 referencias al corte (Payoyo, Pecorino trufado, Bóer, Comté, Idiazábal, Maestrazgo, Elaff y Goudas) se venden por kilo, mientras que las cuñas de San Antonio (8,99 €) y Ahuyentalobos (9,99 €) tienen precio cerrado por unidad.",
        answerEn:
          "Each product card clearly states whether the price is per kilogram (€/kg) or per unit. Our 10 counter references (Payoyo, truffled Pecorino, Boer, Comté, Idiazábal, Maestrazgo, Elaff and Goudas) are sold by weight, whereas the San Antonio (€8.99) and Ahuyentalobos (€9.99) wedges are priced per unit.",
      },
      {
        questionEs: "¿Podéis prepararme una cuña de un peso concreto o envasarla al vacío?",
        questionEn: "Can you cut a wedge of a specific weight or vacuum-pack it?",
        answerEs:
          "Sí. Indícanos en las observaciones de tu encargo el peso aproximado de cada queso al corte y si deseas envasado para viaje o conservación.",
        answerEn:
          "Yes. Let us know the approximate weight in your pre-order notes and whether you would like it vacuum-packed for travel or storage.",
      },
    ],
    relatedSlugs: ["jamones", "embutidos", "aceites", "sobres-jamon"],
    isGourmetPrimary: true,
  },
  {
    slug: "aceites",
    path: "/gourmet/aceites",
    navLabelEs: "Aceites",
    navLabelEn: "Olive Oils",
    kickerEs: "Oro Líquido de Almazara · AOVE Seleccionado",
    kickerEn: "Liquid Gold · Selected Extra Virgin Olive Oils",
    titleEs: "Aceites de Oliva Virgen Extra (AOVE)",
    titleEn: "Extra Virgin Olive Oils (EVOO)",
    subtitleEs:
      "Aceite de oliva ecológico en lata, monovarietales Arbequina y Lucio Picual, edición Lucio Milenium, El Silencio y Señoríos de Relleu.",
    subtitleEn:
      "Organic extra virgin olive oil in tin, Arbequina and Lucio Picual single-varietals, Lucio Milenium edition, El Silencio and Señoríos de Relleu.",
    introEs:
      "El aceite de oliva virgen extra es el pilar de la dieta mediterránea y el acompañante indispensable de un buen pan artesano, un desayuno ibérico o una tabla de quesos. Hemos reunido siete referencias seleccionadas de almazara con precio confirmado por unidad.",
    introEn:
      "Extra virgin olive oil is the cornerstone of Mediterranean gastronomy and the essential companion to artisan bread, an Iberian breakfast or a cheese board. We have curated seven mill-selected references with confirmed per-unit pricing.",
    editorialTitleEs: "Siete referencias de AOVE de almazara y cultivo ecológico",
    editorialTitleEn: "Seven mill-selected and organic EVOO references",
    editorialBodyEs:
      "En nuestra colección encontrarás el Aceite de Oliva Ecológico en lata protectora (14,99 €), los monovarietales AOVE Arbequina (22,99 €), Lucio Picual (22,99 €) y Lucio Milenium (22,99 €), el AOVE El Silencio (17,99 €) y las dos presentaciones de diseño de Señoríos de Relleu en formato pequeño (9,99 €) y formato botella (22,99 €).",
    editorialBodyEn:
      "In our collection you will find Organic Olive Oil in a protective tin (€14.99), the single-estate Arbequina (€22.99), Lucio Picual (€22.99) and Lucio Milenium (€22.99) EVOOs, El Silencio EVOO (€17.99), and two signature presentations of Señoríos de Relleu in small format (€9.99) and full bottle (€22.99).",
    editorialHighlightsEs: [
      "7 referencias confirmadas de Aceite de Oliva Virgen Extra desde 9,99 € hasta 22,99 € por unidad",
      "Variedades Arbequina, Picual, Ecológico en lata, Lucio Milenium, El Silencio y Señoríos de Relleu",
      "Disponibles para recogida en Calle de la Puebla, 15 o entrega a domicilio",
    ],
    editorialHighlightsEn: [
      "7 confirmed Extra Virgin Olive Oil references from €9.99 to €22.99 per unit",
      "Arbequina, Picual, Organic tin, Lucio Milenium, El Silencio and Señoríos de Relleu varieties",
      "Available for pickup at Calle de la Puebla, 15 or home delivery",
    ],
    bannerImage: "/assets/products/ao1.jpg",
    cardImage: "/assets/products/ao1.jpg",
    cardBadgeEs: "Colección AOVE",
    cardBadgeEn: "EVOO Collection",
    seoTitleEs: "Aceite de Oliva Virgen Extra (AOVE) Gourmet en Madrid | Corredera Gourmet",
    seoTitleEn: "Gourmet Extra Virgin Olive Oil (EVOO) in Madrid | Corredera Gourmet",
    seoDescriptionEs:
      "Encarga Aceite de Oliva Virgen Extra (AOVE) en Madrid: Ecológico en lata, Arbequina, Lucio Picual, Lucio Milenium, El Silencio y Señoríos de Relleu en Corredera.",
    seoDescriptionEn:
      "Pre-order Extra Virgin Olive Oil (EVOO) in Madrid: Organic tin, Arbequina, Lucio Picual, Lucio Milenium, El Silencio and Señoríos de Relleu at Corredera Gourmet.",
    filterItems: (items) => items.filter((item) => item.category === "aceites"),
    faqs: [
      {
        questionEs: "¿Cómo se indica el precio de cada aceite de oliva virgen extra?",
        questionEn: "How is each extra virgin olive oil priced?",
        answerEs:
          "Todas nuestras referencias de aceite tienen precio cerrado por unidad (lata o botella según la referencia seleccionada), desde 9,99 € hasta 22,99 €.",
        answerEn:
          "All our olive oil references have a fixed price per unit (tin or bottle depending on the selected reference), ranging from €9.99 to €22.99.",
      },
      {
        questionEs: "¿Se pueden incluir botellas o latas de AOVE en encargos para regalo?",
        questionEn: "Can EVOO bottles or tins be included in gourmet gift orders?",
        answerEs:
          "Sí. Tanto el Aceite Ecológico en lata como las ediciones de Señoríos de Relleu, Lucio Milenium o Arbequina son muy solicitadas para combinar con sobres de jamón ibérico y quesos.",
        answerEn:
          "Yes. Both the Organic tin and the Señoríos de Relleu, Lucio Milenium or Arbequina editions are popular choices to pair with Iberian ham pouches and cheeses.",
      },
    ],
    relatedSlugs: ["jamones", "quesos", "embutidos", "sobres-jamon"],
    isGourmetPrimary: true,
  },
  {
    slug: "bakery-cafe",
    path: "/bakery-cafe",
    navLabelEs: "Bakery & Café",
    navLabelEn: "Bakery & Cafe",
    kickerEs: "Espacio en Calle de la Puebla, 15 · Obrador & Cafetería",
    kickerEn: "In-Store Space at Calle de la Puebla, 15 · Bakery & Cafe",
    titleEs: "Bakery, Cafetería y Desayunos en Nuestro Local",
    titleEn: "Bakery, Specialty Coffee & Daily Breakfasts In Store",
    subtitleEs:
      "Consulta nuestra carta de desayunos del día, café, bollería artesana, tostadas y bebidas para disfrutar en nuestro espacio de Madrid, además de tartas enteras y packs por encargo.",
    subtitleEn:
      "Explore our menu of daily breakfast combos, coffee, artisan pastries, toasts and drinks to enjoy at our Madrid store, plus whole cakes and office packs to pre-order.",
    introEs:
      "Además de nuestra tienda gourmet especializada en jamones ibéricos, embutidos, quesos y AOVE, en Calle de la Puebla, 15 contamos con cafetería y obrador artesanal. Los cafés, desayunos, bollería individual y bebidas se sirven directamente en el local, mientras que las tartas enteras y los Sweet/Salty Packs pueden reservarse por encargo.",
    introEn:
      "Alongside our gourmet store specializing in Iberian hams, charcuterie, cheeses and EVOO, our Calle de la Puebla, 15 location features an artisan bakery and coffee shop. Coffees, breakfasts, individual pastries and drinks are served directly in store, while whole cakes and Sweet/Salty Packs can be reserved by pre-order.",
    editorialTitleEs: "Consumo en local y encargos especiales de obrador",
    editorialTitleEn: "In-store dining & special bakery pre-orders",
    editorialBodyEs:
      "Presentamos nuestra carta completa de cafetería de forma transparente para que puedas consultar precios y combinaciones antes de visitarnos. Recuerda que no disponemos de cocina ni platos calientes de elaboración en cocina: nuestra propuesta se centra en bollería horneada, tostadas, bocadillos de vitrina, tartas artesanas y alta charcutería.",
    editorialBodyEn:
      "We display our complete cafe menu transparently so you can check prices and combos before visiting us. Please note that we focus on freshly baked pastries, toasts, counter sandwiches, artisan cakes and fine charcuterie.",
    editorialHighlightsEs: [
      "Desayunos y promociones diarias para disfrutar en el local (Croissant + Café 3,75 €, Brunch 11,99 €)",
      "Cafés, bollería individual, tostadas y bebidas de consumo directo en tienda",
      "Tartas enteras y Sweet/Salty Packs para 5 o 15 personas disponibles bajo encargo por WhatsApp",
    ],
    editorialHighlightsEn: [
      "Daily breakfast combos to enjoy in store (Croissant + Coffee €3.75, Complete Brunch €11.99)",
      "Coffees, individual pastries, toasts and cold drinks served directly at the store",
      "Whole cakes and Sweet/Salty Packs for 5 or 15 people available for WhatsApp pre-order",
    ],
    bannerImage: "/assets/corredera-bakery-interior.jpg",
    cardImage: "/assets/IMG_3810.jpeg",
    cardBadgeEs: "Carta de Local",
    cardBadgeEn: "In-Store Menu",
    seoTitleEs: "Carta de Cafetería, Desayunos y Obrador en Madrid | Corredera Bakery & Gourmet",
    seoTitleEn: "Cafe Menu, Breakfasts & Artisan Bakery in Madrid | Corredera Bakery & Gourmet",
    seoDescriptionEs:
      "Consulta la carta de desayunos, cafetería, bollería artesana, tartas y packs para eventos de Corredera Bakery & Gourmet en Calle de la Puebla, 15 (Madrid).",
    seoDescriptionEn:
      "View the breakfast, coffee, artisan pastry, cake and event pack menu at Corredera Bakery & Gourmet on Calle de la Puebla, 15 (Madrid).",
    filterItems: (items) =>
      items.filter((item) => item.mode === "bakery" || item.category === "packs"),
    faqs: [
      {
        questionEs: "¿Se pueden pedir cafés, croissants o desayunos individuales a domicilio?",
        questionEn: "Can coffees, croissants or individual breakfasts be ordered for delivery?",
        answerEs:
          "No. Los cafés, desayunos del día, bollería individual y bebidas están disponibles en la carta para consulta y consumo directo en nuestro local de Calle de la Puebla, 15. Para encargos online por WhatsApp ofrecemos toda nuestra selección Gourmet, tartas enteras y Packs para reuniones.",
        answerEn:
          "No. Coffees, daily breakfasts, individual pastries and drinks are shown on the menu for reference and direct enjoyment at our Calle de la Puebla, 15 location. Online WhatsApp pre-orders are dedicated to our Gourmet selection, whole cakes and office Packs.",
      },
      {
        questionEs: "¿Con cuánta antelación debo encargar una tarta entera o un Sweet/Salty Pack?",
        questionEn: "How far in advance should I pre-order a whole cake or a Sweet/Salty Pack?",
        answerEs:
          "Recomendamos solicitar el encargo con al menos 24–48 horas de antelación por WhatsApp para garantizar disponibilidad recién horneada.",
        answerEn:
          "We recommend placing your pre-order at least 24–48 hours in advance via WhatsApp to ensure freshly baked availability.",
      },
    ],
    relatedSlugs: ["jamones", "sobres-jamon", "quesos", "aceites"],
    isGourmetPrimary: false,
  },
];

export const PRIMARY_GOURMET_CATEGORIES = GOURMET_CATEGORY_PAGES.filter(
  (cat) => cat.isGourmetPrimary,
);

export function getGourmetCategoryBySlug(
  slug: string,
): GourmetCategoryPageConfig | undefined {
  return GOURMET_CATEGORY_PAGES.find((cat) => cat.slug === slug);
}

export function getGourmetCategoryByPath(
  rawPath: string,
): GourmetCategoryPageConfig | undefined {
  const clean = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return GOURMET_CATEGORY_PAGES.find((cat) => cat.path === clean);
}

export function getCategoryForProduct(
  item: MenuItem,
): GourmetCategoryPageConfig {
  switch (item.category) {
    case "jamones_enteros":
      return GOURMET_CATEGORY_PAGES[0];
    case "sobres_jamon":
      return GOURMET_CATEGORY_PAGES[2];
    case "embutidos":
      return GOURMET_CATEGORY_PAGES[3];
    case "sobres_embutidos":
      return GOURMET_CATEGORY_PAGES[4];
    case "quesos":
      return GOURMET_CATEGORY_PAGES[5];
    case "aceites":
      return GOURMET_CATEGORY_PAGES[6];
    default:
      if (item.mode === "gourmet") {
        return GOURMET_CATEGORY_PAGES[1];
      }
      return GOURMET_CATEGORY_PAGES[7];
  }
}

/**
 * Returns the showcase photographs for a product detail page. Every product has a single
 * clean studio photo (managed from the admin panel), so galleries never mix in generic images.
 */
export function getProductShowcaseImages(
  item: MenuItem,
  fallbackUrl: string,
): string[] {
  return [fallbackUrl || `/assets/products/${item.id}.jpg`];
}

export function isValidProductRoute(rawPath: string): boolean {
  const clean = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (!clean.startsWith("/producto/")) return false;
  const id = decodeURIComponent(clean.slice("/producto/".length));
  return menuItems.some((item) => item.id === id);
}
