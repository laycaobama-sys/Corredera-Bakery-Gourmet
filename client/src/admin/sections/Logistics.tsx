import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { MapPin, MessageCircle, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRouter } from "../../../../server/routers";
import { LIVE, MoneyInput } from "../business";
import { MODALITY_LABEL, waLink } from "../shared";
import { Badge, Button, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Segmented, Select, Textarea } from "../ui";

const COLUMNS = [
  { id: "pending", label: "Por preparar" },
  { id: "preparing", label: "En preparación" },
  { id: "in_transit", label: "En ruta" },
  { id: "delivered", label: "Entregado" },
  { id: "incident", label: "Incidencia" },
] as const;
type ShipmentStatus = (typeof COLUMNS)[number]["id"];
type LogisticsRow = inferRouterOutputs<AppRouter>["business"]["listLogistics"][number];

export function LogisticsSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.listLogistics.useQuery(undefined, LIVE);
  const update = trpc.business.updateShipment.useMutation();
  const orderStatus = trpc.admin.updateOrderStatus.useMutation();
  const [filter, setFilter] = useState<"all" | "delivery" | "pickup">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = (q.data ?? []).filter((r) => filter === "all" || (filter === "delivery" ? r.modality === "delivery" : r.modality !== "delivery"));
  const open = (q.data ?? []).find((r) => r.orderId === openId) ?? null;

  const refresh = () => Promise.all([utils.business.listLogistics.invalidate(), utils.business.overview.invalidate(), utils.admin.listOrders.invalidate(), utils.admin.getAnalyticsDashboard.invalidate()]);

  /** A shipment moving also moves its order, so stock and sales stay right. */
  const move = async (orderId: string, status: ShipmentStatus) => {
    try {
      await update.mutateAsync({ orderId, status });
      if (status === "preparing") await orderStatus.mutateAsync({ orderId, status: "preparing" });
      if (status === "delivered") await orderStatus.mutateAsync({ orderId, status: "completed" });
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const all = q.data ?? [];
  return (
    <>
      <PageHeader title="Logística" subtitle="Preparación y reparto de cada pedido. Al marcar «Entregado», el pedido pasa a ventas." />
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Por preparar" value={num(all.filter((r) => r.status === "pending").length)} tone="warning" />
        <Kpi label="En preparación" value={num(all.filter((r) => r.status === "preparing").length)} tone="accent" />
        <Kpi label="En ruta" value={num(all.filter((r) => r.status === "in_transit").length)} icon={<Truck size={18} />} />
        <Kpi label="Incidencias" value={num(all.filter((r) => r.status === "incident").length)} />
      </div>
      <div className="adm-toolbar adm-toolbar--bare">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todos" },
            { value: "delivery", label: "Envíos" },
            { value: "pickup", label: "Recogidas" },
          ]}
        />
      </div>
      {q.isLoading ? (
        <Loading />
      ) : all.length === 0 ? (
        <Empty icon={<Truck size={30} strokeWidth={1.25} />} title="Todavía no hay pedidos" text="Los pedidos de la web aparecerán aquí automáticamente." />
      ) : (
        <div className="adm-kanban">
          {COLUMNS.map((c) => {
            const cards = rows.filter((r) => r.status === c.id);
            return (
              <section key={c.id} className="adm-kanban__col" aria-label={c.label}>
                <h3>
                  {c.label} <span>{cards.length}</span>
                </h3>
                {cards.map((r) => (
                  <article key={r.orderId} className="adm-kanban__card">
                    <button type="button" className="adm-kanban__title" onClick={() => setOpenId(r.orderId)}>
                      {r.customerName}
                    </button>
                    <p className="adm-muted adm-small">
                      {r.orderId} · {fmtDate(r.createdAt)}
                    </p>
                    <p className="adm-small">
                      {r.items.reduce((a, i) => a + i.quantity, 0)} artículos · {r.totalCents > 0 ? eur(r.totalCents) : "A confirmar"}
                      {r.hasVariableItems && " + peso"}
                    </p>
                    <Badge tone={r.modality === "delivery" ? "info" : "neutral"}>{MODALITY_LABEL[r.modality]}</Badge>
                    {r.desiredTime && <p className="adm-small">Para: {r.desiredTime}</p>}
                    <Select value={r.status} aria-label="Estado" onChange={(e) => void move(r.orderId, e.target.value as ShipmentStatus)}>
                      {COLUMNS.map((o) => (
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
      {open && <ShipmentDrawer key={open.orderId} row={open} onClose={() => setOpenId(null)} onSaved={refresh} />}
    </>
  );
}

function ShipmentDrawer({ row, onClose, onSaved }: { row: LogisticsRow; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const update = trpc.business.updateShipment.useMutation();
  const setFinal = trpc.business.setFinalAmount.useMutation();
  const [carrier, setCarrier] = useState(row.carrier);
  const [tracking, setTracking] = useState(row.tracking);
  const [notes, setNotes] = useState(row.notes);
  const wa = waLink(row.customerPhone, `Hola ${row.customerName}, te escribimos de Corredera Gourmet sobre tu pedido ${row.orderId}.`);

  const save = async () => {
    try {
      await update.mutateAsync({ orderId: row.orderId, carrier: carrier.trim(), tracking: tracking.trim(), notes: notes.trim() });
      toast.success("Datos del envío guardados");
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
      title={`Pedido ${row.orderId}`}
      subtitle={row.customerName}
      footer={
        <>
          {wa && (
            <a className="adm-btn adm-btn--success adm-btn--md" href={wa} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
          <div className="adm-spacer" />
          <Button variant="primary" loading={update.isPending} onClick={() => void save()}>
            Guardar
          </Button>
        </>
      }
    >
      {row.address && (
        <p className="adm-detail__line">
          <MapPin size={14} />{" "}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.address)}`} target="_blank" rel="noreferrer">
            {row.address}
          </a>
        </p>
      )}
      <ul className="adm-statlist">
        {row.items.map((i) => (
          <li key={i.name}>
            <span>{i.name}</span>
            <strong>{i.quantity}×</strong>
          </li>
        ))}
      </ul>
      <div className="adm-form">
        <Field label="Importe final (tras pesar)" hint="Sustituye al estimado en ventas e informes">
          <MoneyInput
            cents={row.totalCents}
            onCommit={async (cents) => {
              try {
                await setFinal.mutateAsync({ orderId: row.orderId, cents });
                toast.success("Importe final guardado");
                await onSaved();
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          />
        </Field>
        <Field label="Transportista o repartidor">
          <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Nº de seguimiento" span={2}>
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Notas de reparto" span={2}>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} />
        </Field>
      </div>
    </Drawer>
  );
}
