import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { HeroSlide } from "../../../../shared/siteSettingsSchema";
import { useSettingsDraft } from "../shared";
import { Button, Card, Field, ImageUpload, Input, Loading, PageHeader, SaveBar, Select, Textarea, Toggle } from "../ui";

export const LINK_OPTIONS = [
  { value: "/tienda", label: "Toda la tienda" },
  { value: "/gourmet/jamones", label: "Jamones" },
  { value: "/gourmet/jamon-cortado", label: "Jamón cortado" },
  { value: "/gourmet/sobres-jamon", label: "Loncheados de jamón" },
  { value: "/gourmet/embutidos", label: "Embutidos" },
  { value: "/gourmet/sobres-embutidos", label: "Embutidos loncheados" },
  { value: "/gourmet/quesos", label: "Quesos" },
  { value: "/gourmet/aceites", label: "Aceites" },
  { value: "/bakery-cafe", label: "Carta Bakery & Café" },
  { value: "/#servicio-corte", label: "Servicio de corte (portada)" },
  { value: "/#como-encargar", label: "Cómo encargar (portada)" },
  { value: "/#visitanos", label: "Visítanos (portada)" },
];

function LinkPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = LINK_OPTIONS.some((o) => o.value === value);
  return (
    <div className="adm-price">
      <Select value={known ? value : "__custom"} onChange={(e) => e.target.value !== "__custom" && onChange(e.target.value)}>
        {LINK_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="__custom">Otra página (escribir ruta)…</option>
      </Select>
      {!known && <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/producto/je1" />}
    </div>
  );
}

const blankSlide = (): HeroSlide => ({
  id: `slide-${Date.now().toString(36)}`,
  imageUrl: "/assets/jamon-hero-end.jpg",
  titleEs: "Nuevo destacado",
  titleEn: "New highlight",
  textEs: "Describe aquí la novedad, el producto o la promoción.",
  textEn: "Describe the news, product or promotion here.",
  ctaEs: "Descubrir",
  ctaEn: "Discover",
  href: "/tienda",
  visible: true,
});

export function HomepageSection() {
  const { draft, update, dirty, commit, discard, saving, loading } = useSettingsDraft();
  if (loading || !draft) return <Loading />;
  const slides = draft.storefront.heroSlides;
  const announcements = draft.storefront.announcements;

  const setSlides = (next: HeroSlide[]) => update("storefront", { ...draft.storefront, heroSlides: next });
  const setSlide = (i: number, patch: Partial<HeroSlide>) => setSlides(slides.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...slides];
    const [s] = next.splice(i, 1);
    next.splice(i + dir, 0, s);
    setSlides(next);
  };
  const setAnn = (i: number, patch: Partial<(typeof announcements)[number]>) =>
    update("storefront", { ...draft.storefront, announcements: announcements.map((a, j) => (j === i ? { ...a, ...patch } : a)) });

  return (
    <>
      <PageHeader
        title="Portada y avisos"
        subtitle="Lo primero que ven tus clientes: la barra de avisos superior y las imágenes grandes del carrusel."
        actions={
          <a className="adm-btn adm-btn--secondary adm-btn--md" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Ver portada
          </a>
        }
      />

      <Card
        title="Barra de avisos"
        subtitle="Mensajes que van rotando en la franja superior de toda la web (máx. 5). Si activas un evento, aparece el primero."
        actions={
          announcements.length < 5 && (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => update("storefront", { ...draft.storefront, announcements: [...announcements, { textEs: "Nuevo aviso", textEn: "New notice" }] })}>
              Añadir aviso
            </Button>
          )
        }
      >
        <div className="adm-stack">
          {announcements.map((a, i) => (
            <div key={i} className="adm-repeat">
              <span className="adm-repeat__n">{i + 1}</span>
              <div className="adm-form adm-form--flat">
                <Field label="Texto en español">
                  <Input value={a.textEs} onChange={(e) => setAnn(i, { textEs: e.target.value })} maxLength={140} />
                </Field>
                <Field label="Texto en inglés">
                  <Input value={a.textEn} onChange={(e) => setAnn(i, { textEn: e.target.value })} maxLength={140} />
                </Field>
              </div>
              <button
                type="button"
                className="adm-icon-btn"
                aria-label="Eliminar aviso"
                disabled={announcements.length <= 1}
                onClick={() => update("storefront", { ...draft.storefront, announcements: announcements.filter((_, j) => j !== i) })}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Carrusel de la portada"
        subtitle="Diapositivas grandes de la parte superior. Puedes cambiar foto, textos, botón y orden (máx. 6)."
        actions={
          slides.length < 6 && (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setSlides([...slides, blankSlide()])}>
              Añadir diapositiva
            </Button>
          )
        }
      >
        <div className="adm-stack">
          {slides.map((s, i) => (
            <div key={s.id} className={`adm-slide${s.visible ? "" : " is-off"}`}>
              <div className="adm-slide__head">
                <strong>Diapositiva {i + 1}</strong>
                <div className="adm-slide__tools">
                  <Toggle checked={s.visible} onChange={(v) => setSlide(i, { visible: v })} label={s.visible ? "Visible" : "Oculta"} />
                  <button type="button" className="adm-icon-btn" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" className="adm-icon-btn" aria-label="Bajar" disabled={i === slides.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={16} />
                  </button>
                  <button type="button" className="adm-icon-btn" aria-label="Eliminar" disabled={slides.length <= 1} onClick={() => setSlides(slides.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="adm-slide__body">
                <ImageUpload value={s.imageUrl} onChange={(url) => setSlide(i, { imageUrl: url })} aspect="16 / 10" label="Imagen (horizontal)" />
                <div className="adm-form">
                  <Field label="Título">
                    <Input value={s.titleEs} onChange={(e) => setSlide(i, { titleEs: e.target.value })} maxLength={90} />
                  </Field>
                  <Field label="Title (inglés)">
                    <Input value={s.titleEn} onChange={(e) => setSlide(i, { titleEn: e.target.value })} maxLength={90} />
                  </Field>
                  <Field label="Texto">
                    <Textarea value={s.textEs} onChange={(e) => setSlide(i, { textEs: e.target.value })} maxLength={220} rows={2} />
                  </Field>
                  <Field label="Text (inglés)">
                    <Textarea value={s.textEn} onChange={(e) => setSlide(i, { textEn: e.target.value })} maxLength={220} rows={2} />
                  </Field>
                  <Field label="Botón">
                    <Input value={s.ctaEs} onChange={(e) => setSlide(i, { ctaEs: e.target.value })} maxLength={40} />
                  </Field>
                  <Field label="Button (inglés)">
                    <Input value={s.ctaEn} onChange={(e) => setSlide(i, { ctaEn: e.target.value })} maxLength={40} />
                  </Field>
                  <Field label="El botón lleva a" span={2}>
                    <LinkPicker value={s.href} onChange={(v) => setSlide(i, { href: v })} />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void commit()} onDiscard={discard} />
    </>
  );
}
