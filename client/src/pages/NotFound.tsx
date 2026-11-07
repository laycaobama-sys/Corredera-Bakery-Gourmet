import { Link } from "wouter";
import { StoreLayout } from "../storefront/components/StoreLayout";
import { NAV_DEPARTMENTS } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

export default function NotFound() {
  const { lang } = useStore();
  const t = useT();
  usePageMeta(t("Página no encontrada | Corredera Gourmet", "Page not found | Corredera Gourmet"));

  return (
    <StoreLayout trust={false}>
      <section className="cg-container cg-404">
        <img src="/assets/brand/corredera-emblem.png" alt="" aria-hidden="true" width={371} height={439} />
        <p className="cg-eyebrow">404</p>
        <h1>{t("No hemos encontrado esta página", "We couldn't find this page")}</h1>
        <p>{t("Puede que el enlace haya cambiado. Te dejamos algunos caminos para seguir.", "The link may have changed. Here are a few ways to continue.")}</p>
        <div className="cg-chips cg-chips--center">
          {NAV_DEPARTMENTS.slice(0, 5).map((d) => (
            <Link key={d.slug} href={d.href} className="cg-chip">
              {lang === "en" ? d.en : d.es}
            </Link>
          ))}
        </div>
        <Link href="/tienda" className="cg-btn cg-btn--primary">
          {t("Ver toda la tienda", "See the whole shop")}
        </Link>
        <Link href="/" className="cg-link-arrow">
          {t("Volver al inicio", "Back to home")}
        </Link>
      </section>
    </StoreLayout>
  );
}
