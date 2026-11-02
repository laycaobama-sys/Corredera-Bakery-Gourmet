import { ChevronDown, Menu, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { departmentsWithImages } from "../data";
import { useEscape, useT } from "../hooks";
import { useStore } from "../StoreContext";
import { MenuDrawer } from "./MenuDrawer";

function AnnouncementBar() {
  const { lang, setLang, settings } = useStore();
  const t = useT();
  const campaign = settings.seasonalCampaign;
  const messages = [
    // An active event/campaign from the admin panel always leads the bar.
    ...(campaign.enabled ? [lang === "en" ? campaign.titleEn : campaign.titleEs] : []),
    ...settings.storefront.announcements.map((a) => (lang === "en" ? a.textEn : a.textEs)),
  ];
  const [index, setIndex] = useState(0);
  const safeIndex = index % Math.max(1, messages.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || messages.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(id);
  }, [messages.length]);

  return (
    <div className="cg-announce">
      <div className="cg-container cg-announce__inner">
        <p className="cg-announce__msg" aria-live="polite" key={safeIndex}>
          {messages[safeIndex]}
        </p>
        <div className="cg-announce__lang" role="group" aria-label={t("Idioma", "Language")}>
          <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>
            ES
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
      </div>
    </div>
  );
}

function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { lang, settings } = useStore();
  const t = useT();
  return (
    <div className="cg-mega" role="region" aria-label={t("Departamentos de la tienda", "Shop departments")}>
      <div className="cg-container cg-mega__inner">
        <div className="cg-mega__grid">
          {departmentsWithImages(settings.pages.departmentImages).map((dep) => (
            <Link key={dep.slug} href={dep.href} className="cg-mega__item" onClick={onNavigate}>
              <span className="cg-mega__thumb">
                <img src={dep.image} alt="" loading="lazy" decoding="async" width={160} height={128} />
              </span>
              <span>
                <span className="cg-mega__title">{lang === "en" ? dep.en : dep.es}</span>
                <span className="cg-mega__desc">{lang === "en" ? dep.descEn : dep.descEs}</span>
              </span>
            </Link>
          ))}
          <Link href="/tienda" className="cg-mega__item cg-mega__item--all" onClick={onNavigate}>
            <span className="cg-mega__title">{t("Ver toda la tienda", "Shop everything")}</span>
            <span className="cg-mega__desc">{t("Conservas, vinos, fruta y carne", "Preserves, wines, produce and meat")}</span>
          </Link>
        </div>
        <aside className="cg-mega__promo">
          <img src={settings.pages.whyImageUrl} alt="" loading="lazy" width={320} height={256} />
          <p className="cg-eyebrow">{t("Servicio Corredera", "Corredera service")}</p>
          <p className="cg-mega__promo-title">
            {t("Tu jamón entero, cortado a cuchillo y envasado al vacío. Gratis.", "Your whole ham, hand-carved and vacuum packed. Free.")}
          </p>
          <Link href="/gourmet/jamones" className="cg-link-arrow" onClick={onNavigate}>
            {t("Elegir jamón", "Choose a ham")}
          </Link>
        </aside>
      </div>
    </div>
  );
}

export function Header() {
  const { cartCount, setCartOpen, setSearchOpen } = useStore();
  const t = useT();
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setDrawerOpen(false);
  }, [location]);

  useEscape(megaOpen, () => setMegaOpen(false));

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 160);
  };

  const navClass = (href: string) =>
    `cg-nav__link${location === href || location.startsWith(`${href}/`) ? " is-active" : ""}`;

  return (
    <>
      <a href="#contenido" className="skip-link">
        {t("Saltar al contenido", "Skip to content")}
      </a>
      <AnnouncementBar />
      <header className={`cg-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="cg-container cg-header__inner">
          <div className="cg-header__left">
            <button
              type="button"
              className="cg-icon-btn cg-header__burger"
              aria-label={t("Abrir menú", "Open menu")}
              aria-expanded={drawerOpen}
              aria-controls="cg-menu-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <nav className="cg-nav" aria-label={t("Navegación principal", "Main navigation")}>
              <div className="cg-nav__mega" onMouseEnter={openMega} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  className={`cg-nav__link${location.startsWith("/gourmet") || location === "/tienda" ? " is-active" : ""}`}
                  aria-expanded={megaOpen}
                  onClick={(e) => {
                    // With a mouse the panel is already open from hover; keyboard and touch toggle it.
                    const viaKeyboard = e.detail === 0;
                    if (!viaKeyboard && window.matchMedia("(hover: hover)").matches) openMega();
                    else setMegaOpen((v) => !v);
                  }}
                >
                  {t("Tienda", "Shop")}
                  <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
                </button>
                {megaOpen && <MegaMenu onNavigate={() => setMegaOpen(false)} />}
              </div>
              <Link href="/gourmet/jamones" className={navClass("/gourmet/jamones")}>
                {t("Jamones", "Hams")}
              </Link>
              <Link href="/gourmet/embutidos" className={navClass("/gourmet/embutidos")}>
                {t("Embutidos", "Charcuterie")}
              </Link>
              <Link href="/gourmet/quesos" className={navClass("/gourmet/quesos")}>
                {t("Quesos", "Cheeses")}
              </Link>
            </nav>
          </div>

          <Link href="/" className="cg-header__logo" aria-label="Corredera Gourmet · Inicio">
            <img
              src="/assets/brand/corredera-lockup.png"
              alt="Corredera Gourmet"
              width={952}
              height={228}
              fetchPriority="high"
            />
          </Link>

          <div className="cg-header__right">
            <nav className="cg-nav cg-nav--right" aria-label={t("Navegación secundaria", "Secondary navigation")}>
              <Link href="/gourmet/carniceria" className={navClass("/gourmet/carniceria")}>
                {t("Carnicería", "Butcher")}
              </Link>
              <Link href="/gourmet/fruteria" className={navClass("/gourmet/fruteria")}>
                {t("Frutería", "Greengrocer")}
              </Link>
              <Link href="/bakery-cafe" className={navClass("/bakery-cafe")}>
                {t("Carta & Café", "Menu & Café")}
              </Link>
            </nav>
            <button
              type="button"
              className="cg-icon-btn"
              aria-label={t("Buscar productos", "Search products")}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="cg-icon-btn cg-cart-btn"
              aria-label={t(`Ver pedido (${cartCount} artículos)`, `View order (${cartCount} items)`)}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && <span className="cg-cart-btn__count">{cartCount > 99 ? "99+" : cartCount}</span>}
            </button>
          </div>
        </div>
      </header>
      <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
