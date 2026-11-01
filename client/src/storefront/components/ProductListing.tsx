import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { normalizeSearchText, parsePriceEuros, type MenuItem } from "../../../../shared/catalog";
import { categoryLabel, itemName, SHOP_CATEGORY_IDS, SHOP_CATEGORY_LABELS, type ShopCategoryId } from "../data";
import { useT } from "../hooks";
import { useStore } from "../StoreContext";
import { ProductCard } from "./ProductCard";

type Sort = "recommended" | "price-asc" | "price-desc" | "name";

export function ProductListing({
  items,
  category,
  onCategoryChange,
  showCategoryFilter = false,
}: {
  items: MenuItem[];
  category?: ShopCategoryId | "all";
  onCategoryChange?: (c: ShopCategoryId | "all") => void;
  showCategoryFilter?: boolean;
}) {
  const { lang } = useStore();
  const t = useT();
  const [sort, setSort] = useState<Sort>("recommended");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [items]);

  const visible = useMemo(() => {
    const q = normalizeSearchText(query);
    let list = items.filter((i) => (category && category !== "all" ? i.category === category : true));
    if (q) {
      list = list.filter((i) =>
        normalizeSearchText([i.name, i.nameEn, i.desc, i.descEn, categoryLabel(i, lang)].join(" ")).includes(q),
      );
    }
    const price = (i: MenuItem) => parsePriceEuros(i.price) ?? Number.POSITIVE_INFINITY;
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") sorted.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
    if (sort === "name") sorted.sort((a, b) => itemName(a, lang).localeCompare(itemName(b, lang), lang));
    return sorted;
  }, [items, category, query, sort, lang]);

  return (
    <div className="cg-listing">
      <div className="cg-toolbar">
        {showCategoryFilter && onCategoryChange && (
          <div className="cg-chips cg-chips--scroll" role="group" aria-label={t("Categorías", "Categories")}>
            <button type="button" className="cg-chip" aria-pressed={category === "all"} onClick={() => onCategoryChange("all")}>
              {t("Todo", "All")} <span>{items.length}</span>
            </button>
            {SHOP_CATEGORY_IDS.filter((c) => counts.get(c)).map((c) => (
              <button key={c} type="button" className="cg-chip" aria-pressed={category === c} onClick={() => onCategoryChange(c)}>
                {SHOP_CATEGORY_LABELS[c][lang]} <span>{counts.get(c)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="cg-toolbar__row">
          <p className="cg-toolbar__count">
            {visible.length} {visible.length === 1 ? t("producto", "product") : t("productos", "products")}
          </p>
          <div className="cg-toolbar__controls">
            <label className="cg-search-inline">
              <Search size={16} strokeWidth={1.5} aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Filtrar…", "Filter…")} aria-label={t("Filtrar productos", "Filter products")} />
            </label>
            <label className="cg-select">
              <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
              <span className="sr-only">{t("Ordenar por", "Sort by")}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recommended">{t("Recomendados", "Recommended")}</option>
                <option value="price-asc">{t("Precio: menor a mayor", "Price: low to high")}</option>
                <option value="price-desc">{t("Precio: mayor a menor", "Price: high to low")}</option>
                <option value="name">{t("Nombre", "Name")}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="cg-empty">{t("No hay productos que coincidan con tu búsqueda.", "No products match your search.")}</p>
      ) : (
        <div className="cg-grid cg-grid--4">
          {visible.map((item, i) => (
            <ProductCard key={item.id} item={item} eager={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
