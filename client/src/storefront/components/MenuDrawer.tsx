import { ArrowRight, Clock, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { useCallback } from "react";
import { Link } from "wouter";
import { NAV_DEPARTMENTS } from "../data";
import { useEscape, useScrollLock, useT } from "../hooks";
import { useStore } from "../StoreContext";
import { AnchorLink } from "./AnchorLink";

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, setLang, settings, whatsappHref, track } = useStore();
  const t = useT();
  const close = useCallback(() => onClose(), [onClose]);
  useScrollLock(open);
  useEscape(open, close);

  return (
    <div className={`cg-drawer-root${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="cg-overlay" onClick={close} />
      <aside
        id="cg-menu-drawer"
        className="cg-drawer cg-drawer--left"
        role="dialog"
        aria-modal="true"
        aria-label={t("Menú", "Menu")}
        inert={!open}
      >
        <div className="cg-drawer__head">
          <img src="/assets/brand/corredera-lockup.png" alt="Corredera Gourmet" className="cg-drawer__logo" width={952} height={228} />
          <button type="button" className="cg-icon-btn" onClick={close} aria-label={t("Cerrar menú", "Close menu")}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div className="cg-drawer__body">
          <p className="cg-drawer__label">{t("Tienda gourmet", "Gourmet shop")}</p>
          <ul className="cg-drawer__list">
            {NAV_DEPARTMENTS.map((dep) => (
              <li key={dep.slug}>
                <Link href={dep.href} onClick={close}>
                  <span>{lang === "en" ? dep.en : dep.es}</span>
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tienda" onClick={close}>
                <span>{t("Toda la tienda", "Shop all")}</span>
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </li>
          </ul>

          <p className="cg-drawer__label">Corredera</p>
          <ul className="cg-drawer__list cg-drawer__list--small">
            <li>
              <Link href="/servicio-corte-jamon" onClick={close}>{t("Servicio de corte de jamón", "Ham carving service")}</Link>
            </li>
            <li>
              <Link href="/lotes-navidad" onClick={close}>{t("Lotes de Navidad", "Christmas hampers")}</Link>
            </li>
            <li>
              <Link href="/guia/jamon-iberico" onClick={close}>{t("Guía del jamón ibérico", "Iberian ham guide")}</Link>
            </li>
            <li>
              <AnchorLink to="como-encargar" onClick={close}>{t("Encargos y envíos", "Orders & delivery")}</AnchorLink>
            </li>
            <li>
              <AnchorLink to="nosotros" onClick={close}>{t("Sobre nosotros", "About us")}</AnchorLink>
            </li>
            <li>
              <Link href="/bakery-cafe" onClick={close}>{t("Carta Bakery & Café", "Bakery & Café menu")}</Link>
            </li>
            <li>
              <AnchorLink to="visitanos" onClick={close}>{t("Visítanos", "Visit us")}</AnchorLink>
            </li>
          </ul>

          <div className="cg-drawer__contact">
            <a
              href={whatsappHref(t("Hola Corredera Gourmet, quisiera hacer una consulta.", "Hello Corredera Gourmet, I have a question."))}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("whatsapp_click")}
            >
              <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
              WhatsApp {settings.contact.whatsappDisplay}
            </a>
            <a href={`tel:${settings.contact.landlineNumber}`} onClick={() => track("phone_click")}>
              <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
              {settings.contact.landlineDisplay}
            </a>
            <p>
              <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
              {settings.contact.addressLine}
            </p>
            <p>
              <Clock size={18} strokeWidth={1.5} aria-hidden="true" />
              {lang === "en" ? settings.schedule.gourmetHoursEn : settings.schedule.gourmetHoursEs}
            </p>
          </div>

          <div className="cg-drawer__lang" role="group" aria-label={t("Idioma", "Language")}>
            <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>Español</button>
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
