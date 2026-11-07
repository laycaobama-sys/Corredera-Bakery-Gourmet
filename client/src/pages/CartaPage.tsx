import { Info, MessageCircle, Plus } from "lucide-react";
import { useMemo } from "react";
import { BREAKFAST_POSTER_DATA, canOrderOnline, formatPrice, type Category, type MenuItem } from "../../../shared/catalog";
import { Link } from "wouter";
import { bakeryMeta } from "../../../shared/seoCopy";
import { scrollToId } from "../storefront/components/AnchorLink";
import { ProductImage } from "../storefront/components/ProductCard";
import { Breadcrumbs, StoreLayout } from "../storefront/components/StoreLayout";
import { itemDesc, itemName } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

type Group = { id: string; es: string; en: string; noteEs?: string; noteEn?: string; match: (i: MenuItem) => boolean };

const GROUPS: Group[] = [
  { id: "desayunos", es: "Desayunos y ofertas", en: "Breakfast & offers", match: (i) => i.mode === "bakery" && i.category === "desayunos" },
  { id: "cafeteria", es: "Cafetería y bebidas", en: "Coffee & drinks", match: (i) => i.mode === "bakery" && i.category === "cafeteria" },
  { id: "bolleria", es: "Panadería y bollería", en: "Bakery & pastries", match: (i) => i.mode === "bakery" && i.category === "bolleria" },
  { id: "bocadillos", es: "Bocadillos y empanadas", en: "Sandwiches & pies", match: (i) => i.mode === "bakery" && i.category === "bocadillos" },
  {
    id: "tartas",
    es: "Tartas",
    en: "Cakes",
    noteEs: "Tartas al peso en vitrina y tartas enteras por encargo con 24–48 h de antelación.",
    noteEn: "Cakes by weight in store and whole cakes to order with 24–48 h notice.",
    match: (i) => i.mode === "bakery" && i.category === "tartas",
  },
  {
    id: "packs",
    es: "Sweet & Salty Packs",
    en: "Sweet & Salty Packs",
    noteEs: "Bandejas para reuniones y oficinas: se pueden encargar online.",
    noteEn: "Trays for meetings and offices: available to order online.",
    match: (i) => i.category === "packs",
  },
  {
    id: "barra",
    es: "Barra gourmet",
    en: "Gourmet bar",
    noteEs: "Tablas, raciones y copas para degustar en nuestra barra.",
    noteEn: "Boards, portions and drinks to enjoy at our bar.",
    match: (i) =>
      (i.mode === "gourmet" && (["tablas", "raciones"] as Category[]).includes(i.category)) ||
      ["g1", "g3", "g6", "g7", "g8", "g9", "g20"].includes(i.id),
  },
];

const WHOLE_CAKE_IDS = new Set(["t10", "t11", "t12"]);

export default function CartaPage() {
  const { items, lang, addToCart, whatsappHref, track, settings } = useStore();
  const t = useT();
  const es = lang === "es";

  const meta = bakeryMeta(lang);
  usePageMeta(meta.title, meta.description);

  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: items.filter(g.match) })).filter((g) => g.items.length > 0),
    [items],
  );
  const s = settings.schedule;

  return (
    <StoreLayout trust={false}>
      <div className="cg-container">
        <Breadcrumbs items={[{ label: t("Carta Bakery & Café", "Bakery & Café menu") }]} />
      </div>

      <section className="cg-container cg-carta-hero">
        <div>
          <p className="cg-eyebrow">{t("Obrador & cafetería", "Bakery & café")}</p>
          <h1>{es ? settings.pages.cartaTitleEs : settings.pages.cartaTitleEn}</h1>
          <p>{es ? settings.pages.cartaIntroEs : settings.pages.cartaIntroEn}</p>
          <ul className="cg-carta-hours">
            <li>{es ? s.bakeryWeekdaysEs : s.bakeryWeekdaysEn}</li>
            <li>{es ? s.bakeryWeekendEs : s.bakeryWeekendEn}</li>
            <li>{es ? s.bakerySundayEs : s.bakerySundayEn}</li>
          </ul>
          <p className="cg-notice cg-notice--soft">
            <Info size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>
              {t(
                "Cafés, desayunos y bollería individual son para consumo en local. Los packs y la selección gourmet se pueden encargar online.",
                "Coffee, breakfasts and individual pastries are served in store. Packs and the gourmet selection can be ordered online.",
              )}
            </span>
          </p>
        </div>
        <figure className="cg-carta-poster">
          <img src={settings.pages.cartaPosterUrl} alt={t("Cartel de desayunos y ofertas del día", "Daily breakfast and offers poster")} loading="eager" decoding="async" />
          <figcaption>{es ? BREAKFAST_POSTER_DATA.includedDrinksEs : BREAKFAST_POSTER_DATA.includedDrinksEn}</figcaption>
        </figure>
      </section>

      <nav className="cg-carta-nav" aria-label={t("Secciones de la carta", "Menu sections")}>
        <div className="cg-container cg-chips cg-chips--scroll">
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#carta-${g.id}`}
              className="cg-chip"
              onClick={(e) => {
                e.preventDefault();
                scrollToId(`carta-${g.id}`);
              }}
            >
              {es ? g.es : g.en}
            </a>
          ))}
        </div>
      </nav>

      <div className="cg-container cg-carta">
        {groups.map((g) => (
          <section key={g.id} id={`carta-${g.id}`} className="cg-carta__group" aria-labelledby={`carta-${g.id}-title`}>
            <h2 id={`carta-${g.id}-title`}>{es ? g.es : g.en}</h2>
            {(es ? g.noteEs : g.noteEn) && <p className="cg-carta__note">{es ? g.noteEs : g.noteEn}</p>}
            <ul>
              {g.items.map((item) => (
                <li key={item.id} className="cg-carta__item">
                  <Link href={`/producto/${item.id}`} className="cg-carta__thumb" tabIndex={-1} aria-hidden="true">
                    <ProductImage item={item} sizes="96px" />
                  </Link>
                  <div className="cg-carta__row">
                    <h3>
                      <Link href={`/producto/${item.id}`}>{itemName(item, lang).replace(/^Promoción\s+/i, "")}</Link>
                    </h3>
                    <span className="cg-carta__dots" aria-hidden="true" />
                    <span className="cg-carta__price">{formatPrice(item.price, lang)}</span>
                  </div>
                  <p>{itemDesc(item, lang)}</p>
                  {canOrderOnline(item) ? (
                    <button type="button" className="cg-carta__add" onClick={() => addToCart(item.id)}>
                      <Plus size={14} aria-hidden="true" /> {t("Añadir al pedido", "Add to order")}
                    </button>
                  ) : WHOLE_CAKE_IDS.has(item.id) ? (
                    <a
                      className="cg-carta__add"
                      href={whatsappHref(
                        t(`Hola Corredera, quisiera encargar una ${item.name}.`, `Hello Corredera, I'd like to order a ${item.nameEn}.`),
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => track("whatsapp_click", item)}
                    >
                      <MessageCircle size={14} aria-hidden="true" /> {t("Encargar por WhatsApp", "Order on WhatsApp")}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="cg-note">{es ? settings.sections.allergenNoticeEs : settings.sections.allergenNoticeEn}</p>
      </div>
    </StoreLayout>
  );
}
