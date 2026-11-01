import { Check, Scissors } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { GOURMET_CATEGORY_PAGES, getGourmetCategoryBySlug } from "../../../shared/gourmetRoutes";
import { ProductListing } from "../storefront/components/ProductListing";
import { Breadcrumbs, SectionHeading, StoreLayout } from "../storefront/components/StoreLayout";
import { departmentsWithImages } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";
import CartaPage from "./CartaPage";
import NotFound from "./NotFound";

export default function CategoryPage({ slug }: { slug: string }) {
  if (slug === "bakery-cafe") return <CartaPage />;
  return <GourmetCategory slug={slug} />;
}

function GourmetCategory({ slug }: { slug: string }) {
  const { items, lang, settings } = useStore();
  const t = useT();
  const departments = departmentsWithImages(settings.pages.departmentImages);
  const config = getGourmetCategoryBySlug(slug);
  const es = lang === "es";

  usePageMeta(
    config ? (es ? config.seoTitleEs : config.seoTitleEn) : "Corredera Gourmet",
    config ? (es ? config.seoDescriptionEs : config.seoDescriptionEn) : undefined,
  );

  const products = useMemo(() => (config ? config.filterItems(items).filter((i) => i.mode === "gourmet") : []), [config, items]);

  if (!config || !config.isGourmetPrimary) return <NotFound />;

  const dept = departments.find((d) => d.slug === slug);
  const related = GOURMET_CATEGORY_PAGES.filter((c) => config.relatedSlugs.includes(c.slug) && c.isGourmetPrimary);
  const showCuttingNotice = slug === "jamones" || slug === "jamon-cortado";

  return (
    <StoreLayout>
      <div className="cg-container">
        <Breadcrumbs items={[{ label: t("Tienda", "Shop"), href: "/tienda" }, { label: es ? config.navLabelEs : config.navLabelEn }]} />
      </div>

      <section className="cg-container cg-cat-hero">
        <div className="cg-cat-hero__copy">
          <p className="cg-eyebrow">{es ? config.kickerEs : config.kickerEn}</p>
          <h1>{es ? config.titleEs : config.titleEn}</h1>
          <p>{es ? config.subtitleEs : config.subtitleEn}</p>
        </div>
        <div className="cg-cat-hero__media">
          <img src={dept?.image ?? config.bannerImage} alt="" loading="eager" fetchPriority="high" />
        </div>
      </section>

      {showCuttingNotice && (
        <div className="cg-container">
          <div className="cg-notice">
            <Scissors size={22} strokeWidth={1.5} aria-hidden="true" />
            <p>
              <strong>{t("Corte y envasado al vacío gratis.", "Free carving and vacuum packing.")}</strong>{" "}
              {t(
                "Al encargar tu jamón entero, elige si lo quieres en pieza o cortado a cuchillo y envasado en sobres. Sin coste adicional.",
                "When you order a whole ham, choose whether you want it whole or hand-carved and vacuum packed. No extra cost.",
              )}
            </p>
          </div>
        </div>
      )}

      <section className="cg-container cg-section--flush">
        <ProductListing items={products} />
      </section>

      <section className="cg-section cg-section--cream">
        <div className="cg-container cg-editorial">
          <div>
            <h2>{es ? config.editorialTitleEs : config.editorialTitleEn}</h2>
            <p>{es ? config.introEs : config.introEn}</p>
            <p>{es ? config.editorialBodyEs : config.editorialBodyEn}</p>
          </div>
          <ul className="cg-checklist">
            {(es ? config.editorialHighlightsEs : config.editorialHighlightsEn).map((h) => (
              <li key={h}>
                <Check size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {config.faqs.length > 0 && (
        <section className="cg-section">
          <div className="cg-container cg-container--narrow">
            <SectionHeading title={t("Preguntas frecuentes", "Frequently asked questions")} />
            <div className="cg-faq">
              {config.faqs.map((f) => (
                <details key={f.questionEs}>
                  <summary>{es ? f.questionEs : f.questionEn}</summary>
                  <p>{es ? f.answerEs : f.answerEn}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="cg-section cg-section--tight">
          <div className="cg-container">
            <SectionHeading title={t("También te puede interesar", "You may also like")} />
            <div className="cg-related">
              {related.map((c) => {
                const d = departments.find((x) => x.slug === c.slug);
                return (
                  <Link key={c.slug} href={c.path} className="cg-dept">
                    <img src={d?.image ?? c.cardImage} alt="" loading="lazy" />
                    <span className="cg-dept__label">
                      <span className="cg-dept__title">{es ? c.navLabelEs : c.navLabelEn}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
