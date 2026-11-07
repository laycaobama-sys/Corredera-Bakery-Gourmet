import { Check, Info, MessageCircle, Package, Scissors, ShoppingBag, Store, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { canOrderOnline, type MenuItem } from "../../../shared/catalog";
import { getCategoryForProduct } from "../../../shared/gourmetRoutes";
import { productMeta } from "../../../shared/seoCopy";
import { BrandPlate, BrandSeal, handleImageError, ProductCard, QtyStepper } from "../storefront/components/ProductCard";
import { Breadcrumbs, SectionHeading, StoreLayout } from "../storefront/components/StoreLayout";
import {
  categoryLabel,
  formatLine,
  isShopItem,
  askPriceMessage,
  isAskPrice,
  isWholeHam,
  itemBadge,
  itemDesc,
  itemHoverImage,
  itemImage,
  itemName,
  priceParts,
  productHighlights,
} from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";
import NotFound from "./NotFound";

export default function ProductDetailPage({ productId }: { productId: string }) {
  const { itemById, catalogReady } = useStore();
  const item = itemById.get(productId);
  if (!item) return catalogReady ? <NotFound /> : <StoreLayout><div className="cg-container cg-pdp" aria-busy="true" /></StoreLayout>;
  return <ProductView key={item.id} item={item} />;
}

function ProductView({ item }: { item: MenuItem }) {
  const { lang, items, addToCart, setCartOpen, hamPref, setHamPref, whatsappHref, track, settings } = useStore();
  const t = useT();
  const es = lang === "es";
  const name = itemName(item, lang);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const meta = productMeta(item, lang);
  usePageMeta(meta.title, meta.description);

  const images = useMemo(() => {
    const primary = itemImage(item);
    const second = itemHoverImage(item);
    return second ? [primary, second] : [primary];
  }, [item]);
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [item.id]);
  useEffect(() => {
    track("product_view", item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const { amount, unit } = priceParts(item, lang);
  const orderable = canOrderOnline(item);
  const ham = isWholeHam(item);
  const badge = itemBadge(item, lang);
  const line = formatLine(item, lang);
  const isGourmet = item.mode === "gourmet";
  const category = isGourmet ? getCategoryForProduct(item) : null;
  const byWeight = item.price.includes("/ kg");

  const related = useMemo(() => {
    const pool = items.filter((i) => i.id !== item.id && (isGourmet ? isShopItem(i) : i.mode === item.mode));
    const same = pool.filter((i) => i.category === item.category);
    const rest = pool.filter((i) => i.category !== item.category && i.featured);
    return [...same, ...rest].slice(0, 4);
  }, [items, item, isGourmet]);

  const add = () => {
    addToCart(item.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const directMessage = es
    ? `Hola Corredera Gourmet, quisiera encargar:\n• ${qty}x ${item.name} (${item.price})${ham ? `\n• ${hamPref === "free_sliced_vacuum" ? "Cortado a cuchillo y envasado al vacío (gratis)" : "Pieza entera sin empezar"}` : ""}\n\n¿Me confirmáis disponibilidad?`
    : `Hello Corredera Gourmet, I'd like to order:\n• ${qty}x ${item.nameEn} (${item.price})${ham ? `\n• ${hamPref === "free_sliced_vacuum" ? "Hand-carved and vacuum packed (free)" : "Whole uncut piece"}` : ""}\n\nCould you confirm availability?`;

  const crumbs = isGourmet
    ? [
        { label: t("Tienda", "Shop"), href: "/tienda" },
        ...(category && category.isGourmetPrimary ? [{ label: es ? category.navLabelEs : category.navLabelEn, href: category.path }] : []),
        { label: name },
      ]
    : [{ label: t("Carta Bakery & Café", "Bakery & Café menu"), href: "/bakery-cafe" }, { label: name }];

  return (
    <StoreLayout>
      <div className="cg-container">
        <Breadcrumbs items={crumbs} />
      </div>

      <section className="cg-container cg-pdp">
        <div className="cg-pdp__gallery">
          <div className="cg-pdp__main">
            <img
              key={images[active]}
              src={images[active]}
              alt={name}
              width={1000}
              height={800}
              fetchPriority="high"
              onError={(e) => handleImageError(e, item)}
            />
            {badge && <span className="cg-card__badge">{badge}</span>}
            <span className="cg-marks cg-marks--lg">
              <BrandPlate item={item} size="lg" />
              <BrandSeal size="lg" />
            </span>
          </div>
          {images.length > 1 && (
            <div className="cg-pdp__thumbs" role="group" aria-label={t("Imágenes del producto", "Product images")}>
              {images.map((src, i) => (
                <button key={src} type="button" aria-pressed={i === active} aria-label={`${t("Imagen", "Image")} ${i + 1}`} onClick={() => setActive(i)}>
                  <img src={src} alt="" loading="lazy" onError={(e) => handleImageError(e, item)} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cg-pdp__info">
          <p className="cg-eyebrow">{categoryLabel(item, lang)}</p>
          <h1 className="cg-pdp__title">{name}</h1>
          {line && <p className="cg-pdp__line">{line}</p>}
          <p className="cg-pdp__price">
            {amount} {unit && <small>{unit}</small>}
          </p>
          {item.refPricePerKg && (
            <p className="cg-pdp__ref">
              {t("Precio de referencia", "Reference price")}: {item.refPricePerKg}
            </p>
          )}
          <p className="cg-pdp__desc">{itemDesc(item, lang)}</p>

          {isAskPrice(item) ? (
            <>
              <p className="cg-notice cg-notice--soft">
                <Info size={18} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  {t(
                    "Te confirmamos el precio del día y la disponibilidad al momento por WhatsApp, sin compromiso.",
                    "We confirm today's price and availability straight away on WhatsApp, with no obligation.",
                  )}
                </span>
              </p>
              <a
                className="cg-btn cg-btn--wa cg-btn--block"
                href={whatsappHref(askPriceMessage(item, lang))}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("whatsapp_click", item)}
              >
                <MessageCircle size={18} aria-hidden="true" /> {t("Consultar precio por WhatsApp", "Ask for the price on WhatsApp")}
              </a>
            </>
          ) : orderable ? (
            <>
              {ham && (
                <fieldset className="cg-options">
                  <legend>{t("¿Cómo quieres tu jamón?", "How would you like your ham?")}</legend>
                  <div className="cg-options__pills">
                    <button type="button" aria-pressed={hamPref === "free_sliced_vacuum"} onClick={() => setHamPref("free_sliced_vacuum")}>
                      {t("Cortado a cuchillo y envasado al vacío", "Hand-carved & vacuum packed")}
                      <span>{t("Gratis", "Free")}</span>
                    </button>
                    <button type="button" aria-pressed={hamPref === "whole_piece"} onClick={() => setHamPref("whole_piece")}>
                      {t("Pieza entera", "Whole piece")}
                    </button>
                  </div>
                </fieldset>
              )}
              {byWeight && (
                <p className="cg-notice cg-notice--soft">
                  <Info size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {t(
                      "Producto al peso: indícanos en las notas la cantidad aproximada (p. ej. 250 g) y te confirmamos el importe exacto.",
                      "Sold by weight: tell us the approximate amount in the notes (e.g. 250 g) and we will confirm the exact price.",
                    )}
                  </span>
                </p>
              )}
              <div className="cg-pdp__buy">
                <QtyStepper value={qty} onChange={setQty} label={t("Cantidad", "Quantity")} />
                <button type="button" className="cg-btn cg-btn--primary cg-btn--grow" onClick={add}>
                  {added ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
                  {added ? t("Añadido al pedido", "Added to order") : t("Añadir al pedido", "Add to order")}
                </button>
              </div>
              {added && (
                <button type="button" className="cg-link-arrow cg-pdp__view" onClick={() => setCartOpen(true)}>
                  {t("Ver pedido y finalizar", "View order and checkout")}
                </button>
              )}
              <a
                className="cg-btn cg-btn--wa-outline cg-btn--block"
                href={whatsappHref(directMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("whatsapp_click", item)}
              >
                <MessageCircle size={18} aria-hidden="true" /> {t("Pedir directamente por WhatsApp", "Order directly on WhatsApp")}
              </a>
            </>
          ) : (
            <div className="cg-notice cg-notice--soft">
              <Store size={18} strokeWidth={1.5} aria-hidden="true" />
              <span>
                {t("Disponible para tomar en nuestro local de ", "Available to enjoy at our shop on ")}
                {settings.contact.addressLine}.{" "}
                <Link href="/bakery-cafe" className="cg-inline-link">
                  {t("Ver la carta completa", "See the full menu")}
                </Link>
              </span>
            </div>
          )}

          <ul className="cg-pdp__highlights">
            {productHighlights(item, lang).map((h, i) => {
              const Icon = [Scissors, Package, Truck][i] ?? Check;
              return (
                <li key={h}>
                  <Icon size={20} strokeWidth={1.25} aria-hidden="true" />
                  <span>{h}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="cg-section cg-section--cream">
        <div className="cg-container cg-container--narrow">
          <div className="cg-faq">
            <details open>
              <summary>{t("Descripción", "Description")}</summary>
              <p>{itemDesc(item, lang)}</p>
              {(es ? item.provisionalFormatNote : item.provisionalFormatNoteEn) && <p>{es ? item.provisionalFormatNote : item.provisionalFormatNoteEn}</p>}
            </details>
            <details>
              <summary>{t("Formato y precio", "Format and price")}</summary>
              <ul className="cg-specs">
                <li>
                  <span>{t("Precio", "Price")}</span>
                  <strong>
                    {amount} {unit}
                  </strong>
                </li>
                {line && (
                  <li>
                    <span>{t("Formato", "Format")}</span>
                    <strong>{line}</strong>
                  </li>
                )}
                {item.refPricePerKg && (
                  <li>
                    <span>{t("Precio por kilo", "Price per kilo")}</span>
                    <strong>{item.refPricePerKg}</strong>
                  </li>
                )}
                <li>
                  <span>{t("Impuestos", "Taxes")}</span>
                  <strong>{t("IVA incluido", "VAT included")}</strong>
                </li>
              </ul>
            </details>
            <details>
              <summary>{t("Recogida y envío", "Pickup and delivery")}</summary>
              <p>
                {t("Recogida en tienda", "Store pickup")}: {settings.contact.addressLine} ({es ? settings.schedule.gourmetHoursEs : settings.schedule.gourmetHoursEn}).
              </p>
              <p>{es ? settings.contact.shippingNoticeEs : settings.contact.shippingNoticeEn}</p>
            </details>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="cg-section">
          <div className="cg-container">
            <SectionHeading title={t("Quizás también te interese", "You may also like")} />
            <div className="cg-grid cg-grid--4">
              {related.map((r) => (
                <ProductCard key={r.id} item={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
