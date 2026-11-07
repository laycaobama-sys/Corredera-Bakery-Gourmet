import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Gift,
  Hand,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Scissors,
  Store,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { productPath } from "../../../shared/productUrls";
import type { MenuItem } from "../../../shared/catalog";
import { homeFaqs, homeMeta, selectBestSellers } from "../../../shared/seoCopy";
import type { HeroSlide } from "../../../shared/siteSettingsSchema";
import { AnchorLink, SmartLink } from "../storefront/components/AnchorLink";
import { ProductCard } from "../storefront/components/ProductCard";
import { SectionHeading, StoreLayout } from "../storefront/components/StoreLayout";
import { departmentsWithImages, heroSrcSet, isShopItem, itemImage, type ShopCategoryId } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

/* ---------------------------------------------------------------- Hero */

type Slide = HeroSlide;

/** Optional slide video (uploaded from the panel). It loads after the page is idle so it never delays the first paint. */
function HeroVideo({ slide, active }: { slide: Slide; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!slide.videoUrl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const id = window.setTimeout(() => setSrc(slide.videoUrl), 1500);
    return () => window.clearTimeout(id);
  }, [slide.videoUrl]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => undefined);
    else v.pause();
  }, [active, src]);

  if (!src) return null;
  return <video ref={ref} className="cg-hero__video" src={src} poster={slide.imageUrl} muted loop playsInline autoPlay preload="none" aria-hidden="true" />;
}

function Hero() {
  const { lang, settings } = useStore();
  const t = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const SLIDES = useMemo<Slide[]>(() => {
    const visible = settings.storefront.heroSlides.filter((s) => s.visible);
    return visible.length > 0 ? visible : settings.storefront.heroSlides.slice(0, 1);
  }, [settings.storefront.heroSlides]);
  const current = index % SLIDES.length;

  useEffect(() => {
    if (paused || SLIDES.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => window.clearInterval(id);
  }, [paused, SLIDES.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  const tiles = settings.pages.homeTiles.map((tile) => ({
    href: tile.href,
    title: lang === "en" ? tile.titleEn : tile.titleEs,
    text: lang === "en" ? tile.textEn : tile.textEs,
    image: tile.imageUrl,
  }));
  return (
    <section className="cg-hero" aria-roledescription="carousel" aria-label={t("Destacados", "Highlights")}>
      <h1 className="cg-container cg-home-h1">{homeMeta(lang).h1}</h1>
      <div className="cg-container cg-hero__grid">
        <div className="cg-hero__slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className={`cg-hero__slide${i === current ? " is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDES.length}`}
              aria-hidden={i !== current}
              inert={i !== current}
            >
              <img src={slide.imageUrl} srcSet={heroSrcSet(slide.imageUrl)} sizes="(max-width: 1024px) 100vw, 70vw" alt={lang === "en" ? slide.titleEn : slide.titleEs} className="cg-hero__img" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
              {slide.videoUrl && <HeroVideo slide={slide} active={i === current} />}
              <div className="cg-hero__caption">
                <p className="cg-hero__title">{lang === "en" ? slide.titleEn : slide.titleEs}</p>
                <p className="cg-hero__text">{lang === "en" ? slide.textEn : slide.textEs}</p>
                <SmartLink href={slide.href} className="cg-btn cg-btn--primary">
                  {lang === "en" ? slide.ctaEn : slide.ctaEs}
                </SmartLink>
              </div>
            </div>
          ))}
          <div className="cg-hero__controls">
            <button type="button" onClick={() => go(-1)} aria-label={t("Anterior", "Previous")}>
              <ChevronLeft size={18} />
            </button>
            <div className="cg-hero__dots">
              {SLIDES.map((s, i) => (
                <button key={s.id} type="button" aria-label={`${t("Ir a", "Go to")} ${i + 1}`} aria-current={i === current} onClick={() => setIndex(i)} />
              ))}
            </div>
            <button type="button" onClick={() => go(1)} aria-label={t("Siguiente", "Next")}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="cg-hero__tiles">
          {tiles.map((tile) => {
            const inner = (
              <>
                <img src={tile.image} alt={tile.title} loading="lazy" decoding="async" />
                <span className="cg-tile__body">
                  <span className="cg-tile__title">{tile.title}</span>
                  <span className="cg-tile__text">{tile.text}</span>
                </span>
                <ArrowRight className="cg-tile__arrow" size={18} aria-hidden="true" />
              </>
            );
            return (
              <SmartLink key={tile.title} href={tile.href} className="cg-tile">
                {inner}
              </SmartLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InfoBar() {
  const { settings, lang, whatsappHref, track } = useStore();
  const t = useT();
  return (
    <section className="cg-container" aria-label={t("Información de contacto", "Contact information")}>
      <div className="cg-infobar">
        <a href={whatsappHref(t("Hola Corredera Gourmet, quisiera hacer un encargo.", "Hello Corredera Gourmet, I'd like to place an order."))} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
          <MessageCircle size={22} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>{t("Encargos", "Orders")}</strong>
            <span>WhatsApp {settings.contact.whatsappDisplay}</span>
          </span>
        </a>
        <a href={settings.contact.googleMapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}>
          <MapPin size={22} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>{t("Ubicación", "Location")}</strong>
            <span>{settings.contact.addressLine}</span>
          </span>
        </a>
        <AnchorLink to="visitanos">
          <Clock size={22} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>{t("Horario", "Opening hours")}</strong>
            <span>{lang === "en" ? settings.schedule.gourmetHoursEn : settings.schedule.gourmetHoursEs}</span>
          </span>
        </AnchorLink>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Christmas */

function ChristmasBanner() {
  const t = useT();
  return (
    <section className="cg-container" aria-label={t("Navidad", "Christmas")}>
      <Link href="/lotes-navidad" className="cg-xmas">
        <Gift size={24} strokeWidth={1.25} aria-hidden="true" />
        <span>
          <strong>{t("Lotes de Navidad a medida", "Made-to-order Christmas hampers")}</strong>
          <span>{t("Para regalar o para tu empresa. Te los preparamos a tu gusto.", "For gifts or your company. Made the way you like.")}</span>
        </span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ---------------------------------------------------------------- Best sellers */

type TabId = "destacados" | ShopCategoryId;

function BestSellers() {
  const { items } = useStore();
  const t = useT();
  const [tab, setTab] = useState<TabId>("destacados");
  const shopItems = useMemo(() => items.filter(isShopItem), [items]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "destacados", label: t("Más vendidos", "Best sellers") },
    { id: "jamones_enteros", label: t("Jamones", "Hams") },
    { id: "sobres_jamon", label: t("Loncheados", "Sliced") },
    { id: "embutidos", label: t("Embutidos", "Charcuterie") },
    { id: "quesos", label: t("Quesos", "Cheeses") },
    { id: "aceites", label: t("Aceites", "Oils") },
  ];

  const visible = useMemo(() => {
    if (tab === "destacados") {
      // The owner picks best sellers with the star in the admin panel; the curated list is the fallback.
      return selectBestSellers(shopItems);
    }
    return shopItems.filter((i) => i.category === tab).slice(0, 8);
  }, [tab, shopItems]);

  const viewAll = tab === "destacados" ? "/tienda" : `/tienda?c=${tab}`;

  return (
    <section className="cg-section cg-section--leaf" aria-labelledby="mas-vendidos">
      <div className="cg-container">
        <div className="cg-heading cg-heading--center">
          <p className="cg-eyebrow">{t("Selección Corredera", "Corredera selection")}</p>
          <h2 id="mas-vendidos" className="cg-heading__title">{t("Los más vendidos", "Our best sellers")}</h2>
          <p className="cg-heading__text">{t("¿Te vas a poder resistir?", "Can you resist?")}</p>
        </div>
        <div className="cg-tabs" role="tablist" aria-label={t("Filtrar productos", "Filter products")}>
          {tabs.map((tb) => (
            <button key={tb.id} type="button" role="tab" aria-selected={tab === tb.id} onClick={() => setTab(tb.id)}>
              {tb.label}
            </button>
          ))}
        </div>
        <div className="cg-grid cg-grid--4" role="tabpanel">
          {visible.map((item, i) => (
            <ProductCard key={item.id} item={item} eager={i < 4} />
          ))}
        </div>
        <div className="cg-center">
          <Link href={viewAll} className="cg-btn cg-btn--outline">
            {t("Ver todos los productos", "View all products")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Why Corredera */

function WhyCorredera() {
  const { settings } = useStore();
  const t = useT();
  const pillars = [
    {
      icon: Award,
      title: t("Las grandes casas ibéricas", "The great Iberian houses"),
      text: t(
        "Seleccionamos piezas de 5 Jotas, Joselito, Dehesa de Extremadura y Cebo de Campo por su curación, infiltración y aroma.",
        "We select pieces from 5 Jotas, Joselito, Dehesa de Extremadura and Cebo de Campo for their curing, marbling and aroma.",
      ),
    },
    {
      icon: Hand,
      title: t("Corte a cuchillo", "Hand-carved"),
      text: t(
        "Nuestro equipo corta tu jamón a mano, loncha a loncha, y te lo entrega envasado al vacío sin coste adicional.",
        "Our team carves your ham by hand, slice by slice, and vacuum-packs it at no extra cost.",
      ),
    },
    {
      icon: Gift,
      title: t("Selección gourmet", "Gourmet selection"),
      text: t(
        "Embutidos de bellota, quesos nacionales y europeos y aceites de oliva virgen extra elegidos uno a uno.",
        "Acorn-fed charcuterie, Spanish and European cheeses and extra virgin olive oils chosen one by one.",
      ),
    },
    {
      icon: Store,
      title: t("En el centro de Madrid", "In central Madrid"),
      text: t(
        "Te atendemos en Calle de la Puebla, 15, entre Gran Vía y Malasaña, y te confirmamos cada encargo personalmente.",
        "We serve you at Calle de la Puebla, 15, between Gran Vía and Malasaña, and confirm each order personally.",
      ),
    },
  ];

  return (
    <section className="cg-section cg-section--cream" aria-labelledby="por-que">
      <div className="cg-container">
        <div className="cg-heading cg-heading--center">
          <h2 id="por-que" className="cg-heading__title">{t("¿Por qué Corredera?", "Why Corredera?")}</h2>
          <p className="cg-heading__text">{t("La combinación perfecta entre selección, oficio y servicio", "The perfect blend of selection, craft and service")}</p>
        </div>
        <div className="cg-why">
          <div className="cg-why__col">
            {pillars.slice(0, 2).map(({ icon: Icon, title, text }) => (
              <div key={title} className="cg-why__item">
                <Icon size={34} strokeWidth={1} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="cg-why__media">
            <img src={settings.pages.whyImageUrl} alt={t("Jamón ibérico de bellota entero", "Whole acorn-fed Iberian ham")} loading="lazy" decoding="async" width={1000} height={800} />
          </div>
          <div className="cg-why__col">
            {pillars.slice(2).map(({ icon: Icon, title, text }) => (
              <div key={title} className="cg-why__item">
                <Icon size={34} strokeWidth={1} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Carving service */

function CarvingService() {
  const { whatsappHref, track, settings, lang } = useStore();
  const t = useT();
  const steps = [
    { icon: Scissors, title: t("Elige tu pieza", "Choose your ham"), text: t("5 Jotas, Joselito, Extremadura o Cebo de Campo.", "5 Jotas, Joselito, Extremadura or Cebo de Campo.") },
    { icon: Hand, title: t("La cortamos a cuchillo", "We hand-carve it"), text: t("Lonchas finas, tacos y hueso aprovechable.", "Thin slices, trimmings and the bone.") },
    { icon: Package, title: t("Envasado al vacío", "Vacuum packed"), text: t("Sobres listos para disfrutar durante meses.", "Packs ready to enjoy for months.") },
  ];
  return (
    <section id="servicio-corte" className="cg-feature" aria-labelledby="servicio-corte-title">
      <img src={settings.pages.carvingImageUrl} srcSet={heroSrcSet(settings.pages.carvingImageUrl)} sizes="100vw" alt={t("Corte de jamón ibérico a cuchillo", "Hand-carving Iberian ham")} className="cg-feature__bg" loading="lazy" decoding="async" />
      <div className="cg-container cg-feature__inner">
        <div className="cg-feature__card">
          <p className="cg-eyebrow cg-eyebrow--light">{t("Servicio exclusivo", "Exclusive service")}</p>
          <h2 id="servicio-corte-title">{lang === "en" ? settings.pages.carvingTitleEn : settings.pages.carvingTitleEs}</h2>
          <p>{lang === "en" ? settings.pages.carvingTextEn : settings.pages.carvingTextEs}</p>
          <ol className="cg-steps">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="cg-steps__num">{i + 1}</span>
                <span>
                  <strong>
                    <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> {title}
                  </strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="cg-feature__actions">
            <Link href="/servicio-corte-jamon" className="cg-btn cg-btn--light">
              {t("Cómo funciona el corte", "How carving works")}
            </Link>
            <a
              href={whatsappHref(t("Hola Corredera Gourmet, quisiera información sobre el servicio de corte de jamón.", "Hello Corredera Gourmet, I'd like information about the ham carving service."))}
              target="_blank"
              rel="noreferrer"
              className="cg-btn cg-btn--ghost-light"
              onClick={() => track("whatsapp_click")}
            >
              {t("Consultar por WhatsApp", "Ask on WhatsApp")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Departments */

function Departments() {
  const { lang, settings } = useStore();
  const t = useT();
  return (
    <section className="cg-section" aria-labelledby="nuestros-productos">
      <div className="cg-container">
        <SectionHeading
          title={t("Nuestros productos", "Our products")}
          text={t(
            "Alta charcutería ibérica, quesos, aceites de oliva virgen extra, carnicería y frutería. Todo listo para recoger en tienda o recibir en casa.",
            "Fine Iberian charcuterie, cheeses, extra virgin olive oils, butcher and greengrocer. Ready for store pickup or home delivery.",
          )}
        />
        <div className="cg-depts">
          {departmentsWithImages(settings.pages.departmentImages)
            // Butcher and greengrocer have their own section right below.
            .filter((d) => d.slug !== "carniceria" && d.slug !== "fruteria")
            .map((d, i) => (
            <Link key={d.slug} href={d.href} className={`cg-dept${i === 0 ? " cg-dept--wide" : ""}`}>
              <img src={d.image} alt={lang === "en" ? d.en : d.es} loading="lazy" decoding="async" />
              <span className="cg-dept__label">
                <span className="cg-dept__title">{lang === "en" ? d.en : d.es}</span>
                <span className="cg-dept__desc">{lang === "en" ? d.descEn : d.descEs}</span>
              </span>
            </Link>
          ))}
          <Link href="/tienda" className="cg-dept cg-dept--all">
            <span className="cg-dept__label">
              <span className="cg-dept__title">{t("Toda la tienda", "Shop all")}</span>
              <span className="cg-dept__desc">{t("Conservas, vinos y más", "Preserves, wines and more")}</span>
            </span>
            <ArrowRight size={22} strokeWidth={1.25} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Fresh market (butcher & greengrocer) */

function FreshMarket() {
  const { lang, settings, whatsappHref, track } = useStore();
  const t = useT();
  const images = new Map<string, string>(departmentsWithImages(settings.pages.departmentImages).map((d) => [d.slug, d.image]));
  const shops = [
    {
      slug: "carniceria",
      href: "/gourmet/carniceria",
      title: t("Carnicería", "Butcher"),
      text: t(
        "Ternera, cerdo ibérico fresco, pollo, cordero y hamburguesas caseras, cortados al momento como los pidas.",
        "Beef, fresh Iberian pork, chicken, lamb and homemade burgers, cut to order the way you like.",
      ),
      wa: t("Hola Corredera, quisiera hacer un encargo de carnicería:", "Hello Corredera, I'd like to order from the butcher:"),
    },
    {
      slug: "fruteria",
      href: "/gourmet/fruteria",
      title: t("Frutería", "Greengrocer"),
      text: t(
        "Fruta de temporada, verdura fresca, frutos rojos y cestas de fruta por encargo, seleccionadas cada día.",
        "Seasonal fruit, fresh vegetables, berries and fruit baskets to order, selected every day.",
      ),
      wa: t("Hola Corredera, quisiera hacer un encargo de frutería:", "Hello Corredera, I'd like to order from the greengrocer:"),
    },
  ];
  return (
    <section id="mercado" className="cg-section cg-section--cream" aria-labelledby="mercado-title">
      <div className="cg-container">
        <div className="cg-heading cg-heading--center">
          <p className="cg-eyebrow">{t("En el mismo local", "Under the same roof")}</p>
          <h2 id="mercado-title" className="cg-heading__title">{t("Carnicería y frutería", "Butcher & greengrocer")}</h2>
          <p className="cg-heading__text">
            {t(
              "Haz toda la compra en Calle de la Puebla, 15: carne cortada al momento y fruta y verdura fresca junto a nuestra tienda gourmet.",
              "Do all your shopping at Calle de la Puebla, 15: meat cut to order and fresh produce next to our gourmet shop.",
            )}
          </p>
        </div>
        <div className="cg-market">
          {shops.map((s) => (
            <article key={s.slug} className="cg-market__card">
              <Link href={s.href} className="cg-market__media" tabIndex={-1} aria-hidden="true">
                <img src={images.get(s.slug)} alt={s.title} loading="lazy" decoding="async" width={1000} height={800} />
              </Link>
              <div className="cg-market__body">
                <h3>
                  <Link href={s.href}>{s.title}</Link>
                </h3>
                <p>{s.text}</p>
                <div className="cg-market__actions">
                  <Link href={s.href} className="cg-btn cg-btn--primary">
                    {lang === "en" ? "See products" : "Ver productos"}
                  </Link>
                  <a className="cg-btn cg-btn--wa-outline" href={whatsappHref(s.wa)} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
                    <MessageCircle size={16} aria-hidden="true" /> {t("Encargar", "Order")}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Seasonal campaign (CMS) */

function SeasonalCampaign() {
  const { settings, lang, whatsappHref, track } = useStore();
  const c = settings.seasonalCampaign;
  if (!c.enabled || settings.sectionVisibility.seasonalCampaign === false) return null;
  const es = lang === "es";
  return (
    <section className="cg-section cg-section--tight" aria-label={es ? c.badgeEs : c.badgeEn}>
      <div className="cg-container">
        <div className="cg-campaign">
          <img src={c.imageUrl} alt={es ? c.titleEs : c.titleEn} loading="lazy" />
          <div>
            <p className="cg-eyebrow">{es ? c.badgeEs : c.badgeEn}</p>
            <h2>{es ? c.titleEs : c.titleEn}</h2>
            <p>{es ? c.descriptionEs : c.descriptionEn}</p>
            <a className="cg-btn cg-btn--wa" href={whatsappHref(es ? c.whatsappPrefillEs : c.whatsappPrefillEn)} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
              <MessageCircle size={18} aria-hidden="true" /> {es ? c.ctaTextEs : c.ctaTextEn}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- How to order */

function HowToOrder() {
  const { settings, lang } = useStore();
  const t = useT();
  const steps = [
    { icon: Gift, title: t("1. Elige", "1. Choose"), text: t("Añade a tu pedido jamones, embutidos, quesos, aceites, carne o fruta.", "Add hams, charcuterie, cheeses, oils, meat or fruit to your order.") },
    { icon: MessageCircle, title: t("2. Envía por WhatsApp", "2. Send via WhatsApp"), text: t("Tu pedido llega con todos los detalles. Te confirmamos disponibilidad, peso e importe.", "Your order arrives with every detail. We confirm availability, weight and amount.") },
    { icon: Truck, title: t("3. Recoge o recibe", "3. Pick up or receive"), text: t("Recógelo en Calle de la Puebla, 15 o recíbelo en casa. Pagas al recoger o a la entrega.", "Collect it at Calle de la Puebla, 15 or get it delivered. Pay on pickup or delivery.") },
  ];
  return (
    <section id="como-encargar" className="cg-section cg-section--cream" aria-labelledby="como-encargar-title">
      <div className="cg-container">
        <div className="cg-heading cg-heading--center">
          <p className="cg-eyebrow">{t("Encargos y envíos", "Orders & delivery")}</p>
          <h2 id="como-encargar-title" className="cg-heading__title">{t("Así de fácil es encargar", "Ordering is this easy")}</h2>
        </div>
        <div className="cg-howto">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="cg-howto__item">
              <span className="cg-howto__icon">
                <Icon size={26} strokeWidth={1.25} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="cg-note">{lang === "en" ? settings.contact.shippingNoticeEn : settings.contact.shippingNoticeEs}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- About */

function About() {
  const { settings, lang } = useStore();
  const t = useT();
  const p = settings.pages;
  const text2 = lang === "en" ? p.aboutText2En : p.aboutText2Es;
  return (
    <section id="nosotros" className="cg-section" aria-labelledby="nosotros-title">
      <div className="cg-container cg-story">
        <div className="cg-story__card">
          <p className="cg-eyebrow">{t("Sobre nosotros", "About us")}</p>
          <h2 id="nosotros-title">{lang === "en" ? p.aboutTitleEn : p.aboutTitleEs}</h2>
          <p>{lang === "en" ? p.aboutText1En : p.aboutText1Es}</p>
          {text2 && <p>{text2}</p>}
          <Link href="/tienda" className="cg-link-arrow">
            {t("Descubrir la selección", "Discover the selection")}
          </Link>
        </div>
        <div className="cg-story__media">
          <img src={p.aboutImageUrl} alt={t("Corredera Gourmet en Calle de la Puebla, 15", "Corredera Gourmet at Calle de la Puebla, 15")} loading="lazy" decoding="async" width={640} height={480} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Bakery (secondary) */

function BakeryTeaser() {
  const { itemById, lang } = useStore();
  const t = useT();
  const highlights = ["d6", "d5", "t9"]
    .map((id) => itemById.get(id))
    .filter((i): i is MenuItem => Boolean(i));
  return (
    <section className="cg-section cg-section--tight" aria-labelledby="bakery-title">
      <div className="cg-container">
        <div className="cg-bakery">
          <div className="cg-bakery__icon">
            <Coffee size={30} strokeWidth={1.25} aria-hidden="true" />
          </div>
          <div className="cg-bakery__copy">
            <p className="cg-eyebrow">{t("También en Corredera", "Also at Corredera")}</p>
            <h2 id="bakery-title">{t("Bakery & Café", "Bakery & Café")}</h2>
            <p>{t("Desayunos, café de especialidad, bollería y tartas artesanas para disfrutar en nuestro local.", "Breakfasts, specialty coffee, pastries and artisan cakes to enjoy in store.")}</p>
          </div>
          <ul className="cg-bakery__list">
            {highlights.map((item) => (
              <li key={item.id}>
                <Link href={productPath(item.id)} className="cg-bakery__item">
                  <img src={itemImage(item)} alt={lang === "en" ? item.nameEn : item.name} width={56} height={56} loading="lazy" decoding="async" />
                  <span>{lang === "en" ? item.nameEn : item.name.replace(/^Promoción\s+/i, "")}</span>
                </Link>
                <strong>{item.price}</strong>
              </li>
            ))}
          </ul>
          <Link href="/bakery-cafe" className="cg-btn cg-btn--outline">
            {t("Ver la carta", "View the menu")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Visit */

function Visit() {
  const { settings, lang, whatsappHref, track } = useStore();
  const t = useT();
  const s = settings.schedule;
  const es = lang === "es";
  return (
    <section id="visitanos" className="cg-section cg-section--cream" aria-labelledby="visitanos-title">
      <div className="cg-container cg-visit">
        <div>
          <p className="cg-eyebrow">{t("Visítanos", "Visit us")}</p>
          <h2 id="visitanos-title" className="cg-heading__title">{settings.contact.addressLine}</h2>
          <p className="cg-visit__note">{es ? settings.contact.neighborhoodNoteEs : settings.contact.neighborhoodNoteEn}</p>
          <div className="cg-visit__actions">
            <a className="cg-btn cg-btn--primary" href={settings.contact.googleMapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}>
              <MapPin size={16} aria-hidden="true" /> {t("Cómo llegar", "Get directions")}
            </a>
            <a className="cg-btn cg-btn--outline" href={`tel:${settings.contact.landlineNumber}`} onClick={() => track("phone_click")}>
              <Phone size={16} aria-hidden="true" /> {settings.contact.landlineDisplay}
            </a>
            <a className="cg-btn cg-btn--outline" href={whatsappHref(t("Hola Corredera Gourmet", "Hello Corredera Gourmet"))} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
          </div>
          <p className="cg-visit__review">
            <a className="cg-inline-link" href={settings.contact.googleMapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}>
              {t("Déjanos tu reseña en Google", "Leave us a Google review")}
            </a>
          </p>
        </div>
        <div className="cg-hours">
          <div>
            <h3>{t("Tienda gourmet, carnicería y frutería", "Gourmet shop, butcher & greengrocer")}</h3>
            <p>{es ? s.gourmetHoursEs : s.gourmetHoursEn}</p>
            <p className="cg-hours__muted">{es ? s.gourmetClosedNoteEs : s.gourmetClosedNoteEn}</p>
          </div>
          <div>
            <h3>{t("Bakery & Café", "Bakery & Café")}</h3>
            <p>{es ? s.bakeryWeekdaysEs : s.bakeryWeekdaysEn}</p>
            <p>{es ? s.bakeryWeekendEs : s.bakeryWeekendEn}</p>
            <p>{es ? s.bakerySundayEs : s.bakerySundayEn}</p>
          </div>
          {(es ? s.specialHolidayHoursEs : s.specialHolidayHoursEn) && (
            <p className="cg-hours__special">{es ? s.specialHolidayHoursEs : s.specialHolidayHoursEn}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- FAQ */

function Faq() {
  const { settings, lang } = useStore();
  const t = useT();
  const faqs = homeFaqs(settings.contact, lang);
  return (
    <section className="cg-section" aria-labelledby="faq-title">
      <div className="cg-container cg-container--narrow">
        <SectionHeading title={t("Preguntas frecuentes", "Frequently asked questions")} />
        <div className="cg-faq">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { lang } = useStore();
  const meta = homeMeta(lang);
  usePageMeta(meta.title, meta.description);

  return (
    <StoreLayout trust={false}>
      <Hero />
      <InfoBar />
      <ChristmasBanner />
      <BestSellers />
      <WhyCorredera />
      <CarvingService />
      <Departments />
      <FreshMarket />
      <SeasonalCampaign />
      <HowToOrder />
      <About />
      <BakeryTeaser />
      <Visit />
      <Faq />
    </StoreLayout>
  );
}
