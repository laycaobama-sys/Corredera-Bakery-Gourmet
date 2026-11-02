import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import { Download, MapPin, MessageCircle, Phone, Printer, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MODALITY_LABEL, ORDER_STATUS, ORDER_STATUS_ORDER, waLink, type OrderStatus } from "../shared";
import {
  Badge,
  Button,
  Card,
  Confirm,
  downloadCsv,
  Drawer,
  Empty,
  errorMessage,
  eur,
  fmtDate,
  Loading,
  PageHeader,
  Textarea,
} from "../ui";

type Filter = "all" | OrderStatus;

export function OrdersSection({ initialIds }: { initialIds?: string[] }) {
  const utils = trpc.useUtils();
  const q = trpc.admin.listOrders.useQuery(undefined, { refetchInterval: 30_000 });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const orders = q.data ?? [];
  const scoped = initialIds ? orders.filter((o) => initialIds.includes(o.id)) : orders;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length };
    for (const o of scoped) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [scoped]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return scoped.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!s) return true;
      return [o.id, o.customerName, o.customerPhone ?? "", o.deliveryAddress ?? "", ...o.items.map((i) => i.name)].join(" ").toLowerCase().includes(s);
    });
  }, [scoped, filter, search]);

  const exportCsv = () => {
    downloadCsv(`pedidos-corredera-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Referencia", "Fecha", "Cliente", "Teléfono", "Entrega", "Dirección", "Fecha deseada", "Artículos", "Importe (€)", "Estado", "Notas cliente", "Nota interna"],
      ...visible.map((o) => [
        o.id,
        fmtDate(o.createdAt),
        o.customerName,
        o.customerPhone ?? o.customerPhoneMasked,
        MODALITY_LABEL[o.modality ?? "pickup"],
        o.deliveryAddress ?? "",
        o.desiredTime ?? "",
        o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
        (o.totalAmountCents / 100).toFixed(2).replace(".", ","),
        ORDER_STATUS[o.status as OrderStatus]?.label ?? o.status,
        o.customerNotes ?? "",
        o.internalNote ?? "",
      ]),
    ]);
  };

  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      {!initialIds && (
        <PageHeader
          title="Pedidos"
          subtitle="Todos los pedidos enviados desde la web. Cambia su estado según avanzas con cada cliente."
          actions={
            <Button icon={<Download size={16} />} onClick={exportCsv} disabled={visible.length === 0}>
              Exportar Excel (CSV)
            </Button>
          }
        />
      )}

      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-tabs" role="tablist">
            {(["all", ...ORDER_STATUS_ORDER] as Filter[]).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "Todos" : ORDER_STATUS[f].label}
                <span>{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
          <label className="adm-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, teléfono, producto…" />
          </label>
        </div>

        {q.isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty icon={<ShoppingBag size={30} strokeWidth={1.25} />} title={orders.length ? "Ningún pedido con este filtro" : "Todavía no hay pedidos"} text={orders.length ? undefined : "Los pedidos que envíen los clientes desde el carrito aparecerán aquí al instante."} />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--click">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Productos</th>
                  <th className="num">Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)}>
                    <td>
                      <strong>{o.id}</strong>
                      <small className="adm-muted">{fmtDate(o.createdAt)}</small>
                    </td>
                    <td>
                      <strong>{o.customerName}</strong>
                      <small className="adm-muted">{o.customerPhone || o.customerPhoneMasked}</small>
                    </td>
                    <td>{MODALITY_LABEL[o.modality ?? "pickup"]}</td>
                    <td className="adm-ellipsis">
                      {o.totalItemsCount} art. · {o.items.map((i) => i.name).join(", ")}
                    </td>
                    <td className="num">
                      {o.totalAmountCents > 0 ? eur(o.totalAmountCents) : "—"}
                      {o.hasVariableItems && <small className="adm-muted">+ al peso</small>}
                    </td>
                    <td>
                      <Badge tone={ORDER_STATUS[o.status as OrderStatus]?.tone ?? "neutral"}>{ORDER_STATUS[o.status as OrderStatus]?.label ?? o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrderDrawer
        order={open}
        onClose={() => setOpenId(null)}
        onChanged={() => {
          void utils.admin.listOrders.invalidate();
          void utils.admin.listCustomers.invalidate();
          void utils.admin.getAnalyticsDashboard.invalidate();
        }}
      />
    </>
  );
}

type Order = inferRouterOutputs<AppRouter>["admin"]["listOrders"][number];

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Opens a clean preparation ticket of the order and the print dialog (for the counter or the butcher). */
function printOrder(order: Order) {
  // A hidden frame instead of a new window: pop-up blockers never stop it.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) return;
  const rows = order.items
    .map((i) => `<tr><td class="q">${i.quantity}×</td><td>${escapeHtml(i.name)}<br><small>${escapeHtml(i.price)}</small></td><td class="r">${i.subtotalCents > 0 ? eur(i.subtotalCents) : "Al peso"}</td></tr>`)
    .join("");
  const line = (label: string, value?: string | null) => (value ? `<p><b>${label}:</b> ${escapeHtml(value)}</p>` : "");
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pedido ${escapeHtml(order.id)}</title>
<style>body{font:14px/1.45 system-ui,sans-serif;color:#111;margin:28px}h1{font:600 22px Georgia,serif;margin:0 0 2px}.m{color:#666;margin:0 0 18px}
table{width:100%;border-collapse:collapse;margin:14px 0}td{padding:8px 4px;border-bottom:1px solid #ddd;vertical-align:top}.q{width:44px;font-weight:700}.r{text-align:right;white-space:nowrap}
small{color:#666}.t td{border:0;font-weight:700}.box{border:1px solid #bbb;padding:10px 12px;margin-top:12px}p{margin:4px 0}</style></head><body>
<h1>Corredera Gourmet · Pedido ${escapeHtml(order.id)}</h1><p class="m">Recibido el ${escapeHtml(fmtDate(order.createdAt))} · Estado: ${escapeHtml(ORDER_STATUS[order.status].label)}</p>
${line("Cliente", order.customerName)}${line("Teléfono", order.customerPhone || order.customerPhoneMasked)}${line("Entrega", MODALITY_LABEL[order.modality ?? "pickup"])}${line("Dirección", order.deliveryAddress)}${line("Fecha deseada", order.desiredTime)}
${order.hamCuttingPreference ? `<div class="box"><b>Jamón entero:</b> ${order.hamCuttingPreference === "free_sliced_vacuum" ? "cortar a cuchillo y envasar al vacío" : "entregar la pieza entera"}</div>` : ""}
<table>${rows}<tr class="t"><td></td><td>Total estimado</td><td class="r">${order.totalAmountCents > 0 ? eur(order.totalAmountCents) : "A confirmar"}${order.hasVariableItems ? " + al peso" : ""}</td></tr></table>
${order.customerNotes ? `<div class="box"><b>Notas del cliente:</b> ${escapeHtml(order.customerNotes)}</div>` : ""}
${order.internalNote ? `<div class="box"><b>Nota interna:</b> ${escapeHtml(order.internalNote)}</div>` : ""}
</body></html>`);
  win.document.close();
  window.setTimeout(() => {
    win.focus();
    win.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 150);
}

function OrderDrawer({ order, onClose, onChanged }: { order: Order | null; onClose: () => void; onChanged: () => void }) {
  const setStatus = trpc.admin.updateOrderStatus.useMutation();
  const setNote = trpc.admin.updateOrderNote.useMutation();
  const del = trpc.admin.deleteOrder.useMutation();
  const [note, setNoteText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setNoteText(order?.internalNote ?? ""), [order?.id, order?.internalNote]);

  if (!order) return null;
  const wa = waLink(order.customerPhone, `Hola ${order.customerName}, te escribimos de Corredera Gourmet sobre tu pedido ${order.id}.`);

  const changeStatus = async (status: OrderStatus) => {
    try {
      await setStatus.mutateAsync({ orderId: order.id, status });
      toast.success(`Pedido marcado como «${ORDER_STATUS[status].label}»`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Pedido ${order.id}`}
      subtitle={`Recibido el ${fmtDate(order.createdAt)}`}
      width={620}
      footer={
        <>
          <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)}>
            Eliminar
          </Button>
          <div className="adm-spacer" />
          <Button variant="secondary" icon={<Printer size={16} />} onClick={() => printOrder(order)}>
            Imprimir
          </Button>
          {wa && (
            <a className="adm-btn adm-btn--success adm-btn--md" href={wa} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> Escribir por WhatsApp
            </a>
          )}
        </>
      }
    >
      <div className="adm-detail">
        <div className="adm-status-picker">
          <span className="adm-field__label">Estado del pedido</span>
          <div className="adm-status-picker__opts">
            {ORDER_STATUS_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={order.status === s} className={`adm-status adm-status--${ORDER_STATUS[s].tone}`} onClick={() => void changeStatus(s)} disabled={setStatus.isPending}>
                {ORDER_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-detail__grid">
          <div>
            <span className="adm-field__label">Cliente</span>
            <p className="adm-detail__big">{order.customerName}</p>
            {order.customerPhone ? (
              <p className="adm-detail__line">
                <Phone size={14} /> <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
              </p>
            ) : (
              <p className="adm-detail__line adm-muted">{order.customerPhoneMasked || "Sin teléfono"}</p>
            )}
          </div>
          <div>
            <span className="adm-field__label">Entrega</span>
            <p className="adm-detail__big">{MODALITY_LABEL[order.modality ?? "pickup"]}</p>
            {order.deliveryAddress && (
              <p className="adm-detail__line">
                <MapPin size={14} />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`} target="_blank" rel="noreferrer">
                  {order.deliveryAddress}
                </a>
              </p>
            )}
            {order.desiredTime && <p className="adm-detail__line">Fecha deseada: {order.desiredTime}</p>}
          </div>
        </div>

        {order.hamCuttingPreference && (
          <div className="adm-alert adm-alert--info">
            Jamón entero: {order.hamCuttingPreference === "free_sliced_vacuum" ? "cortar a cuchillo y envasar al vacío (gratis)" : "entregar la pieza entera"}
          </div>
        )}

        <div>
          <span className="adm-field__label">Productos</span>
          <table className="adm-table adm-table--compact adm-table--boxed">
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="num adm-qty">{i.quantity}×</td>
                  <td>
                    {i.name}
                    <small className="adm-muted">{i.price}</small>
                  </td>
                  <td className="num">{i.subtotalCents > 0 ? eur(i.subtotalCents) : "Al peso"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>Total estimado</td>
                <td className="num">
                  <strong>{order.totalAmountCents > 0 ? eur(order.totalAmountCents) : "A confirmar"}</strong>
                  {order.hasVariableItems && <small className="adm-muted">+ artículos al peso</small>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.customerNotes && (
          <div>
            <span className="adm-field__label">Notas del cliente</span>
            <p className="adm-quote">{order.customerNotes}</p>
          </div>
        )}

        <div>
          <span className="adm-field__label">Nota interna (solo la ves tú)</span>
          <Textarea value={note} onChange={(e) => setNoteText(e.target.value)} placeholder="Ej. pagado en tienda, recoger el sábado, peso final 7,4 kg…" maxLength={1000} />
          <div className="adm-row-end">
            <Button
              size="sm"
              variant="primary"
              loading={setNote.isPending}
              disabled={note === (order.internalNote ?? "")}
              onClick={async () => {
                try {
                  await setNote.mutateAsync({ orderId: order.id, note });
                  toast.success("Nota guardada");
                  onChanged();
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Guardar nota
            </Button>
          </div>
        </div>

        <div className="adm-muted adm-small">Última actualización: {fmtDate(order.updatedAt)}</div>
      </div>

      <Confirm
        open={confirmDelete}
        danger
        title="¿Eliminar este pedido?"
        text={`Se borrará el pedido ${order.id} de ${order.customerName}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar pedido"
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await del.mutateAsync({ orderId: order.id });
            toast.success("Pedido eliminado");
            setConfirmDelete(false);
            onClose();
            onChanged();
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </Drawer>
  );
}
