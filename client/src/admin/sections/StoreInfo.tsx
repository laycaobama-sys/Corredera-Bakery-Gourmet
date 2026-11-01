import { useSettingsDraft } from "../shared";
import { Card, Field, Input, Loading, PageHeader, SaveBar, Textarea, Toggle } from "../ui";

export function StoreInfoSection() {
  const { draft, patch, dirty, commit, discard, saving, loading } = useSettingsDraft();
  if (loading || !draft) return <Loading />;
  const c = draft.contact;
  const s = draft.schedule;
  const sec = draft.sections;
  const setC = (p: Partial<typeof c>) => patch("contact", p);
  const setS = (p: Partial<typeof s>) => patch("schedule", p);
  const setSec = (p: Partial<typeof sec>) => patch("sections", p);

  return (
    <>
      <PageHeader title="Tienda, horarios y envíos" subtitle="Datos de contacto, horarios y condiciones de los pedidos que se muestran en toda la web." />

      <Card title="Pedidos online" subtitle="Controla si se pueden enviar pedidos desde la web.">
        <div className="adm-stack">
          <Toggle
            checked={c.whatsappOrdersEnabled}
            onChange={(v) => setC({ whatsappOrdersEnabled: v })}
            label="Aceptar pedidos desde la web"
            description="Apágalo en vacaciones o cierres: el carrito mostrará el aviso de abajo."
          />
          {!c.whatsappOrdersEnabled && (
            <div className="adm-form">
              <Field label="Aviso cuando los pedidos están pausados" span={2}>
                <Input value={c.pauseOrdersNoticeEs} onChange={(e) => setC({ pauseOrdersNoticeEs: e.target.value })} maxLength={300} placeholder="Ej. Cerrado por vacaciones hasta el 2 de septiembre." />
              </Field>
              <Field label="Aviso (inglés)" span={2}>
                <Input value={c.pauseOrdersNoticeEn} onChange={(e) => setC({ pauseOrdersNoticeEn: e.target.value })} maxLength={300} />
              </Field>
            </div>
          )}
          <Toggle checked={c.homeDeliveryEnabled} onChange={(v) => setC({ homeDeliveryEnabled: v })} label="Ofrecer envío a domicilio" description="Si lo apagas, solo se podrá elegir recogida en tienda." />
          <div className="adm-form">
            <Field label="Texto sobre envíos" span={2}>
              <Textarea value={c.shippingNoticeEs} onChange={(e) => setC({ shippingNoticeEs: e.target.value })} maxLength={400} rows={2} />
            </Field>
            <Field label="Texto sobre envíos (inglés)" span={2}>
              <Textarea value={c.shippingNoticeEn} onChange={(e) => setC({ shippingNoticeEn: e.target.value })} maxLength={400} rows={2} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="adm-grid adm-grid--2">
        <Card title="Contacto">
          <div className="adm-form">
            <Field label="WhatsApp (solo números con prefijo)" hint="Ej. 34640341932 · recibe los pedidos">
              <Input value={c.whatsappNumber} onChange={(e) => setC({ whatsappNumber: e.target.value.replace(/\D/g, "") })} maxLength={15} inputMode="numeric" />
            </Field>
            <Field label="WhatsApp como se muestra">
              <Input value={c.whatsappDisplay} onChange={(e) => setC({ whatsappDisplay: e.target.value })} maxLength={32} />
            </Field>
            <Field label="Teléfono fijo (para llamar)">
              <Input value={c.landlineNumber} onChange={(e) => setC({ landlineNumber: e.target.value })} maxLength={16} />
            </Field>
            <Field label="Teléfono como se muestra">
              <Input value={c.landlineDisplay} onChange={(e) => setC({ landlineDisplay: e.target.value })} maxLength={32} />
            </Field>
            <Field label="Email" span={2}>
              <Input type="email" value={c.contactEmail} onChange={(e) => setC({ contactEmail: e.target.value })} maxLength={160} />
            </Field>
            <Field label="Dirección" span={2}>
              <Input value={c.addressLine} onChange={(e) => setC({ addressLine: e.target.value })} maxLength={160} />
            </Field>
            <Field label="Cómo llegar" span={2}>
              <Textarea value={c.neighborhoodNoteEs} onChange={(e) => setC({ neighborhoodNoteEs: e.target.value })} maxLength={300} rows={2} />
            </Field>
            <Field label="Cómo llegar (inglés)" span={2}>
              <Textarea value={c.neighborhoodNoteEn} onChange={(e) => setC({ neighborhoodNoteEn: e.target.value })} maxLength={300} rows={2} />
            </Field>
            <Field label="Enlace de Google Maps" span={2}>
              <Input value={c.googleMapsUrl} onChange={(e) => setC({ googleMapsUrl: e.target.value })} maxLength={512} />
            </Field>
            <Field label="Instagram (URL)">
              <Input value={c.instagramUrl} onChange={(e) => setC({ instagramUrl: e.target.value })} maxLength={512} />
            </Field>
            <Field label="Usuario de Instagram">
              <Input value={c.instagramHandle} onChange={(e) => setC({ instagramHandle: e.target.value })} maxLength={60} />
            </Field>
            <Field label="TikTok (URL)" span={2}>
              <Input value={c.tiktokUrl} onChange={(e) => setC({ tiktokUrl: e.target.value })} maxLength={512} />
            </Field>
          </div>
        </Card>

        <Card title="Horarios">
          <div className="adm-form">
            <p className="adm-form__title adm-field--wide">Tienda gourmet</p>
            <Field label="Horario">
              <Input value={s.gourmetHoursEs} onChange={(e) => setS({ gourmetHoursEs: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Horario (inglés)">
              <Input value={s.gourmetHoursEn} onChange={(e) => setS({ gourmetHoursEn: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Días cerrados">
              <Input value={s.gourmetClosedNoteEs} onChange={(e) => setS({ gourmetClosedNoteEs: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Días cerrados (inglés)">
              <Input value={s.gourmetClosedNoteEn} onChange={(e) => setS({ gourmetClosedNoteEn: e.target.value })} maxLength={120} />
            </Field>

            <p className="adm-form__title adm-field--wide">Bakery & Café</p>
            <Field label="Lunes a jueves">
              <Input value={s.bakeryWeekdaysEs} onChange={(e) => setS({ bakeryWeekdaysEs: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Mon–Thu (inglés)">
              <Input value={s.bakeryWeekdaysEn} onChange={(e) => setS({ bakeryWeekdaysEn: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Viernes y sábado">
              <Input value={s.bakeryWeekendEs} onChange={(e) => setS({ bakeryWeekendEs: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Fri–Sat (inglés)">
              <Input value={s.bakeryWeekendEn} onChange={(e) => setS({ bakeryWeekendEn: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Domingo">
              <Input value={s.bakerySundayEs} onChange={(e) => setS({ bakerySundayEs: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Sunday (inglés)">
              <Input value={s.bakerySundayEn} onChange={(e) => setS({ bakerySundayEn: e.target.value })} maxLength={100} />
            </Field>

            <p className="adm-form__title adm-field--wide">Horario especial</p>
            <Field label="Festivos, Navidad, vacaciones…" hint="Opcional · se muestra destacado en «Visítanos»" span={2}>
              <Input value={s.specialHolidayHoursEs} onChange={(e) => setS({ specialHolidayHoursEs: e.target.value })} maxLength={220} />
            </Field>
            <Field label="Horario especial (inglés)" span={2}>
              <Input value={s.specialHolidayHoursEn} onChange={(e) => setS({ specialHolidayHoursEn: e.target.value })} maxLength={220} />
            </Field>
          </div>
        </Card>
      </div>

      <Card title="Textos generales">
        <div className="adm-form">
          <Field label="Nota de precios y alérgenos (carta)" span={2}>
            <Textarea value={sec.allergenNoticeEs} onChange={(e) => setSec({ allergenNoticeEs: e.target.value })} maxLength={450} rows={2} />
          </Field>
          <Field label="Nota de precios y alérgenos (inglés)" span={2}>
            <Textarea value={sec.allergenNoticeEn} onChange={(e) => setSec({ allergenNoticeEn: e.target.value })} maxLength={450} rows={2} />
          </Field>
          <Field label="Texto del pie de página" span={2}>
            <Textarea value={sec.footerNoteEs} onChange={(e) => setSec({ footerNoteEs: e.target.value })} maxLength={360} rows={2} />
          </Field>
          <Field label="Texto del pie de página (inglés)" span={2}>
            <Textarea value={sec.footerNoteEn} onChange={(e) => setSec({ footerNoteEn: e.target.value })} maxLength={360} rows={2} />
          </Field>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void commit()} onDiscard={discard} />
    </>
  );
}
