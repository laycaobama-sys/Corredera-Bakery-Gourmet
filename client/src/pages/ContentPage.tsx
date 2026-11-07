import { MessageCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "wouter";
import { getContentPage, type ContentPage as Page, type ContentTable } from "../../../shared/contentPages";
import { productPath } from "../../../shared/productUrls";
import { Breadcrumbs, StoreLayout } from "../storefront/components/StoreLayout";
import { itemName, priceParts } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";
import NotFound from "./NotFound";

function Table({ table, es }: { table: ContentTable; es: boolean }) {
  return (
    <div className="cg-guide__table">
      <table>
        <thead>
          <tr>
            {(es ? table.headEs : table.headEn).map((h, i) => (
              <th key={i} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(es ? table.rowsEs : table.rowsEn).map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Writes the company's request into a WhatsApp message: nothing is stored on the site. */
function CompanyForm() {
  const { whatsappHref, track } = useStore();
  const t = useT();
  const [company, setCompany] = useState("");
  const [hampers, setHampers] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const lines = [
      t("Hola Corredera Gourmet, quisiera lotes de Navidad para mi empresa.", "Hello Corredera Gourmet, I'd like Christmas hampers for my company."),
      `${t("Empresa", "Company")}: ${company}`,
      `${t("Número de lotes", "Number of hampers")}: ${hampers}`,
      budget && `${t("Presupuesto por lote", "Budget per hamper")}: ${budget}`,
      date && `${t("Fecha deseada", "Preferred date")}: ${date}`,
    ].filter(Boolean);
    track("whatsapp_click");
    window.open(whatsappHref(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  return (
    <form className="cg-lead-form" onSubmit={submit}>
      <h2>{t("Pide lotes para tu empresa", "Request hampers for your company")}</h2>
      <p>{t("Se abrirá WhatsApp con tu pedido escrito. Esta página no guarda estos datos.", "WhatsApp will open with your request written. This page does not store this data.")}</p>
      <label>
        {t("Empresa", "Company")}
        <input required maxLength={80} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
      </label>
      <label>
        {t("Número de lotes", "Number of hampers")}
        <input required inputMode="numeric" maxLength={8} value={hampers} onChange={(e) => setHampers(e.target.value)} />
      </label>
      <label>
        {t("Presupuesto por lote (opcional)", "Budget per hamper (optional)")}
        <input maxLength={40} value={budget} onChange={(e) => setBudget(e.target.value)} />
      </label>
      <label>
        {t("Fecha deseada (opcional)", "Preferred date (optional)")}
        <input maxLength={40} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button type="submit" className="cg-btn cg-btn--wa">
        <MessageCircle size={18} aria-hidden="true" /> {t("Enviar por WhatsApp", "Send on WhatsApp")}
      </button>
    </form>
  );
}

function View({ page }: { page: Page }) {
  const { lang, items, whatsappHref, track } = useStore();
  const t = useT();
  const es = lang === "es";
  usePageMeta(es ? page.seoTitleEs : page.seoTitleEn, es ? page.descriptionEs : page.descriptionEn);
  const byId = new Map(items.map((i) => [i.id, i]));
  const products = page.productIds.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const title = es ? page.titleEs : page.titleEn;
  const updated = new Date(page.updated).toLocaleDateString(es ? "es-ES" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <StoreLayout>
      <div className="cg-container">
        <Breadcrumbs items={[...(page.kind === "guide" ? [{ label: t("Guía del jamón", "Ham guide"), href: "/guia/jamon-iberico" }] : []), { label: title }]} />
      </div>
      <article className="cg-container cg-container--narrow cg-guide">
        <header className="cg-heading cg-heading--center">
          <p className="cg-eyebrow">{es ? page.kickerEs : page.kickerEn}</p>
          <h1 className="cg-heading__title">{title}</h1>
          <p className="cg-heading__text">{es ? page.answerEs : page.answerEn}</p>
          {page.kind === "guide" && (
            <p className="cg-guide__meta">
              {t("Corredera Gourmet · Actualizado el", "Corredera Gourmet · Updated")} <time dateTime={page.updated}>{updated}</time>
            </p>
          )}
        </header>

        <p className="cg-guide__cta">
          <a className="cg-btn cg-btn--wa" href={whatsappHref(es ? page.whatsappEs : page.whatsappEn)} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
            <MessageCircle size={18} aria-hidden="true" /> {es ? page.ctaEs : page.ctaEn}
          </a>
        </p>

        {page.sections.map((s) => (
          <section key={s.hEs}>
            <h2>{es ? s.hEs : s.hEn}</h2>
            {(es ? s.pEs : s.pEn)?.map((p) => <p key={p}>{p}</p>)}
            {(es ? s.listEs : s.listEn) && (
              <ul className="cg-guide__list">
                {(es ? s.listEs : s.listEn)!.map((li) => <li key={li}>{li}</li>)}
              </ul>
            )}
            {s.table && <Table table={s.table} es={es} />}
          </section>
        ))}

        {page.companyForm && <CompanyForm />}

        {products.length > 0 && (
          <section>
            <h2>{es ? page.productsTitleEs : page.productsTitleEn}</h2>
            <ul className="cg-specs">
              {products.map((i) => {
                const { amount, unit } = priceParts(i, lang);
                return (
                  <li key={i.id}>
                    <span>
                      <Link href={productPath(i.id)} className="cg-inline-link">{itemName(i, lang)}</Link>
                    </span>
                    <strong>{amount} {unit}</strong>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h2>{t("Preguntas frecuentes", "Frequently asked questions")}</h2>
          <div className="cg-faq">
            {page.faqs.map((f) => (
              <details key={f.qEs}>
                <summary>{es ? f.qEs : f.qEn}</summary>
                <p>{es ? f.aEs : f.aEn}</p>
              </details>
            ))}
          </div>
        </section>

        <nav className="cg-guide__links" aria-label={t("Sigue leyendo", "Keep reading")}>
          <h2>{t("Sigue leyendo", "Keep reading")}</h2>
          <ul>
            {page.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="cg-inline-link">{es ? l.es : l.en}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </StoreLayout>
  );
}

export default function ContentPage({ path }: { path: string }) {
  const page = getContentPage(path);
  return page ? <View page={page} /> : <NotFound />;
}
