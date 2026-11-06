/** Buying guide answered in plain questions, so shoppers, search engines and AI assistants can quote it directly. */
export type GuideEntry = { qEs: string; qEn: string; aEs: string; aEn: string };

export const GUIDE_PATH = "/guia/jamon-iberico";

export const GUIDE = {
  titleEs: "Guía para comprar jamón ibérico",
  titleEn: "Guide to buying Iberian ham",
  seoTitleEs: "Cómo elegir jamón ibérico: bellota, cebo y precintos | Corredera",
  seoTitleEn: "How to choose Iberian ham: acorn-fed, cebo and tags | Corredera",
  descriptionEs: "Diferencia entre jamón y paleta, qué significa cada precinto, bellota o cebo de campo, cómo conservarlo y dónde comprarlo en Madrid. Guía de Corredera Gourmet.",
  descriptionEn: "Ham or shoulder, what each coloured tag means, acorn-fed or free-range, how to store it and where to buy it in Madrid. A guide by Corredera Gourmet.",
  introEs: "Lo que preguntan cada día nuestros clientes en la tienda de Calle de la Puebla, 15, explicado de forma sencilla.",
  introEn: "What our customers ask every day at our shop on Calle de la Puebla, 15, explained simply.",
};

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    qEs: "¿Qué diferencia hay entre jamón y paleta?",
    qEn: "What is the difference between ham and shoulder (paleta)?",
    aEs: "El jamón es la pata trasera del cerdo y la paleta, la delantera. La paleta es más pequeña, tiene menos carne y un sabor más intenso, y su precio total es menor. El jamón es más grande y rinde más lonchas.",
    aEn: "Ham is the pig's hind leg and paleta is the front leg. A shoulder is smaller, has less meat and a more intense flavour, and costs less overall. A ham is bigger and gives more slices.",
  },
  {
    qEs: "¿Qué significa el color del precinto del jamón ibérico?",
    qEn: "What does the colour of the Iberian ham tag mean?",
    aEs: "La norma de calidad del ibérico (Real Decreto 4/2014) fija cuatro colores: negro, de bellota 100 % ibérico; rojo, de bellota ibérico (cerdo cruzado); verde, de cebo de campo ibérico; y blanco, de cebo ibérico.",
    aEn: "Spain's Iberian quality standard (Royal Decree 4/2014) sets four colours: black, 100% Iberian acorn-fed; red, Iberian acorn-fed (crossbred); green, free-range Iberian (cebo de campo); and white, Iberian cebo.",
  },
  {
    qEs: "¿Qué es mejor, jamón de bellota o de cebo de campo?",
    qEn: "Which is better, acorn-fed or free-range (cebo de campo) ham?",
    aEs: "El de bellota procede de cerdos que engordan en la dehesa comiendo bellota y pasto: es más aromático, con grasa más untuosa y un precio más alto. El de cebo de campo combina pienso y campo: tiene un sabor equilibrado y es una compra excelente para el día a día.",
    aEn: "Acorn-fed ham comes from pigs fattened in the dehesa on acorns and pasture: more aromatic, with silkier fat and a higher price. Cebo de campo combines feed and pasture: a balanced flavour and an excellent everyday choice.",
  },
  {
    qEs: "¿Cuánta carne sale de un jamón entero?",
    qEn: "How much meat does a whole ham give?",
    aEs: "Como orientación, algo menos de la mitad del peso de la pieza acaba en lonchas: de un jamón de 8 kg salen unos 3,5 a 4 kg de jamón cortado. El resto son hueso, corteza y grasa, que sirven para caldos.",
    aEn: "As a guide, a little under half of the piece's weight ends up as slices: an 8 kg ham gives about 3.5 to 4 kg of carved ham. The rest is bone, rind and fat, which are good for stock.",
  },
  {
    qEs: "¿Cómo se conserva un jamón entero y los sobres loncheados?",
    qEn: "How do I store a whole ham and sliced packs?",
    aEs: "El jamón entero, en un lugar fresco y seco, cubriendo el corte con su propia grasa y un paño de algodón. Los sobres envasados al vacío van a la nevera y conviene abrirlos unos 15 minutos antes de servir para que la grasa recupere el brillo y el aroma.",
    aEn: "Keep a whole ham somewhere cool and dry, covering the cut with its own fat and a cotton cloth. Vacuum packs go in the fridge and are best opened about 15 minutes before serving, so the fat regains its shine and aroma.",
  },
  {
    qEs: "¿Me podéis cortar el jamón?",
    qEn: "Can you carve the ham for me?",
    aEs: "Sí. En Corredera Gourmet cortamos a cuchillo y envasamos al vacío los jamones enteros de forma gratuita. Puedes llevártelo en sobres listos para servir o en la pieza entera sin empezar.",
    aEn: "Yes. At Corredera Gourmet we hand-carve and vacuum pack whole hams free of charge. Take it in ready-to-serve packs or as a whole uncut piece.",
  },
  {
    qEs: "¿Dónde comprar jamón ibérico en el centro de Madrid?",
    qEn: "Where can I buy Iberian ham in central Madrid?",
    aEs: "En Corredera Gourmet, Calle de la Puebla 15, entre Gran Vía y Malasaña. Tenemos jamones 5 Jotas, Joselito, Dehesa de Extremadura, Guijuelo y cebo de campo, además de paletas. Puedes encargarlo en la web y recogerlo en tienda o recibirlo en casa.",
    aEn: "At Corredera Gourmet, Calle de la Puebla 15, between Gran Vía and Malasaña. We stock 5 Jotas, Joselito, Dehesa de Extremadura, Guijuelo and cebo de campo hams, plus shoulders. Order online and pick up in store or have it delivered.",
  },
];
