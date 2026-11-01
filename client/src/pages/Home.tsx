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
import { FEATURED_IDS, type MenuItem } from "../../../shared/catalog";
import type { HeroSlide } from "../../../shared/siteSettingsSchema";
import { AnchorLink } from "../storefront/components/AnchorLink";
import { ProductCard } from "../storefront/components/ProductCard";
import { SectionHeading, StoreLayout } from "../storefront/components/StoreLayout";
import { isShopItem, NAV_DEPARTMENTS, type ShopCategoryId } from "../storefront/data";
import { usePageMeta, useT } from "../storefront/hooks";
import { useStore } from "../storefront/StoreContext";

/* ---------------------------------------------------------------- Hero */

type Slide = HeroSlide & { video?: { desktop: string; mobile: string } };

/** The signature ham video plays behind the default first slide while it keeps its original image. */
const HAM_VIDEO = { desktop: "/assets/jamon-hero.mp4", mobile: "/assets/jamon-hero-mobile.mp4" };
function HeroVideo({ slide, active }: { slide: Slide; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!slide.video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setSrc(window.matchMedia("(max-width: 720px)").matches ? slide.video.mobile : slide.video.desktop);
  }, [slide.video]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => undefined);
    else v.pause();
  }, [active, src]);

  if (!src) return null;
  return <video ref={ref} className="cg-hero__video" src={src} poster={slide.imageUrl} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" />;
}

function Hero() {
  const { lang, settings } = useStore();
  const t = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const SLIDES = useMemo<Slide[]>(() => {
    const visible = settings.storefront.heroSlides.filter((s) => s.visible);
    const list = visible.length > 0 ? visible : settings.storefront.heroSlides.slice(0, 1);
    return list.map((s) => (s.imageUrl === "/assets/jamon-hero-start.jpg" ? { ...s, video: HAM_VIDEO } : s));
  }, [settings.storefront.heroSlides]);
  const current = index % SLIDES.length;

  useEffect(() => {
    if (paused || SLIDES.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => window.clearInterval(id);
  }, [paused, SLIDES.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  const tiles = [
    {
      href: "/tienda",
      title: t("Tienda gourmet", "Gourmet shop"),
      text: t("Ibéricos, quesos y aceites seleccionados", "Selected Iberian ham, cheeses and oils"),
      image: "/assets/products/em3.jpg",
    },
    {
      anchor: "servicio-corte",
      title: t("Servicio de corte", "Carving service"),
      text: t("Gratis con tu jamón entero", "Free with your whole ham"),
      image: "/assets/products/sj2.jpg",
    },
    {
      href: "/bakery-cafe",
      title: t("Carta & Café", "Menu & Café"),
      text: t("Desayunos, café y obrador en tienda", "Breakfast, coffee and bakery in store"),
      image: "/assets/corredera-bakery-interior.jpg",
    },
  ];

  return (
    <section className="cg-hero" aria-roledescription="carousel" aria-label={t("Destacados", "Highlights")}>
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
              <img src={slide.imageUrl} alt="" className="cg-hero__img" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              {slide.video && <HeroVideo slide={slide} active={i === current} />}
              <div className="cg-hero__caption">
                {i === 0 ? (
                  <h1 className="cg-hero__title">{lang === "en" ? slide.titleEn : slide.titleEs}</h1>
                ) : (
                  <p className="cg-hero__title">{lang === "en" ? slide.titleEn : slide.titleEs}</p>
                )}
                <p className="cg-hero__text">{lang === "en" ? slide.textEn : slide.textEs}</p>
                {slide.href.startsWith("/#") ? (
                  <AnchorLink to={slide.href.slice(2)} className="cg-btn cg-btn--primary">
                    {lang === "en" ? slide.ctaEn : slide.ctaEs}
                  </AnchorLink>
                ) : (
                  <Link href={slide.href} className="cg-btn cg-btn--primary">
                    {lang === "en" ? slide.ctaEn : slide.ctaEs}
                  </Link>
                )}
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
                <img src={tile.image} alt="" loading="lazy" decoding="async" />
                <span className="cg-tile__body">
                  <span className="cg-tile__title">{tile.title}</span>
                  <span className="cg-tile__text">{tile.text}</span>
                </span>
                <ArrowRight className="cg-tile__arrow" size={18} aria-hidden="true" />
              </>
            );
            return tile.anchor ? (
              <AnchorLink key={tile.title} to={tile.anchor} className="cg-tile">
                {inner}
              </AnchorLink>
            ) : (
              <Link key={tile.title} href={tile.href!} className="cg-tile">
                {inner}
              </Link>
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
      const rank = (id: string) => {
        const i = (FEATURED_IDS as readonly string[]).indexOf(id);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
      };
      const starred = shopItems.filter((i) => i.featured).sort((a, b) => rank(a.id) - rank(b.id));
      if (starred.length > 0) return starred.slice(0, 8);
      const byId = new Map(shopItems.map((i) => [i.id, i]));
      return FEATURED_IDS.map((id) => byId.get(id)).filter((i): i is MenuItem => Boolean(i)).slice(0, 8);
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
            <img src="/assets/products/je1.jpg" alt={t("Jamón ibérico de bellota entero", "Whole acorn-fed Iberian ham")} loading="lazy" width={1000} height={800} />
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
  const { whatsappHref, track } = useStore();
  const t = useT();
  const steps = [
    { icon: Scissors, title: t("Elige tu pieza", "Choose your ham"), text: t("5 Jotas, Joselito, Extremadura o Cebo de Campo.", "5 Jotas, Joselito, Extremadura or Cebo de Campo.") },
    { icon: Hand, title: t("La cortamos a cuchillo", "We hand-carve it"), text: t("Lonchas finas, tacos y hueso aprovechable.", "Thin slices, trimmings and the bone.") },
    { icon: Package, title: t("Envasado al vacío", "Vacuum packed"), text: t("Sobres listos para disfrutar durante meses.", "Packs ready to enjoy for months.") },
  ];
  return (
    <section id="servicio-corte" className="cg-feature" aria-labelledby="servicio-corte-title">
      <img src="/assets/jamon-hero-start.jpg" alt="" className="cg-feature__bg" loading="lazy" />
      <div className="cg-container cg-feature__inner">
        <div className="cg-feature__card">
          <p className="cg-eyebrow cg-eyebrow--light">{t("Servicio exclusivo", "Exclusive service")}</p>
          <h2 id="servicio-corte-title">{t("Tu jamón, cortado a cuchillo y envasado al vacío. Gratis.", "Your ham, hand-carved and vacuum packed. Free.")}</h2>
          <p>
            {t(
              "Al encargar cualquiera de nuestros jamones enteros te regalamos el corte profesional a cuchillo y el envasado al vacío en sobres. Toda la pieza, lista para servir y sin esfuerzo.",
              "When you order any of our whole hams we include professional hand-carving and vacuum packing at no cost. The whole piece, ready to serve, effortlessly.",
            )}
          </p>
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
            <Link href="/gourmet/jamones" className="cg-btn cg-btn--light">
              {t("Ver jamones enteros", "See whole hams")}
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
  const { lang } = useStore();
  const t = useT();
  return (
    <section className="cg-section" aria-labelledby="nuestros-productos">
      <div className="cg-container">
        <SectionHeading
          title={t("Nuestros productos", "Our products")}
          text={t(
            "Alta charcutería ibérica, quesos seleccionados y aceites de oliva virgen extra. Todo listo para recoger en tienda o recibir en casa.",
            "Fine Iberian charcuterie, selected cheeses and extra virgin olive oils. Ready for store pickup or home delivery.",
          )}
        />
        <div className="cg-depts">
          {NAV_DEPARTMENTS.map((d, i) => (
            <Link key={d.slug} href={d.href} className={`cg-dept${i === 0 ? " cg-dept--wide" : ""}`}>
              <img src={d.image} alt="" loading="lazy" decoding="async" />
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
          <img src={c.imageUrl} alt="" loading="lazy" />
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
    { icon: Gift, title: t("1. Elige", "1. Choose"), text: t("Añade a tu pedido jamones, loncheados, embutidos, quesos o aceites.", "Add hams, sliced packs, charcuterie, cheeses or oils to your order.") },
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
  const t = useT();
  return (
    <section id="nosotros" className="cg-section" aria-labelledby="nosotros-title">
      <div className="cg-container cg-story">
        <div className="cg-story__card">
          <p className="cg-eyebrow">{t("Sobre nosotros", "About us")}</p>
          <h2 id="nosotros-title">{t("Somos Corredera", "We are Corredera")}</h2>
          <p>
            {t(
              "En pleno centro de Madrid, en Calle de la Puebla, 15, Corredera Gourmet nace para acercar a cada cliente lo mejor de la despensa española: jamones ibéricos de las casas más reconocidas, embutidos de bellota, quesos de autor y aceites de oliva virgen extra.",
              "In the heart of Madrid, at Calle de la Puebla, 15, Corredera Gourmet was born to bring the best of the Spanish pantry to every customer: Iberian hams from the most renowned houses, acorn-fed charcuterie, artisan cheeses and extra virgin olive oils.",
            )}
          </p>
          <p>
            {t(
              "Cortamos a cuchillo, envasamos al vacío y preparamos cada encargo como si fuera para nuestra propia mesa. Y para empezar el día, nuestro obrador y cafetería te esperan con café recién hecho y bollería artesana.",
              "We hand-carve, vacuum-pack and prepare every order as if it were for our own table. And to start your day, our bakery and café await with fresh coffee and artisan pastries.",
            )}
          </p>
          <Link href="/tienda" className="cg-link-arrow">
            {t("Descubrir la selección", "Discover the selection")}
          </Link>
        </div>
        <div className="cg-story__media">
          <img src="/assets/corredera-bakery-interior.jpg" alt={t("Interior de Corredera en Calle de la Puebla, 15", "Inside Corredera at Calle de la Puebla, 15")} loading="lazy" width={640} height={480} />
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
                <span>{lang === "en" ? item.nameEn : item.name.replace(/^Promoción\s+/i, "")}</span>
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
        </div>
        <div className="cg-hours">
          <div>
            <h3>{t("Tienda gourmet", "Gourmet shop")}</h3>
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
  const faqs = [
    {
      q: t("¿El corte y envasado del jamón entero tiene coste?", "Does carving and packing a whole ham cost extra?"),
      a: t(
        "No. Al encargar cualquiera de nuestros jamones enteros, el corte a cuchillo y el envasado al vacío son gratuitos. También puedes llevarte la pieza entera sin empezar.",
        "No. When you order any of our whole hams, hand-carving and vacuum packing are free. You can also take the whole uncut piece.",
      ),
    },
    {
      q: t("¿Cómo pago mi pedido?", "How do I pay for my order?"),
      a: t(
        "No hay pago online. Enviamos tu pedido por WhatsApp, te confirmamos disponibilidad e importe y pagas al recoger en tienda o a la entrega.",
        "There is no online payment. Your order is sent via WhatsApp, we confirm availability and amount, and you pay on pickup or delivery.",
      ),
    },
    {
      q: t("¿Hacéis envíos a domicilio?", "Do you deliver?"),
      a: lang === "en" ? settings.contact.shippingNoticeEn : settings.contact.shippingNoticeEs,
    },
    {
      q: t("¿Cómo funcionan los productos al peso?", "How do items sold by weight work?"),
      a: t(
        "Embutidos y quesos al corte se venden por kilo. Indícanos la cantidad aproximada y te confirmaremos el peso exacto y el importe final antes de preparar el pedido.",
        "Charcuterie and cheeses cut to order are sold per kilo. Tell us the approximate amount and we will confirm the exact weight and final price before preparing your order.",
      ),
    },
  ];
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
  const t = useT();
  usePageMeta(
    t(
      "Corredera Gourmet | Jamones ibéricos, embutidos, quesos y aceites en Madrid",
      "Corredera Gourmet | Iberian hams, charcuterie, cheeses and olive oils in Madrid",
    ),
    t(
      "Tienda gourmet en Calle de la Puebla 15, Madrid: jamones 5 Jotas y Joselito con corte a cuchillo y envasado al vacío gratis, loncheados de 100 g, embutidos de bellota, quesos y aceites AOVE. Recogida o envío a domicilio.",
      "Gourmet shop at Calle de la Puebla 15, Madrid: 5 Jotas and Joselito hams with free hand-carving and vacuum packing, 100 g sliced packs, acorn-fed charcuterie, cheeses and EVOO. Pickup or home delivery.",
    ),
  );

  return (
    <StoreLayout>
      <Hero />
      <InfoBar />
      <BestSellers />
      <WhyCorredera />
      <CarvingService />
      <Departments />
      <SeasonalCampaign />
      <HowToOrder />
      <About />
      <BakeryTeaser />
      <Visit />
      <Faq />
    </StoreLayout>
  );
}
