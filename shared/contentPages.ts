/**
 * Landing pages and guides, written once and rendered both by the server (HTML, JSON-LD, sitemap,
 * llms.txt) and by the client. Prices never appear here: product lists read the live catalog.
 * Business facts not yet confirmed by the shop are left out and listed in PENDIENTES_CLIENTE.md.
 */
export type ContentFaq = { qEs: string; qEn: string; aEs: string; aEn: string };
export type ContentTable = { headEs: string[]; headEn: string[]; rowsEs: string[][]; rowsEn: string[][] };
export type ContentSection = {
  hEs: string;
  hEn: string;
  pEs?: string[];
  pEn?: string[];
  listEs?: string[];
  listEn?: string[];
  table?: ContentTable;
};
export type ContentPage = {
  path: string;
  kind: "guide" | "service" | "landing";
  kickerEs: string;
  kickerEn: string;
  titleEs: string;
  titleEn: string;
  seoTitleEs: string;
  seoTitleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  /** Direct answer in the first paragraph, ready to be quoted. */
  answerEs: string;
  answerEn: string;
  image: string;
  published: string;
  updated: string;
  sections: ContentSection[];
  faqs: ContentFaq[];
  productIds: string[];
  productsTitleEs: string;
  productsTitleEn: string;
  links: { href: string; es: string; en: string }[];
  whatsappEs: string;
  whatsappEn: string;
  ctaEs: string;
  ctaEn: string;
  /** Shows the company order form that composes a WhatsApp message. */
  companyForm?: boolean;
};

const DATE = "2026-11-07";

export const CONTENT_PAGES: ContentPage[] = [
  {
    path: "/lotes-navidad",
    kind: "landing",
    kickerEs: "Navidad en Corredera",
    kickerEn: "Christmas at Corredera",
    titleEs: "Lotes de Navidad gourmet en Madrid",
    titleEn: "Gourmet Christmas hampers in Madrid",
    seoTitleEs: "Lotes de Navidad gourmet en Madrid, para empresas | Corredera",
    seoTitleEn: "Gourmet Christmas hampers in Madrid, for companies | Corredera",
    descriptionEs: "Lotes de Navidad a medida con jamón ibérico, embutidos, quesos y aceites para regalar o para empresas. Encárgalos en Corredera Gourmet, Calle de la Puebla 15, Madrid.",
    descriptionEn: "Made-to-order Christmas hampers with Iberian ham, charcuterie, cheeses and olive oils, for gifts or companies. Order at Corredera Gourmet, Calle de la Puebla 15, Madrid.",
    answerEs: "En Corredera Gourmet preparamos lotes de Navidad a medida con productos de la tienda: jamón ibérico, sobres de 100 g, embutidos, quesos y aceites. Nos dices tu presupuesto y para cuántas personas, y te confirmamos composición, precio y plazo por WhatsApp. Sirve para un regalo o para toda la empresa.",
    answerEn: "At Corredera Gourmet we make Christmas hampers to order with products from the shop: Iberian ham, 100 g packs, charcuterie, cheeses and olive oils. Tell us your budget and how many you need, and we confirm contents, price and timing on WhatsApp. It works for one gift or a whole company.",
    image: "/assets/home/hero-loncheado.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿Qué puede llevar un lote de Navidad?",
        hEn: "What can a Christmas hamper include?",
        pEs: ["Lo montamos con lo que hay en la tienda, así que puedes combinarlo a tu gusto."],
        pEn: ["We build it from what is in the shop, so you can combine it as you like."],
        listEs: ["Un jamón o una paleta entera, con corte a cuchillo gratis en los jamones enteros", "Sobres de jamón y de embutidos de 100 g envasados al vacío", "Quesos nacionales y europeos", "Aceite de oliva virgen extra, conservas y vino"],
        listEn: ["A whole ham or shoulder, with free hand-carving on whole hams", "100 g vacuum packs of ham and charcuterie", "Spanish and European cheeses", "Extra virgin olive oil, preserves and wine"],
      },
      {
        hEs: "¿Cómo encargar lotes para una empresa?",
        hEn: "How do I order hampers for a company?",
        pEs: ["Rellena el formulario de esta página: abre WhatsApp con tu pedido ya escrito. Te respondemos con una propuesta, el precio por lote y la fecha en la que podemos tenerlo listo. Si necesitas factura, indícalo al hacer el encargo."],
        pEn: ["Fill in the form on this page: it opens WhatsApp with your request already written. We reply with a proposal, the price per hamper and the date we can have it ready. If you need an invoice, say so when ordering."],
      },
      {
        hEs: "¿Cuándo conviene encargarlo?",
        hEn: "When should I order?",
        pEs: ["Cuanto antes mejor, sobre todo si son muchos lotes o llevan jamones cortados a cuchillo, porque necesitan más tiempo de preparación. Te confirmamos el plazo exacto al encargar."],
        pEn: ["The sooner the better, especially for many hampers or those with hand-carved hams, which take longer to prepare. We confirm the exact timing when you order."],
      },
    ],
    faqs: [
      {
        qEs: "¿Puedo elegir lo que lleva el lote?",
        qEn: "Can I choose what goes in the hamper?",
        aEs: "Sí. Los lotes se preparan a medida con productos de la tienda, según tu presupuesto y tus gustos.",
        aEn: "Yes. Hampers are made to order with products from the shop, according to your budget and tastes.",
      },
      {
        qEs: "¿Cuánto cuesta un lote de Navidad?",
        qEn: "How much does a Christmas hamper cost?",
        aEs: "Depende de lo que lleve. Dinos tu presupuesto por lote y te proponemos una composición con su precio por WhatsApp, sin compromiso.",
        aEn: "It depends on the contents. Tell us your budget per hamper and we will propose a selection with its price on WhatsApp, with no obligation.",
      },
      {
        qEs: "¿Dónde se recogen los lotes?",
        qEn: "Where do I collect the hampers?",
        aEs: "En la tienda de Calle de la Puebla, 15, Madrid. Si necesitas entrega, pregúntanos por WhatsApp y te confirmamos las condiciones.",
        aEn: "At the shop on Calle de la Puebla, 15, Madrid. If you need delivery, ask us on WhatsApp and we will confirm the terms.",
      },
    ],
    productIds: ["je1", "je2", "je5", "sj3", "sj1", "se1", "em3", "q5", "ao3"],
    productsTitleEs: "Ideas para tu lote, con su precio de hoy",
    productsTitleEn: "Ideas for your hamper, at today's prices",
    links: [
      { href: "/servicio-corte-jamon", es: "Servicio de corte de jamón", en: "Ham carving service" },
      { href: "/guia/5-jotas-vs-joselito", es: "5 Jotas o Joselito: diferencias", en: "5 Jotas or Joselito: the differences" },
      { href: "/gourmet/jamones", es: "Jamones y paletas", en: "Hams and shoulders" },
    ],
    whatsappEs: "Hola Corredera Gourmet, quisiera información sobre lotes de Navidad.",
    whatsappEn: "Hello Corredera Gourmet, I'd like information about Christmas hampers.",
    ctaEs: "Pedir mi lote por WhatsApp",
    ctaEn: "Order my hamper on WhatsApp",
    companyForm: true,
  },
  {
    path: "/servicio-corte-jamon",
    kind: "service",
    kickerEs: "Servicio exclusivo",
    kickerEn: "Exclusive service",
    titleEs: "Corte de jamón a cuchillo y envasado al vacío en Madrid",
    titleEn: "Ham hand-carving and vacuum packing in Madrid",
    seoTitleEs: "Cortar jamón a cuchillo y envasar al vacío en Madrid | Corredera",
    seoTitleEn: "Ham hand-carving and vacuum packing in Madrid | Corredera",
    descriptionEs: "Al comprar un jamón entero en Corredera Gourmet, lo cortamos a cuchillo y lo envasamos al vacío gratis. Lonchas en sobres, tacos y hueso. Calle de la Puebla 15, Madrid.",
    descriptionEn: "When you buy a whole ham at Corredera Gourmet, we hand-carve and vacuum pack it free of charge. Slices in packs, trimmings and the bone. Calle de la Puebla 15, Madrid.",
    answerEs: "En Corredera Gourmet cortamos a cuchillo y envasamos al vacío gratis los jamones enteros que compras con nosotros. Eliges la pieza, nuestro equipo la corta a mano y te la entregamos en sobres listos para servir, junto con los tacos y el hueso aprovechable. También puedes llevártela entera sin empezar.",
    answerEn: "At Corredera Gourmet we hand-carve and vacuum pack the whole hams you buy from us free of charge. You choose the piece, our team carves it by hand and we hand it over in ready-to-serve packs, along with the trimmings and the usable bone. You can also take it whole and uncut.",
    image: "/assets/home/carving-bg.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿Cómo funciona el servicio de corte?",
        hEn: "How does the carving service work?",
        listEs: ["Elige tu jamón entero en la tienda o en la web.", "Indica que lo quieres cortado a cuchillo y envasado al vacío.", "Te confirmamos por WhatsApp disponibilidad, importe y cuándo estará listo.", "Recógelo en Calle de la Puebla, 15 o pide que te lo enviemos."],
        listEn: ["Choose your whole ham in the shop or online.", "Say you want it hand-carved and vacuum packed.", "We confirm availability, amount and when it will be ready on WhatsApp.", "Collect it at Calle de la Puebla, 15 or ask us to deliver it."],
      },
      {
        hEs: "¿Qué me entregáis?",
        hEn: "What do I get?",
        pEs: ["Lonchas finas cortadas a mano y envasadas al vacío en sobres, los tacos y el hueso, que sirve para caldos. Cuántos sobres salen depende del peso de la pieza."],
        pEn: ["Thin hand-cut slices vacuum packed in packs, the trimmings and the bone, which is good for stock. How many packs you get depends on the weight of the piece."],
      },
      {
        hEs: "¿Por qué cortarlo a cuchillo?",
        hEn: "Why carve it by hand?",
        pEs: ["La loncha fina cortada a mano conserva mejor la textura y el aroma, y mezcla en cada bocado la carne con su grasa. Envasarlo al vacío te permite disfrutarlo poco a poco, sin tener el jamón empezado en casa."],
        pEn: ["A thin hand-cut slice keeps its texture and aroma better and combines meat and fat in each bite. Vacuum packing lets you enjoy it gradually, without keeping a started ham at home."],
      },
    ],
    faqs: [
      {
        qEs: "¿El corte tiene coste?",
        qEn: "Is there a charge for carving?",
        aEs: "No. El corte a cuchillo y el envasado al vacío son gratuitos al comprar cualquiera de nuestros jamones enteros.",
        aEn: "No. Hand-carving and vacuum packing are free when you buy any of our whole hams.",
      },
      {
        qEs: "¿Puedo llevarme el jamón entero sin cortar?",
        qEn: "Can I take the ham whole and uncut?",
        aEs: "Sí. Al encargarlo puedes elegir entre cortado y envasado, o la pieza entera sin empezar.",
        aEn: "Yes. When ordering, you can choose carved and packed, or the whole uncut piece.",
      },
      {
        qEs: "¿Cuántos sobres salen de un jamón?",
        qEn: "How many packs does a ham give?",
        aEs: "Depende del peso y de la pieza. Puedes ver una estimación general en nuestra guía y te lo confirmamos al encargarlo.",
        aEn: "It depends on the weight and the piece. There is a general estimate in our guide, and we confirm it when you order.",
      },
    ],
    productIds: ["je1", "je2", "je3", "je4", "je5"],
    productsTitleEs: "Jamones enteros con corte gratis",
    productsTitleEn: "Whole hams with free carving",
    links: [
      { href: "/guia/cuantos-sobres-salen-de-un-jamon", es: "Cuántos sobres salen de un jamón", en: "How many packs a ham gives" },
      { href: "/guia/conservar-jamon-envasado-al-vacio", es: "Cómo conservar el jamón envasado", en: "How to store vacuum-packed ham" },
      { href: "/gourmet/jamones", es: "Jamones y paletas", en: "Hams and shoulders" },
    ],
    whatsappEs: "Hola Corredera Gourmet, quisiera información sobre el servicio de corte de jamón.",
    whatsappEn: "Hello Corredera Gourmet, I'd like information about the ham carving service.",
    ctaEs: "Consultar por WhatsApp",
    ctaEn: "Ask on WhatsApp",
  },
  {
    path: "/guia/5-jotas-vs-joselito",
    kind: "guide",
    kickerEs: "Guía Corredera",
    kickerEn: "Corredera guide",
    titleEs: "5 Jotas o Joselito: diferencias entre los dos jamones",
    titleEn: "5 Jotas or Joselito: the differences between the two hams",
    seoTitleEs: "5 Jotas vs Joselito: diferencias y cuál elegir | Corredera",
    seoTitleEn: "5 Jotas vs Joselito: differences and how to choose | Corredera",
    descriptionEs: "5 Jotas se elabora en Jabugo (Huelva) y Joselito en Guijuelo (Salamanca). Qué cambia entre estas dos casas de jamón ibérico y cómo elegir. Guía de Corredera Gourmet, Madrid.",
    descriptionEn: "5 Jotas is made in Jabugo (Huelva) and Joselito in Guijuelo (Salamanca). What differs between these two Iberian ham houses and how to choose. A Corredera Gourmet guide.",
    answerEs: "La diferencia más clara entre 5 Jotas y Joselito es su origen: 5 Jotas se elabora en Jabugo (Huelva) y Joselito en Guijuelo (Salamanca), dos zonas jamoneras con clima y tradición distintos. Son dos grandes casas de jamón ibérico, y elegir entre ellas es sobre todo cuestión de gusto: lo mejor es probar ambas.",
    answerEn: "The clearest difference between 5 Jotas and Joselito is their origin: 5 Jotas is made in Jabugo (Huelva) and Joselito in Guijuelo (Salamanca), two ham regions with different climates and traditions. They are two great Iberian ham houses, and choosing between them is mostly a matter of taste: the best way is to try both.",
    image: "/assets/home/hero-jamon.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿En qué se diferencian 5 Jotas y Joselito?",
        hEn: "How do 5 Jotas and Joselito differ?",
        table: {
          headEs: ["", "5 Jotas", "Joselito"],
          headEn: ["", "5 Jotas", "Joselito"],
          rowsEs: [
            ["Dónde se elabora", "Jabugo (Huelva)", "Guijuelo (Salamanca)"],
            ["Trayectoria", "Desde 1879", "Desde 1868"],
            ["Disponible en Corredera", "Pieza entera y sobre de 100 g", "Pieza entera y sobres de 100 g"],
          ],
          rowsEn: [
            ["Where it is made", "Jabugo (Huelva)", "Guijuelo (Salamanca)"],
            ["History", "Since 1879", "Since 1868"],
            ["Available at Corredera", "Whole piece and 100 g pack", "Whole piece and 100 g packs"],
          ],
        },
      },
      {
        hEs: "¿Cuál elegir?",
        hEn: "Which should I choose?",
        pEs: ["No hay uno mejor para todo el mundo. Si es tu primera vez con estas marcas, empieza por un sobre de 100 g de cada una y compáralos en la misma mesa. Si es para regalar, ten en cuenta el precio de la pieza y a quién va dirigido: te ayudamos a decidir en la tienda o por WhatsApp."],
        pEn: ["Neither is best for everyone. If you are new to these brands, start with a 100 g pack of each and compare them at the same table. If it is a gift, consider the price of the piece and who it is for: we can help you decide in the shop or on WhatsApp."],
      },
    ],
    faqs: [
      {
        qEs: "¿Dónde comprar jamón 5 Jotas y Joselito en Madrid?",
        qEn: "Where can I buy 5 Jotas and Joselito ham in Madrid?",
        aEs: "En Corredera Gourmet, Calle de la Puebla 15, entre Gran Vía y Malasaña. Tenemos piezas enteras, con corte a cuchillo gratis, y sobres de 100 g.",
        aEn: "At Corredera Gourmet, Calle de la Puebla 15, between Gran Vía and Malasaña. We have whole pieces, with free hand-carving, and 100 g packs.",
      },
      {
        qEs: "¿Puedo probarlos antes de comprar una pieza entera?",
        qEn: "Can I try them before buying a whole piece?",
        aEs: "Puedes empezar por los sobres de 100 g de cada marca, una forma sencilla de compararlos antes de decidirte por una pieza.",
        aEn: "You can start with the 100 g packs of each brand, a simple way to compare them before choosing a whole piece.",
      },
    ],
    productIds: ["je1", "je2", "sj3", "sj1", "sj2"],
    productsTitleEs: "5 Jotas y Joselito en Corredera, con precio",
    productsTitleEn: "5 Jotas and Joselito at Corredera, with prices",
    links: [
      { href: "/guia/jamon-iberico", es: "Guía para comprar jamón ibérico", en: "Guide to buying Iberian ham" },
      { href: "/servicio-corte-jamon", es: "Servicio de corte de jamón", en: "Ham carving service" },
    ],
    whatsappEs: "Hola Corredera Gourmet, quisiera consejo para elegir entre 5 Jotas y Joselito.",
    whatsappEn: "Hello Corredera Gourmet, I'd like advice on choosing between 5 Jotas and Joselito.",
    ctaEs: "Pedir consejo por WhatsApp",
    ctaEn: "Ask for advice on WhatsApp",
  },
  {
    path: "/guia/conservar-jamon-envasado-al-vacio",
    kind: "guide",
    kickerEs: "Guía Corredera",
    kickerEn: "Corredera guide",
    titleEs: "¿Cuánto dura el jamón envasado al vacío y cómo conservarlo?",
    titleEn: "How long does vacuum-packed ham last and how do I store it?",
    seoTitleEs: "Cuánto dura el jamón envasado al vacío y cómo conservarlo | Corredera",
    seoTitleEn: "How long vacuum-packed ham lasts and how to store it | Corredera",
    descriptionEs: "El jamón envasado al vacío dura hasta la fecha que indica el envase si se guarda en la nevera sin abrir. Cómo conservarlo y servirlo. Guía de Corredera Gourmet, Madrid.",
    descriptionEn: "Vacuum-packed ham lasts until the date on the pack if kept unopened in the fridge. How to store and serve it. A guide by Corredera Gourmet, Madrid.",
    answerEs: "El jamón envasado al vacío se conserva hasta la fecha que indica el envase, normalmente durante meses, siempre que esté en la nevera y sin abrir. Sácalo unos 15 minutos antes de servir para que la grasa recupere el brillo y el aroma. Una vez abierto, lo mejor es consumirlo cuanto antes.",
    answerEn: "Vacuum-packed ham keeps until the date on the pack, usually for months, as long as it stays in the fridge and unopened. Take it out about 15 minutes before serving so the fat regains its shine and aroma. Once open, it is best eaten soon.",
    image: "/assets/home/hero-loncheado.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿Dónde se guarda?",
        hEn: "Where should I keep it?",
        pEs: ["En la nevera, en posición plana y sin que el envase se pinche. Revisa la fecha de cada sobre y consume primero los más antiguos."],
        pEn: ["In the fridge, lying flat and without puncturing the pack. Check the date on each pack and eat the oldest first."],
      },
      {
        hEs: "¿Cómo se sirve para que sepa mejor?",
        hEn: "How do I serve it so it tastes best?",
        listEs: ["Saca el sobre de la nevera unos 15 minutos antes.", "Ábrelo y separa las lonchas con cuidado.", "Sírvelo en un plato a temperatura ambiente, no sobre una fuente fría."],
        listEn: ["Take the pack out of the fridge about 15 minutes before.", "Open it and separate the slices carefully.", "Serve it at room temperature on a plate that is not cold."],
      },
      {
        hEs: "¿Y si he abierto el sobre?",
        hEn: "What if I have opened the pack?",
        pEs: ["Tápalo bien, guárdalo en la nevera y consúmelo cuanto antes, porque va perdiendo aroma y textura."],
        pEn: ["Cover it well, keep it in the fridge and eat it soon, as it gradually loses aroma and texture."],
      },
    ],
    faqs: [
      {
        qEs: "¿Se puede congelar el jamón envasado al vacío?",
        qEn: "Can vacuum-packed ham be frozen?",
        aEs: "No lo recomendamos: al descongelarlo pierde textura y aroma. Si lo guardas bien en la nevera, no suele hacer falta.",
        aEn: "We do not recommend it: thawing costs it texture and aroma. Stored properly in the fridge, there is usually no need.",
      },
      {
        qEs: "¿Es normal que las lonchas tengan la grasa blanca al sacarlas?",
        qEn: "Is it normal for the fat to look white when I take the slices out?",
        aEs: "Sí, por el frío de la nevera. A temperatura ambiente la grasa vuelve a ponerse brillante.",
        aEn: "Yes, because of the cold of the fridge. At room temperature the fat turns shiny again.",
      },
    ],
    productIds: ["sj3", "sj1", "sj4", "sj8"],
    productsTitleEs: "Sobres de jamón de 100 g, con precio",
    productsTitleEn: "100 g ham packs, with prices",
    links: [
      { href: "/servicio-corte-jamon", es: "Servicio de corte de jamón", en: "Ham carving service" },
      { href: "/gourmet/sobres-jamon", es: "Todos los sobres de jamón", en: "All ham packs" },
    ],
    whatsappEs: "Hola Corredera Gourmet, tengo una duda sobre cómo conservar el jamón.",
    whatsappEn: "Hello Corredera Gourmet, I have a question about storing ham.",
    ctaEs: "Preguntar por WhatsApp",
    ctaEn: "Ask on WhatsApp",
  },
  {
    path: "/guia/cuantos-sobres-salen-de-un-jamon",
    kind: "guide",
    kickerEs: "Guía Corredera",
    kickerEn: "Corredera guide",
    titleEs: "¿Cuántos sobres de 100 g salen de un jamón entero?",
    titleEn: "How many 100 g packs does a whole ham give?",
    seoTitleEs: "Cuántos sobres de 100 g salen de un jamón entero | Corredera",
    seoTitleEn: "How many 100 g packs a whole ham gives | Corredera",
    descriptionEs: "Como estimación general, de un jamón de 8 kg salen unos 3,5 a 4 kg de jamón cortado: entre 35 y 40 sobres de 100 g. Te lo explicamos en esta guía de Corredera Gourmet.",
    descriptionEn: "As a general estimate, an 8 kg ham gives about 3.5 to 4 kg of carved ham: 35 to 40 packs of 100 g. We explain it in this Corredera Gourmet guide.",
    answerEs: "Como estimación general, algo menos de la mitad del peso de un jamón acaba en lonchas. De una pieza de 8 kg salen unos 3,5 a 4 kg de jamón cortado, es decir, entre 35 y 40 sobres de 100 g. La cifra real depende de la pieza, y el resto son hueso, corteza y grasa.",
    answerEn: "As a general estimate, a little under half of a ham's weight ends up as slices. An 8 kg piece gives about 3.5 to 4 kg of carved ham, or 35 to 40 packs of 100 g. The real figure depends on the piece, and the rest is bone, rind and fat.",
    image: "/assets/home/carving-bg.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿Cómo se calcula?",
        hEn: "How is it worked out?",
        pEs: ["Toma el peso de la pieza y calcula algo menos de la mitad para saber cuánto jamón cortado obtendrás; después divide entre el tamaño del sobre. Es una orientación general, no un compromiso de cantidad."],
        pEn: ["Take the weight of the piece and work out a little under half to see how much carved ham you get, then divide by the pack size. It is general guidance, not a guaranteed amount."],
        table: {
          headEs: ["Peso de la pieza", "Jamón cortado aproximado", "Sobres de 100 g aproximados"],
          headEn: ["Weight of the piece", "Approx. carved ham", "Approx. 100 g packs"],
          rowsEs: [
            ["7 kg", "3 a 3,5 kg", "30 a 35"],
            ["8 kg", "3,5 a 4 kg", "35 a 40"],
          ],
          rowsEn: [
            ["7 kg", "3 to 3.5 kg", "30 to 35"],
            ["8 kg", "3.5 to 4 kg", "35 to 40"],
          ],
        },
      },
      {
        hEs: "¿Qué pasa con el hueso y los tacos?",
        hEn: "What happens to the bone and trimmings?",
        pEs: ["Cuando cortamos un jamón en la tienda, te entregamos también los tacos y el hueso aprovechable, que sirve para caldos y guisos."],
        pEn: ["When we carve a ham in the shop, we also give you the trimmings and the usable bone, which is good for stock and stews."],
      },
    ],
    faqs: [
      {
        qEs: "¿Me decís cuántos sobres saldrán de mi jamón?",
        qEn: "Can you tell me how many packs my ham will give?",
        aEs: "Sí. Al encargarlo, pregúntanos por WhatsApp y te orientamos según el peso de la pieza que elijas.",
        aEn: "Yes. When ordering, ask us on WhatsApp and we will advise you according to the weight of the piece you choose.",
      },
    ],
    productIds: ["je1", "je2", "je3", "je4", "je5"],
    productsTitleEs: "Jamones enteros, con precio",
    productsTitleEn: "Whole hams, with prices",
    links: [
      { href: "/servicio-corte-jamon", es: "Servicio de corte de jamón", en: "Ham carving service" },
      { href: "/guia/conservar-jamon-envasado-al-vacio", es: "Cómo conservar el jamón envasado", en: "How to store vacuum-packed ham" },
    ],
    whatsappEs: "Hola Corredera Gourmet, ¿cuántos sobres saldrían de un jamón entero?",
    whatsappEn: "Hello Corredera Gourmet, how many packs would a whole ham give?",
    ctaEs: "Preguntar por WhatsApp",
    ctaEn: "Ask on WhatsApp",
  },
  {
    path: "/guia/jamon-o-paleta-iberica",
    kind: "guide",
    kickerEs: "Guía Corredera",
    kickerEn: "Corredera guide",
    titleEs: "Jamón o paleta ibérica: cuál comprar",
    titleEn: "Iberian ham or shoulder: which to buy",
    seoTitleEs: "Jamón o paleta ibérica: diferencias y cuál comprar | Corredera",
    seoTitleEn: "Iberian ham or shoulder: differences and which to buy | Corredera",
    descriptionEs: "El jamón es la pata trasera y la paleta, la delantera: más pequeña, de sabor más intenso y precio total menor. Te ayudamos a elegir. Guía de Corredera Gourmet, Madrid.",
    descriptionEn: "Ham is the hind leg and shoulder is the front leg: smaller, more intense and cheaper overall. We help you choose. A guide by Corredera Gourmet, Madrid.",
    answerEs: "El jamón es la pata trasera del cerdo y la paleta, la delantera. Compra jamón si buscas más lonchas y una pieza para muchas ocasiones; compra paleta si prefieres una pieza más pequeña, con un sabor más intenso y un precio total menor. Dentro de cada una, la alimentación y la raza marcan la calidad.",
    answerEn: "Ham is the pig's hind leg and shoulder (paleta) is the front leg. Buy ham if you want more slices and a piece for many occasions; buy shoulder if you prefer a smaller piece with a more intense flavour and a lower total price. Within each, diet and breed set the quality.",
    image: "/assets/home/hero-jamon.jpg",
    published: DATE,
    updated: DATE,
    sections: [
      {
        hEs: "¿Qué diferencias hay entre jamón y paleta?",
        hEn: "What are the differences between ham and shoulder?",
        table: {
          headEs: ["", "Jamón", "Paleta"],
          headEn: ["", "Ham", "Shoulder"],
          rowsEs: [
            ["Parte del cerdo", "Pata trasera", "Pata delantera"],
            ["Tamaño", "Mayor", "Menor"],
            ["Rendimiento", "Más lonchas", "Menos carne"],
            ["Sabor", "Más equilibrado", "Más intenso"],
            ["Precio total", "Mayor", "Menor"],
          ],
          rowsEn: [
            ["Part of the pig", "Hind leg", "Front leg"],
            ["Size", "Larger", "Smaller"],
            ["Yield", "More slices", "Less meat"],
            ["Flavour", "More balanced", "More intense"],
            ["Total price", "Higher", "Lower"],
          ],
        },
      },
      {
        hEs: "¿Cuál me conviene?",
        hEn: "Which suits me?",
        listEs: ["Para una familia o muchas reuniones: mejor un jamón.", "Para pocas personas o un primer ibérico en casa: una paleta.", "Para regalar sin tener una pieza empezada: un jamón cortado y envasado, o sobres de 100 g."],
        listEn: ["For a family or many gatherings: a ham is better.", "For a few people or a first Iberian at home: a shoulder.", "For a gift without a started piece: a carved and packed ham, or 100 g packs."],
      },
    ],
    faqs: [
      {
        qEs: "¿La paleta es peor que el jamón?",
        qEn: "Is shoulder worse than ham?",
        aEs: "No, es diferente: más pequeña y de sabor más intenso. La calidad depende de la alimentación y la raza, no solo de la pata.",
        aEn: "No, it is different: smaller and more intense. Quality depends on diet and breed, not just on the leg.",
      },
    ],
    productIds: ["je5", "je3", "je4", "je6", "je7"],
    productsTitleEs: "Jamones y paletas en Corredera, con precio",
    productsTitleEn: "Hams and shoulders at Corredera, with prices",
    links: [
      { href: "/guia/jamon-iberico", es: "Guía para comprar jamón ibérico", en: "Guide to buying Iberian ham" },
      { href: "/gourmet/jamones", es: "Jamones y paletas", en: "Hams and shoulders" },
    ],
    whatsappEs: "Hola Corredera Gourmet, quisiera consejo para elegir entre jamón y paleta.",
    whatsappEn: "Hello Corredera Gourmet, I'd like advice on choosing between ham and shoulder.",
    ctaEs: "Pedir consejo por WhatsApp",
    ctaEn: "Ask for advice on WhatsApp",
  },
];

export const CONTENT_PATHS = new Set(CONTENT_PAGES.map((p) => p.path));

export function getContentPage(path: string) {
  return CONTENT_PAGES.find((p) => p.path === path);
}
