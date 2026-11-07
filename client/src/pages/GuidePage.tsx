import { Link } from "wouter";
import { productPath } from "../../../shared/productUrls";
import { CONTENT_PAGES } from "../../../shared/contentPages";
import { GUIDE, GUIDE_ENTRIES } from "../../../shared/guideJamon";
import { Breadcrumbs, StoreLayout } from "../storefront/components/StoreLayout";
import { itemName, priceParts } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

export default function GuidePage() {
  const { lang, items } = useStore();
  const t = useT();
  const es = lang === "es";
  usePageMeta(es ? GUIDE.seoTitleEs : GUIDE.seoTitleEn, es ? GUIDE.descriptionEs : GUIDE.descriptionEn);
  const pieces = items.filter((i) => i.category === "jamones_enteros");

  return (
    <StoreLayout>
      <div className="cg-container">
        <Breadcrumbs items={[{ label: es ? GUIDE.titleEs : GUIDE.titleEn }]} />
      </div>
      <article className="cg-container cg-container--narrow cg-guide">
        <header className="cg-heading cg-heading--center">
          <p className="cg-eyebrow">{t("Guía Corredera", "Corredera guide")}</p>
          <h1 className="cg-heading__title">{es ? GUIDE.titleEs : GUIDE.titleEn}</h1>
          <p className="cg-heading__text">{es ? GUIDE.introEs : GUIDE.introEn}</p>
        </header>
        {GUIDE_ENTRIES.map((e) => (
          <section key={e.qEs}>
            <h2>{es ? e.qEs : e.qEn}</h2>
            <p>{es ? e.aEs : e.aEn}</p>
          </section>
        ))}
        <section>
          <h2>{t("Nuestros jamones y paletas, con precio", "Our hams and shoulders, with prices")}</h2>
          <ul className="cg-specs">
            {pieces.map((i) => {
              const { amount, unit } = priceParts(i, lang);
              return (
                <li key={i.id}>
                  <span>
                    <Link href={productPath(i.id)} className="cg-inline-link">
                      {itemName(i, lang)}
                    </Link>
                  </span>
                  <strong>
                    {amount} {unit}
                  </strong>
                </li>
              );
            })}
          </ul>
        </section>
        <nav className="cg-guide__links" aria-label={t("Más guías", "More guides")}>
          <h2>{t("Más guías", "More guides")}</h2>
          <ul>
            {CONTENT_PAGES.filter((p) => p.kind === "guide").map((p) => (
              <li key={p.path}>
                <Link href={p.path} className="cg-inline-link">{es ? p.titleEs : p.titleEn}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="cg-guide__cta">
          <Link href="/gourmet/jamones" className="cg-btn cg-btn--primary">
            {t("Ver jamones y paletas", "See hams and shoulders")}
          </Link>
        </p>
      </article>
    </StoreLayout>
  );
}
