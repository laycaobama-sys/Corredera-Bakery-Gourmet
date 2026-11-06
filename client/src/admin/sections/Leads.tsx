import { trpc } from "@/lib/trpc";
import { CalendarClock, FileText, MessageCircle, Plus, Trash2, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { LIVE, MoneyInput } from "../business";
import { waLink } from "../shared";
import { Button, Confirm, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Select, Textarea } from "../ui";

export const STAGES = [
  { id: "new", label: "Nuevo" },
  { id: "contacted", label: "En conversación" },
  { id: "quoted", label: "Presupuesto enviado" },
  { id: "won", label: "Ganado" },
  { id: "lost", label: "Perdido" },
] as const;
type Stage = (typeof STAGES)[number]["id"];

const SOURCES = ["WhatsApp", "Teléfono", "Instagram", "Google", "En tienda", "Recomendación", "Empresa / evento", "Otro"];

type Draft = { id?: string; name: string; phone: string; email: string; source: string; interest: string; stage: Stage; valueCents: number; notes: string; nextActionAt: string };
const emptyDraft: Draft = { name: "", phone: "", email: "", source: "WhatsApp", interest: "", stage: "new", valueCents: 0, notes: "", nextActionAt: "" };

export function LeadsSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.listLeads.useQuery(undefined, LIVE);
  const save = trpc.business.saveLead.useMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const leads = q.data ?? [];
  const refresh = () => Promise.all([utils.business.listLeads.invalidate(), utils.business.overview.invalidate()]);

  const moveTo = async (lead: (typeof leads)[number], stage: Stage) => {
    const { createdAt: _c, updatedAt: _u, ...rest } = lead;
    try {
      await save.mutateAsync({ ...rest, stage });
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const closed = leads.filter((l) => l.stage === "won" || l.stage === "lost");
  const won = leads.filter((l) => l.stage === "won").length;
  const todayText = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Leads y oportunidades"
        subtitle="Personas interesadas que aún no han comprado: encargos de jamón, cestas de empresa, eventos, restaurantes…"
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDraft({ ...emptyDraft })}>
            Nuevo lead
          </Button>
        }
      />
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Oportunidades abiertas" value={num(open.length)} tone="accent" />
        <Kpi label="Valor en curso" value={eur(open.reduce((a, l) => a + l.valueCents, 0))} tone="success" />
        <Kpi label="Tasa de cierre" value={closed.length ? `${Math.round((won / closed.length) * 100)} %` : "—"} hint={`${num(won)} ganados de ${num(closed.length)} cerrados`} />
        <Kpi label="Seguimientos para hoy" value={num(open.filter((l) => l.nextActionAt && l.nextActionAt <= todayText).length)} icon={<CalendarClock size={18} />} tone="warning" />
      </div>
      {q.isLoading ? (
        <Loading />
      ) : leads.length === 0 ? (
        <Empty icon={<UserRoundPlus size={30} strokeWidth={1.25} />} title="Añade tu primer lead" text="Cuando alguien te consulte por WhatsApp o en tienda, apúntalo aquí para no perder el seguimiento." />
      ) : (
        <div className="adm-kanban">
          {STAGES.map((s) => {
            const cards = leads.filter((l) => l.stage === s.id);
            return (
              <section key={s.id} className="adm-kanban__col" aria-label={s.label}>
                <h3>
                  {s.label} <span>{cards.length}</span>
                </h3>
                {cards.map((l) => (
                  <article key={l.id} className="adm-kanban__card">
                    <button
                      type="button"
                      className="adm-kanban__title"
                      onClick={() => setDraft({ id: l.id, name: l.name, phone: l.phone, email: l.email, source: l.source, interest: l.interest, stage: l.stage, valueCents: l.valueCents, notes: l.notes, nextActionAt: l.nextActionAt })}
                    >
                      {l.name}
                    </button>
                    {l.interest && <p className="adm-small">{l.interest}</p>}
                    <p className="adm-muted adm-small">
                      {l.source}
                      {l.valueCents > 0 && ` · ${eur(l.valueCents)}`}
                    </p>
                    {l.nextActionAt && (
                      <p className={`adm-small${l.nextActionAt <= todayText && s.id !== "won" && s.id !== "lost" ? " is-due" : ""}`}>
                        <CalendarClock size={13} /> {fmtDate(l.nextActionAt, false)}
                      </p>
                    )}
                    <Select value={l.stage} aria-label="Etapa" onChange={(e) => void moveTo(l, e.target.value as Stage)}>
                      {STAGES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}
      {draft && <LeadDrawer draft={draft} onClose={() => setDraft(null)} onSaved={refresh} />}
    </>
  );
}

function LeadDrawer({ draft: initial, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const save = trpc.business.saveLead.useMutation();
  const del = trpc.business.deleteLead.useMutation();
  const [, navigate] = useLocation();
  const [d, setD] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const wa = waLink(d.phone, `Hola ${d.name}, te escribimos de Corredera Gourmet.`);

  const submit = async () => {
    try {
      await save.mutateAsync(d);
      toast.success("Lead guardado");
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={d.id ? d.name : "Nuevo lead"}
      footer={
        <>
          {d.id && (
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirm(true)}>
              Eliminar
            </Button>
          )}
          <div className="adm-spacer" />
          {wa && (
            <a className="adm-btn adm-btn--success adm-btn--md" href={wa} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
          {d.id && (
            <Button icon={<FileText size={16} />} onClick={() => navigate(`/admin/presupuestos?lead=${d.id}`)}>
              Presupuesto
            </Button>
          )}
          <Button variant="primary" loading={save.isPending} onClick={() => void submit()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="adm-form">
        <Field label="Nombre o empresa" span={2}>
          <Input value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
        </Field>
        <Field label="Teléfono">
          <Input value={d.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} inputMode="tel" />
        </Field>
        <Field label="Email">
          <Input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} maxLength={160} />
        </Field>
        <Field label="Cómo nos conoció">
          <Select value={d.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Etapa">
          <Select value={d.stage} onChange={(e) => set("stage", e.target.value as Stage)}>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Qué busca" span={2}>
          <Input value={d.interest} onChange={(e) => set("interest", e.target.value)} maxLength={200} placeholder="Ej. 10 cestas de Navidad para empresa" />
        </Field>
        <Field label="Valor estimado (€)">
          <MoneyInput cents={d.valueCents} onCommit={(c) => set("valueCents", c)} />
        </Field>
        <Field label="Próximo seguimiento">
          <Input type="date" value={d.nextActionAt} onChange={(e) => set("nextActionAt", e.target.value)} />
        </Field>
        <Field label="Notas" span={2}>
          <Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} rows={4} />
        </Field>
      </div>
      <Confirm
        open={confirm}
        danger
        title="¿Eliminar este lead?"
        text={`Se borrará ${d.name}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={del.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await del.mutateAsync({ id: d.id! });
          await onSaved();
          onClose();
        }}
      />
    </Drawer>
  );
}
