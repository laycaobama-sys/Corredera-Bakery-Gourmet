import type { MenuItem } from "./catalog";
import { GUIDE_PATH } from "./guideJamon";

/**
 * Serving and storage notes for a product sheet. They describe the product family in general terms:
 * nothing here states an origin, breed, curing time or weight the catalog does not give.
 */
export type ProductNotes = {
  serveEs: string;
  serveEn: string;
  keepEs: string;
  keepEn: string;
  links: { href: string; es: string; en: string }[];
};

const CARVING = { href: "/servicio-corte-jamon", es: "Servicio de corte de jamón", en: "Ham carving service" };
const HAM_GUIDE = { href: GUIDE_PATH, es: "Guía para comprar jamón ibérico", en: "Guide to buying Iberian ham" };
const STORAGE = { href: "/guia/conservar-jamon-envasado-al-vacio", es: "Cómo conservar el jamón envasado", en: "How to store vacuum-packed ham" };

export function productNotes(item: MenuItem): ProductNotes | null {
  switch (item.category) {
    case "jamones_enteros":
      return {
        serveEs: "A temperatura ambiente y en lonchas finas. Si lo eliges cortado, lo recibes en sobres listos para abrir y servir.",
        serveEn: "At room temperature, in thin slices. If you choose it carved, it comes in packs ready to open and serve.",
        keepEs: "La pieza entera, en un lugar fresco y seco, cubriendo el corte con su propia grasa y un paño de algodón. Los sobres, en la nevera.",
        keepEn: "Keep the whole piece somewhere cool and dry, covering the cut with its own fat and a cotton cloth. Keep the packs in the fridge.",
        links: [CARVING, HAM_GUIDE, { href: "/guia/jamon-o-paleta-iberica", es: "Jamón o paleta: cuál comprar", en: "Ham or shoulder: which to buy" }],
      };
    case "sobres_jamon":
      return {
        serveEs: "Abre el sobre unos 15 minutos antes de servir para que la grasa recupere el brillo y el aroma.",
        serveEn: "Open the pack about 15 minutes before serving so the fat regains its shine and aroma.",
        keepEs: "En la nevera, sin abrir, respetando la fecha del envase. Una vez abierto, mejor consumirlo cuanto antes.",
        keepEn: "In the fridge, unopened, within the date on the pack. Once open, it is best eaten soon.",
        links: [STORAGE, HAM_GUIDE],
      };
    case "sobres_embutidos":
      return {
        serveEs: "Sácalo de la nevera unos minutos antes de servir para que recupere el aroma.",
        serveEn: "Take it out of the fridge a few minutes before serving so it regains its aroma.",
        keepEs: "En la nevera, sin abrir, respetando la fecha del envase. Una vez abierto, mejor consumirlo cuanto antes.",
        keepEn: "In the fridge, unopened, within the date on the pack. Once open, it is best eaten soon.",
        links: [{ href: "/gourmet/embutidos", es: "Embutidos ibéricos al peso", en: "Iberian charcuterie by weight" }],
      };
    case "embutidos":
      return {
        serveEs: "En lonchas finas y a temperatura ambiente, solo o con pan.",
        serveEn: "Thinly sliced at room temperature, on its own or with bread.",
        keepEs: "En un lugar fresco y seco o en la nevera bien envuelto, y a temperatura ambiente antes de servir.",
        keepEn: "Somewhere cool and dry, or well wrapped in the fridge, and back to room temperature before serving.",
        links: [{ href: "/gourmet/sobres-embutidos", es: "Sobres de embutidos de 100 g", en: "100 g charcuterie packs" }],
      };
    case "quesos":
      return {
        serveEs: "Sácalo de la nevera un rato antes de servir: a temperatura ambiente se aprecian mejor el aroma y la textura.",
        serveEn: "Take it out of the fridge a while before serving: aroma and texture come through better at room temperature.",
        keepEs: "En la nevera, bien envuelto en su papel para que no se reseque.",
        keepEn: "In the fridge, well wrapped in its paper so it does not dry out.",
        links: [{ href: "/gourmet/quesos", es: "Todos los quesos", en: "All cheeses" }],
      };
    case "aceites":
      return {
        serveEs: "En crudo luce más: sobre pan, ensaladas o para terminar un plato.",
        serveEn: "It shines when raw: on bread, in salads or to finish a dish.",
        keepEs: "Bien cerrado, en un lugar fresco y protegido de la luz.",
        keepEn: "Tightly closed, somewhere cool and away from light.",
        links: [{ href: "/gourmet/aceites", es: "Todos los aceites", en: "All olive oils" }],
      };
    case "carniceria":
      return {
        serveEs: "Dinos cómo la vas a cocinar y te la cortamos al momento a tu gusto.",
        serveEn: "Tell us how you plan to cook it and we will cut it to order.",
        keepEs: "En la nevera y consumir pronto. Si no la vas a usar enseguida, pregúntanos por el envasado al vacío.",
        keepEn: "In the fridge, to be eaten soon. If you will not use it right away, ask us about vacuum packing.",
        links: [{ href: "/gourmet/carniceria", es: "Toda la carnicería", en: "All butcher's products" }],
      };
    case "fruteria":
      return {
        serveEs: "Cuéntanos para cuándo la quieres y te la preparamos en su punto.",
        serveEn: "Tell us when you plan to eat it and we will pick it at the right point.",
        keepEs: "Según la fruta: la que aún debe madurar, fuera de la nevera; la ya madura, en la nevera.",
        keepEn: "It depends on the fruit: keep what still has to ripen out of the fridge, and ripe fruit in the fridge.",
        links: [{ href: "/gourmet/fruteria", es: "Toda la frutería", en: "All fruit and vegetables" }],
      };
    default:
      return null;
  }
}
