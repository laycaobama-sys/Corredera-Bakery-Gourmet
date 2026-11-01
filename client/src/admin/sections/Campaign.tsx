import { CalendarHeart, MessageCircle } from "lucide-react";
import { SEASONAL_CAMPAIGN_PRESETS } from "../../../../shared/siteSettingsSchema";
import { useSettingsDraft } from "../shared";
import { Badge, Button, Card, Field, ImageUpload, Input, Loading, PageHeader, SaveBar, Textarea, Toggle } from "../ui";

export function CampaignSection() {
  const { draft, patch, dirty, commit, discard, saving, loading } = useSettingsDraft();
  if (loading || !draft) return <Loading />;
  const c = draft.seasonalCampaign;
  const set = (p: Partial<typeof c>) => patch("seasonalCampaign", p);

  return (
    <>
      <PageHeader
        title="Eventos y campañas"
        subtitle="Anuncia un evento, una degustación, Navidad o cualquier promoción. Al activarlo aparece en la portada y en la barra de avisos."
      />

      <div className="adm-grid adm-grid--2-1">
        <Card
          title="Evento o campaña activa"
          actions={c.enabled ? <Badge tone="success">Publicado en la web</Badge> : <Badge>Desactivado</Badge>}
        >
          <div className="adm-stack">
            <Toggle
              checked={c.enabled}
              onChange={(v) => set({ enabled: v })}
              label="Mostrar en la web"
              description="Puedes prepararlo con antelación y activarlo cuando quieras."
            />
            <div className="adm-form">
              <Field label="Etiqueta corta" hint="Ej. «ESPECIAL NAVIDAD · ENCARGOS ABIERTOS»">
                <Input value={c.badgeEs} onChange={(e) => set({ badgeEs: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Etiqueta (inglés)">
                <Input value={c.badgeEn} onChange={(e) => set({ badgeEn: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Título del evento" span={2}>
                <Input value={c.titleEs} onChange={(e) => set({ titleEs: e.target.value })} maxLength={180} />
              </Field>
              <Field label="Título (inglés)" span={2}>
                <Input value={c.titleEn} onChange={(e) => set({ titleEn: e.target.value })} maxLength={180} />
              </Field>
              <Field label="Descripción" hint="Fecha, hora, qué incluye, cómo reservar…" span={2}>
                <Textarea value={c.descriptionEs} onChange={(e) => set({ descriptionEs: e.target.value })} maxLength={600} rows={4} />
              </Field>
              <Field label="Descripción (inglés)" span={2}>
                <Textarea value={c.descriptionEn} onChange={(e) => set({ descriptionEn: e.target.value })} maxLength={600} rows={3} />
              </Field>
              <Field label="Texto del botón">
                <Input value={c.ctaTextEs} onChange={(e) => set({ ctaTextEs: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Botón (inglés)">
                <Input value={c.ctaTextEn} onChange={(e) => set({ ctaTextEn: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Mensaje de WhatsApp que se rellena al pulsar" span={2}>
                <Textarea value={c.whatsappPrefillEs} onChange={(e) => set({ whatsappPrefillEs: e.target.value })} maxLength={300} rows={2} />
              </Field>
              <Field label="Mensaje de WhatsApp (inglés)" span={2}>
                <Textarea value={c.whatsappPrefillEn} onChange={(e) => set({ whatsappPrefillEn: e.target.value })} maxLength={300} rows={2} />
              </Field>
            </div>
          </div>
        </Card>

        <div className="adm-stack">
          <Card title="Imagen del evento">
            <ImageUpload value={c.imageUrl} onChange={(url) => set({ imageUrl: url })} aspect="4 / 3" />
          </Card>

          <Card title="Vista previa">
            <div className="adm-campaign-preview">
              <img src={c.imageUrl} alt="" />
              <div>
                <span className="adm-campaign-preview__badge">{c.badgeEs}</span>
                <p className="adm-campaign-preview__title">{c.titleEs}</p>
                <p className="adm-campaign-preview__text">{c.descriptionEs}</p>
                <span className="adm-campaign-preview__cta">
                  <MessageCircle size={14} /> {c.ctaTextEs}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Plantillas rápidas" subtitle="Rellena el formulario con un ejemplo y adáptalo.">
            <div className="adm-stack adm-stack--tight">
              {Object.entries(SEASONAL_CAMPAIGN_PRESETS).map(([key, preset]) => (
                <Button key={key} icon={<CalendarHeart size={16} />} onClick={() => set({ ...preset.config, imageUrl: c.imageUrl, enabled: c.enabled })}>
                  {preset.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void commit()} onDiscard={discard} />
    </>
  );
}
