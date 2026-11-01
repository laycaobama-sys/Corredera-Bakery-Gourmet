import { ChevronRight, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { LegalPrivacyModal, PrivacyNoticeBanner } from "../../components/LegalPrivacyModal";
import { useT } from "../hooks";
import { useStore } from "../StoreContext";
import { ScrollManager } from "./AnchorLink";
import { CartDrawer } from "./CartDrawer";
import { Footer, TrustStrip } from "./Footer";
import { Header } from "./Header";
import { RevealOnScroll } from "./Reveal";
import { SearchDialog } from "./SearchDialog";

export function StoreLayout({ children, trust = true }: { children: ReactNode; trust?: boolean }) {
  const { lang, legalTab, closeLegal, openLegal, settings, whatsappHref, track, cartCount, setCartOpen } = useStore();
  const t = useT();

  return (
    <div className="cg">
      <ScrollManager />
      <RevealOnScroll />
      <Header />
      <main id="contenido" tabIndex={-1}>
        {children}
      </main>
      {trust && <TrustStrip />}
      <Footer />

      <div className="cg-fab">
        {cartCount > 0 && (
          <button type="button" className="cg-fab__cart" onClick={() => setCartOpen(true)}>
            {t("Ver pedido", "View order")} · {cartCount}
          </button>
        )}
        <a
          className="cg-fab__wa"
          href={whatsappHref(t("Hola Corredera Gourmet, quisiera hacer una consulta.", "Hello Corredera Gourmet, I have a question."))}
          target="_blank"
          rel="noreferrer"
          aria-label={t("Escríbenos por WhatsApp", "Message us on WhatsApp")}
          onClick={() => track("whatsapp_click")}
        >
          <MessageCircle size={24} strokeWidth={1.75} />
        </a>
      </div>

      <CartDrawer />
      <SearchDialog />
      <LegalPrivacyModal open={legalTab !== null} initialTab={legalTab ?? "privacidad"} onClose={closeLegal} lang={lang} siteSettings={settings} />
      <PrivacyNoticeBanner lang={lang} onOpenLegalModal={openLegal} />
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const t = useT();
  return (
    <nav className="cg-breadcrumbs" aria-label={t("Ruta de navegación", "Breadcrumb")}>
      <ol>
        <li>
          <Link href="/">{t("Inicio", "Home")}</Link>
        </li>
        {items.map((item) => (
          <li key={item.label}>
            <ChevronRight size={12} aria-hidden="true" />
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  return (
    <div className={`cg-heading cg-heading--${align}`}>
      {eyebrow && <p className="cg-eyebrow">{eyebrow}</p>}
      <Tag className="cg-heading__title">{title}</Tag>
      {text && <p className="cg-heading__text">{text}</p>}
    </div>
  );
}
