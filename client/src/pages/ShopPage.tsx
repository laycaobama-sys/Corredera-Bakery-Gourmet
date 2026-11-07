import { useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { shopMeta } from "../../../shared/seoCopy";
import { ProductListing } from "../storefront/components/ProductListing";
import { Breadcrumbs, StoreLayout } from "../storefront/components/StoreLayout";
import { isShopItem, SHOP_CATEGORY_IDS, SHOP_CATEGORY_LABELS, type ShopCategoryId } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

export default function ShopPage() {
  const { items, lang } = useStore();
  const t = useT();
  const search = useSearch();
  const [, navigate] = useLocation();
  const param = new URLSearchParams(search).get("c");
  const category: ShopCategoryId | "all" = (SHOP_CATEGORY_IDS as readonly string[]).includes(param ?? "")
    ? (param as ShopCategoryId)
    : "all";
  const shopItems = useMemo(() => items.filter(isShopItem), [items]);

  const meta = shopMeta(lang);
  usePageMeta(meta.title, meta.description);

  const title = category === "all" ? t("Tienda gourmet", "Gourmet shop") : SHOP_CATEGORY_LABELS[category][lang];

  return (
    <StoreLayout>
      <div className="cg-container">
        <Breadcrumbs items={category === "all" ? [{ label: t("Tienda", "Shop") }] : [{ label: t("Tienda", "Shop"), href: "/tienda" }, { label: title }]} />
        <header className="cg-page-head">
          <h1>{title}</h1>
          <p>
            {t(
              "Toda nuestra selección para llevar: ibéricos de las grandes casas, quesos de autor, aceites de oliva virgen extra, conservas y vinos.",
              "Our whole take-home selection: Iberian ham from the great houses, artisan cheeses, extra virgin olive oils, preserves and wines.",
            )}
          </p>
        </header>
        <ProductListing
          items={shopItems}
          category={category}
          showCategoryFilter
          onCategoryChange={(c) => navigate(c === "all" ? "/tienda" : `/tienda?c=${c}`, { replace: true })}
        />
      </div>
    </StoreLayout>
  );
}
