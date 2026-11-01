import { ExternalLink } from "lucide-react";
import { NAV_DEPARTMENTS } from "../../storefront/data";
import type { PagesContent } from "../../../../shared/siteSettingsSchema";
import { useSettingsDraft } from "../shared";
import { Card, Field, ImageUpload, Input, Loading, PageHeader, SaveBar, Select, Textarea } from "../ui";
import { LINK_OPTIONS } from "./Homepage";

export function PagesContentSection() {
  const { draft, patch, dirty, commit, discard, saving, loading } = useSettingsDraft();
  if (loading || !draft) return <Loading />;
  const p = draft.pages;
  const set = (partial: Partial<PagesContent>) => patch("pages", partial);
  const setTile = (i: number, partial: Partial<PagesContent["homeTiles"][number]>) =>
    set({ homeTiles: p.homeTiles.map((t, j) => (j === i ? { ...t, ...partial } : t)) });
  const deptImage = (slug: string) => p.departmentImages.find((d) => d.slug === slug)?.imageUrl ?? "";
  const setDept = (slug: string, imageUrl: string) => {
    const others = p.departmentImages.filter((d) => d.slug !== slug);
    set({ departmentImages: [...others, { slug, imageUrl }] });
  };

  return (
    <>
      <PageHeader
        title="Fotos y textos de la web"
        subtitle="Todas las imágenes y textos de las páginas que no son productos. Los cambios se publican al pulsar «Publicar cambios» y la web se actualiza sola."
        actions={
          <a className="adm-btn adm-btn--secondary adm-btn--md" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Ver la web
          </a>
        }
      />

      <Card title="Carta Bakery & Café" subtitle="Cartel de desayunos y texto de presentación de la página de la carta.">
        <div className="adm-tile-editor">
          <ImageUpload value={p.cartaPosterUrl} onChange={(url) => set({ cartaPosterUrl: url })} aspect="3 / 4" label="Cartel / foto de la carta" />
          <div className="adm-form">
            <Field label="Título">
              <Input value={p.cartaTitleEs} onChange={(e) => set({ cartaTitleEs: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Título (inglés)">
              <Input value={p.cartaTitleEn} onChange={(e) => set({ cartaTitleEn: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Presentación" span={2}>
              <Textarea value={p.cartaIntroEs} onChange={(e) => set({ cartaIntroEs: e.target.value })} maxLength={500} rows={3} />
            </Field>
            <Field label="Presentación (inglés)" span={2}>
              <Textarea value={p.cartaIntroEn} onChange={(e) => set({ cartaIntroEn: e.target.value })} maxLength={500} rows={3} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Bloques junto al carrusel" subtitle="Los tres recuadros de la derecha de la portada.">
        <div className="adm-stack">
          {p.homeTiles.map((tile, i) => (
            <div key={i} className="adm-tile-editor">
              <ImageUpload value={tile.imageUrl} onChange={(url) => setTile(i, { imageUrl: url })} aspect="4 / 3" label={`Bloque ${i + 1}`} />
              <div className="adm-form">
                <Field label="Título">
                  <Input value={tile.titleEs} onChange={(e) => setTile(i, { titleEs: e.target.value })} maxLength={60} />
                </Field>
                <Field label="Título (inglés)">
                  <Input value={tile.titleEn} onChange={(e) => setTile(i, { titleEn: e.target.value })} maxLength={60} />
                </Field>
                <Field label="Texto">
                  <Input value={tile.textEs} onChange={(e) => setTile(i, { textEs: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Texto (inglés)">
                  <Input value={tile.textEn} onChange={(e) => setTile(i, { textEn: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Lleva a" span={2}>
                  <Select value={tile.href} onChange={(e) => setTile(i, { href: e.target.value })}>
                    {LINK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="adm-grid adm-grid--2">
        <Card title="«¿Por qué Corredera?»" subtitle="Imagen central de la sección (también aparece en el menú «Tienda»).">
          <ImageUpload value={p.whyImageUrl} onChange={(url) => set({ whyImageUrl: url })} aspect="5 / 4" />
        </Card>

        <Card title="Servicio de corte" subtitle="Sección oscura con la foto de fondo.">
          <div className="adm-stack">
            <ImageUpload value={p.carvingImageUrl} onChange={(url) => set({ carvingImageUrl: url })} aspect="16 / 9" label="Foto de fondo (horizontal)" />
            <Field label="Título">
              <Input value={p.carvingTitleEs} onChange={(e) => set({ carvingTitleEs: e.target.value })} maxLength={140} />
            </Field>
            <Field label="Título (inglés)">
              <Input value={p.carvingTitleEn} onChange={(e) => set({ carvingTitleEn: e.target.value })} maxLength={140} />
            </Field>
            <Field label="Texto">
              <Textarea value={p.carvingTextEs} onChange={(e) => set({ carvingTextEs: e.target.value })} maxLength={500} />
            </Field>
            <Field label="Texto (inglés)">
              <Textarea value={p.carvingTextEn} onChange={(e) => set({ carvingTextEn: e.target.value })} maxLength={500} />
            </Field>
          </div>
        </Card>
      </div>

      <Card title="«Somos Corredera»" subtitle="Historia de la tienda en la portada.">
        <div className="adm-tile-editor">
          <ImageUpload value={p.aboutImageUrl} onChange={(url) => set({ aboutImageUrl: url })} aspect="4 / 3" label="Foto de la tienda" />
          <div className="adm-form">
            <Field label="Título">
              <Input value={p.aboutTitleEs} onChange={(e) => set({ aboutTitleEs: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Título (inglés)">
              <Input value={p.aboutTitleEn} onChange={(e) => set({ aboutTitleEn: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Primer párrafo" span={2}>
              <Textarea value={p.aboutText1Es} onChange={(e) => set({ aboutText1Es: e.target.value })} maxLength={700} rows={3} />
            </Field>
            <Field label="Primer párrafo (inglés)" span={2}>
              <Textarea value={p.aboutText1En} onChange={(e) => set({ aboutText1En: e.target.value })} maxLength={700} rows={3} />
            </Field>
            <Field label="Segundo párrafo (opcional)" span={2}>
              <Textarea value={p.aboutText2Es} onChange={(e) => set({ aboutText2Es: e.target.value })} maxLength={700} rows={3} />
            </Field>
            <Field label="Segundo párrafo (inglés)" span={2}>
              <Textarea value={p.aboutText2En} onChange={(e) => set({ aboutText2En: e.target.value })} maxLength={700} rows={3} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Fotos de las categorías" subtitle="Se usan en «Nuestros productos», en el menú «Tienda» y en la cabecera de cada categoría.">
        <div className="adm-media-grid">
          {NAV_DEPARTMENTS.map((d) => (
            <ImageUpload key={d.slug} value={deptImage(d.slug) || d.image} onChange={(url) => setDept(d.slug, url)} aspect="5 / 4" label={d.es} />
          ))}
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void commit()} onDiscard={discard} />
    </>
  );
}
