import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { productPath } from "../../../../shared/productUrls";
import { normalizeSearchText } from "../../../../shared/catalog";
import { categoryLabel, itemName, NAV_DEPARTMENTS, priceParts } from "../data";
import { useEscape, useScrollLock, useT } from "../hooks";
import { useStore } from "../StoreContext";
import { ProductImage } from "./ProductCard";

export function SearchDialog() {
  const { lang, items, searchOpen, setSearchOpen } = useStore();
  const t = useT();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  useScrollLock(searchOpen);
  useEscape(searchOpen, close);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return items
      .filter((item) => {
        const hay = normalizeSearchText(
          [item.name, item.nameEn, item.desc, item.descEn, item.badge ?? "", categoryLabel(item, lang)].join(" "),
        );
        return terms.every((term) => hay.includes(term));
      })
      // Gourmet first: it is the core of the shop.
      .sort((a, b) => (a.mode === b.mode ? 0 : a.mode === "gourmet" ? -1 : 1))
      .slice(0, 12);
  }, [items, query, lang]);

  if (!searchOpen) return null;

  return (
    <div className="cg-search" role="dialog" aria-modal="true" aria-label={t("Buscar", "Search")}>
      <div className="cg-overlay" onClick={close} />
      <div className="cg-search__panel">
        <div className="cg-container">
          <div className="cg-search__bar">
            <Search size={22} strokeWidth={1.5} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Busca jamón, lomo, pecorino, aceite…", "Search ham, loin, pecorino, olive oil…")}
              aria-label={t("Buscar productos", "Search products")}
            />
            <button type="button" className="cg-icon-btn" onClick={close} aria-label={t("Cerrar búsqueda", "Close search")}>
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {query.trim().length < 2 ? (
            <div className="cg-search__suggest">
              <p className="cg-drawer__label">{t("Explora", "Explore")}</p>
              <div className="cg-chips">
                {NAV_DEPARTMENTS.map((d) => (
                  <Link key={d.slug} href={d.href} className="cg-chip" onClick={close}>
                    {lang === "en" ? d.en : d.es}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="cg-search__empty">
              {t(`Sin resultados para «${query}».`, `No results for "${query}".`)}
            </p>
          ) : (
            <ul className="cg-search__results">
              {results.map((item) => {
                const { amount, unit } = priceParts(item, lang);
                return (
                  <li key={item.id}>
                    <Link href={productPath(item.id)} onClick={close}>
                      <span className="cg-search__thumb">
                        <ProductImage item={item} />
                      </span>
                      <span className="cg-search__text">
                        <span className="cg-search__cat">{categoryLabel(item, lang)}</span>
                        <span className="cg-search__name">{itemName(item, lang)}</span>
                      </span>
                      <span className="cg-search__price">
                        {amount} {unit && <small>{unit}</small>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
