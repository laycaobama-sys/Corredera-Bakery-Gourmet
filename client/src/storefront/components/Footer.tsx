import { Clock, Instagram, Mail, MapPin, MessageCircle, Package, Phone, Scissors, ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";
import { NAV_DEPARTMENTS } from "../data";
import { useT } from "../hooks";
import { useStore } from "../StoreContext";
import { AnchorLink } from "./AnchorLink";

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.7 5.7 0 0 0-.77-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

export function TrustStrip() {
  const t = useT();
  const items = [
    { icon: Scissors, title: t("Corte a cuchillo gratis", "Free hand-carving"), text: t("Al encargar tu jamón entero", "When you order a whole ham") },
    { icon: Package, title: t("Envasado al vacío", "Vacuum packed"), text: t("Sobres listos para servir", "Ready-to-serve packs") },
    { icon: Truck, title: t("Recogida o envío", "Pickup or delivery"), text: t("En Madrid centro o a domicilio", "Central Madrid or to your door") },
    { icon: ShieldCheck, title: t("Atención personal", "Personal service"), text: t("Confirmamos cada pedido contigo", "We confirm every order with you") },
  ];
  return (
    <section className="cg-trust" aria-label={t("Garantías Corredera", "Corredera guarantees")}>
      <div className="cg-container cg-trust__grid">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="cg-trust__item">
            <Icon size={26} strokeWidth={1.25} aria-hidden="true" />
            <div>
              <p className="cg-trust__title">{title}</p>
              <p className="cg-trust__text">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  const { lang, settings, openLegal, whatsappHref, track } = useStore();
  const t = useT();
  const year = new Date().getFullYear();
  const c = settings.contact;
  const s = settings.schedule;

  return (
    <footer className="cg-footer">
      <div className="cg-footer__cta">
        <div className="cg-container cg-footer__cta-inner">
          <div>
            <p className="cg-footer__cta-title">{t("Ibéricos, quesos y aceites seleccionados en el centro de Madrid", "Selected Iberian ham, cheeses and olive oils in central Madrid")}</p>
            <p className="cg-footer__cta-text">{t("Encarga hoy y recoge en Calle de la Puebla, 15 o recíbelo en casa.", "Order today and pick up at Calle de la Puebla, 15 or get it delivered.")}</p>
          </div>
          <Link href="/tienda" className="cg-btn cg-btn--light">
            {t("Ir a la tienda", "Go to the shop")}
          </Link>
        </div>
      </div>

      <div className="cg-container cg-footer__grid">
        <div className="cg-footer__brand">
          <img src="/assets/brand/corredera-logo-light.png" alt="Corredera Gourmet" width={940} height={665} loading="lazy" />
          <p>{lang === "en" ? settings.sections.footerNoteEn : settings.sections.footerNoteEs}</p>
          <div className="cg-footer__social">
            <a href={c.instagramUrl} target="_blank" rel="noreferrer" aria-label={`Instagram ${c.instagramHandle}`}>
              <Instagram size={18} strokeWidth={1.5} />
            </a>
            <a href={c.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok">
              <TikTokIcon />
            </a>
            <a href={whatsappHref(t("Hola Corredera Gourmet", "Hello Corredera Gourmet"))} target="_blank" rel="noreferrer" aria-label="WhatsApp" onClick={() => track("whatsapp_click")}>
              <MessageCircle size={18} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <nav aria-label={t("Tienda", "Shop")}>
          <p className="cg-footer__heading">{t("Tienda", "Shop")}</p>
          <ul>
            {NAV_DEPARTMENTS.map((d) => (
              <li key={d.slug}>
                <Link href={d.href}>{lang === "en" ? d.en : d.es}</Link>
              </li>
            ))}
            <li>
              <Link href="/tienda">{t("Toda la tienda", "Shop all")}</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t("Información", "Information")}>
          <p className="cg-footer__heading">{t("Información", "Information")}</p>
          <ul>
            <li><AnchorLink to="nosotros">{t("Sobre nosotros", "About us")}</AnchorLink></li>
            <li><AnchorLink to="servicio-corte">{t("Servicio de corte", "Carving service")}</AnchorLink></li>
            <li><AnchorLink to="como-encargar">{t("Cómo encargar", "How to order")}</AnchorLink></li>
            <li><Link href="/bakery-cafe">{t("Carta Bakery & Café", "Bakery & Café menu")}</Link></li>
            <li><AnchorLink to="visitanos">{t("Visítanos", "Visit us")}</AnchorLink></li>
          </ul>
        </nav>

        <div>
          <p className="cg-footer__heading">{t("¿Hablamos?", "Get in touch")}</p>
          <ul className="cg-footer__contact">
            <li>
              <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
              <a href={whatsappHref(t("Hola Corredera Gourmet", "Hello Corredera Gourmet"))} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
                {c.whatsappDisplay}
              </a>
            </li>
            <li>
              <Phone size={16} strokeWidth={1.5} aria-hidden="true" />
              <a href={`tel:${c.landlineNumber}`} onClick={() => track("phone_click")}>{c.landlineDisplay}</a>
            </li>
            <li>
              <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
              <a href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
            </li>
            <li>
              <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
              <a href={c.googleMapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}>{c.addressLine}</a>
            </li>
            <li>
              <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>
                {t("Gourmet", "Gourmet")}: {lang === "en" ? s.gourmetHoursEn : s.gourmetHoursEs}
                <br />
                <small>{lang === "en" ? s.gourmetClosedNoteEn : s.gourmetClosedNoteEs}</small>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="cg-footer__legal">
        <div className="cg-container cg-footer__legal-inner">
          <p>
            © {year} {settings.legal.companyName} · {settings.legal.tradeName}
          </p>
          <ul>
            <li><button type="button" onClick={() => openLegal("aviso-legal")}>{t("Aviso legal", "Legal notice")}</button></li>
            <li><button type="button" onClick={() => openLegal("privacidad")}>{t("Privacidad", "Privacy")}</button></li>
            <li><button type="button" onClick={() => openLegal("cookies")}>Cookies</button></li>
            <li><button type="button" onClick={() => openLegal("condiciones")}>{t("Condiciones de encargo", "Order terms")}</button></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
