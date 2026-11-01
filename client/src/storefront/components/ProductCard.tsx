import { Check, Minus, Plus } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { Link } from "wouter";
import { canOrderOnline, type MenuItem } from "../../../../shared/catalog";
import { buildProductDataUri } from "../../../../shared/productVisuals";
import { formatLine, itemBadge, itemImage, itemName, priceParts } from "../data";
import { useT } from "../hooks";
import { useStore } from "../StoreContext";

export function handleImageError(event: SyntheticEvent<HTMLImageElement>, item: MenuItem) {
  const target = event.currentTarget;
  if (target.dataset.fallback === "1") return;
  target.dataset.fallback = "1";
  target.src = buildProductDataUri(item);
}

export function ProductImage({
  item,
  className,
  eager = false,
  sizes,
}: {
  item: MenuItem;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const { lang } = useStore();
  const src = itemImage(item);
  // Bundled product photos ship a 480px variant for grids; uploaded photos are used as they are.
  const srcSet = /^\/assets\/products\/[A-Za-z0-9_-]+\.jpg$/.test(src) ? `${src.replace(/\.jpg$/, "-480.jpg")} 480w, ${src} 1000w` : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? "(max-width: 720px) 50vw, 300px") : undefined}
      alt={itemName(item, lang)}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={800}
      height={640}
      onError={(e) => handleImageError(e, item)}
    />
  );
}

/** Corredera Gourmet seal shown on every product photo, including ones the owner uploads later. */
export function BrandSeal({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`cg-seal cg-seal--${size}`} aria-hidden="true">
      <img src="/assets/brand/corredera-emblem.png" alt="" width={371} height={439} loading="lazy" />
      <span>
        <strong>Corredera</strong>
        <small>Gourmet</small>
      </span>
    </span>
  );
}

export function QtyStepper({
  value,
  onChange,
  label,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
}) {
  const t = useT();
  return (
    <div className="cg-qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={t("Restar uno", "Decrease")} disabled={value <= min}>
        <Minus size={14} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} aria-label={t("Sumar uno", "Increase")}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export function ProductCard({ item, eager = false }: { item: MenuItem; eager?: boolean }) {
  const { lang, addToCart, setCartOpen } = useStore();
  const t = useT();
  const [added, setAdded] = useState(false);
  const { amount, unit } = priceParts(item, lang);
  const badge = itemBadge(item, lang);
  const line = formatLine(item, lang);
  const href = `/producto/${item.id}`;
  const orderable = canOrderOnline(item);

  const add = () => {
    addToCart(item.id, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="cg-card">
      <Link href={href} className="cg-card__media" aria-label={itemName(item, lang)}>
        <ProductImage item={item} eager={eager} sizes="(max-width: 720px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        {badge && <span className="cg-card__badge">{badge}</span>}
        <BrandSeal />
      </Link>
      <div className="cg-card__body">
        <h3 className="cg-card__title">
          <Link href={href}>{itemName(item, lang)}</Link>
        </h3>
        {line && <p className="cg-card__line">{line}</p>}
        <p className="cg-card__price">
          <span>{amount}</span>
          {unit && <small>{unit}</small>}
        </p>
        <div className="cg-card__actions">
          {orderable ? (
            <>
              <button type="button" className={`cg-btn cg-btn--outline cg-btn--sm${added ? " is-done" : ""}`} onClick={add}>
                {added ? (
                  <>
                    <Check size={14} aria-hidden="true" /> {t("Añadido", "Added")}
                  </>
                ) : (
                  t("Añadir al pedido", "Add to order")
                )}
              </button>
              {added && (
                <button type="button" className="cg-card__view" onClick={() => setCartOpen(true)}>
                  {t("Ver pedido", "View order")}
                </button>
              )}
            </>
          ) : (
            <Link href={href} className="cg-btn cg-btn--outline cg-btn--sm">
              {t("Ver detalle", "View details")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
