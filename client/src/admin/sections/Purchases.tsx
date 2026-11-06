import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { centsFromText, LIVE, MoneyInput, numberFromText, today } from "../business";
import { Badge, Button, Card, Confirm, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Segmented, Select, Textarea } from "../ui";

const STATUS = {
  draft: { label: "Borrador", tone: "neutral" },
  ordered: { label: "Pedida", tone: "info" },
  received: { label: "Recibida", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
} as const;

type Line = { productId?: string; description: string; qty: number; unitCostCents: number };
type PurchaseDraft = { id?: string; number?: string; supplierId: string; lines: Line[]; expectedAt: string; invoiceRef: string; notes: string };
type SupplierDraft = { id?: string; name: string; contact: string; phone: string; email: string; taxId: string; notes: string };

export function PurchasesSection() {
  const utils = trpc.useUtils();
  const purchases = trpc.business.listPurchases.useQuery(undefined, LIVE);
  const suppliers = trpc.business.listSuppliers.useQuery();
  const receive = trpc.business.receivePurchase.useMutation();
  const flags = trpc.business.updatePurchase.useMutation();
  const [tab, setTab] = useState<"purchases" | "suppliers">("purchases");
  const [draft, setDraft] = useState<PurchaseDraft | null>(null);
  const [supplier, setSupplier] = useState<SupplierDraft | null>(null);
  const list = purchases.data ?? [];
  const supplierList = suppliers.data ?? [];
  const nameOf = (id: string) => supplierList.find((s) => s.id === id)?.name ?? "—";
  const refresh = () => Promise.all([utils.business.listPurchases.invalidate(), utils.business.listSuppliers.invalidate(), utils.business.listStock.invalidate(), utils.business.overview.invalidate()]);
  const monthKey = new Date().toISOString().slice(0, 7);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Compras y proveedores"
        subtitle="Al recibir una compra, sus productos suman al stock y su coste se actualiza solo."
        actions={
          tab === "purchases" ? (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                if (supplierList.length === 0) {
                  setTab("suppliers");
                  return toast.info("Primero añade un proveedor.");
                }
                setDraft({ supplierId: supplierList[0].id, lines: [{ description: "", qty: 1, unitCostCents: 0 }], expectedAt: today(), invoiceRef: "", notes: "" });
              }}
            >
              Nueva compra
            </Button>
          ) : (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setSupplier({ name: "", contact: "", phone: "", email: "", taxId: "", notes: "" })}>
              Nuevo proveedor
            </Button>
          )
        }
      />
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Compras este mes" value={eur(list.filter((p) => p.status === "received" && (p.receivedAt ?? "").startsWith(monthKey)).reduce((a, p) => a + p.totalCents, 0))} tone="accent" />
        <Kpi label="Pedidas sin recibir" value={num(list.filter((p) => p.status === "ordered").length)} tone="warning" />
        <Kpi label="Pendiente de pago" value={eur(list.filter((p) => p.status === "received" && !p.paid).reduce((a, p) => a + p.totalCents, 0))} />
        <Kpi label="Proveedores" value={num(supplierList.length)} icon={<Building2 size={18} />} />
      </div>
      <div className="adm-toolbar adm-toolbar--bare">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "purchases", label: "Compras" },
            { value: "suppliers", label: "Proveedores" },
          ]}
        />
      </div>

      {tab === "purchases" ? (
        <Card pad={false}>
          {purchases.isLoading ? (
            <Loading />
          ) : list.length === 0 ? (
            <Empty icon={<ShoppingCart size={30} strokeWidth={1.25} />} title="Aún no hay compras" text="Registra lo que pides a tus proveedores para tener el stock y los costes al día." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Proveedor</th>
                    <th>Previsto</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th className="num">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.status === "received" ? (
                          <strong>{p.number}</strong>
                        ) : (
                          <button type="button" className="adm-link" onClick={() => setDraft({ id: p.id, number: p.number, supplierId: p.supplierId, lines: p.lines, expectedAt: p.expectedAt, invoiceRef: p.invoiceRef, notes: p.notes })}>
                            {p.number}
                          </button>
                        )}
                      </td>
                      <td>{nameOf(p.supplierId)}</td>
                      <td>{p.expectedAt ? fmtDate(p.expectedAt, false) : "—"}</td>
                      <td>
                        <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                      </td>
                      <td>
                        <label className="adm-check">
                          <input type="checkbox" checked={p.paid} onChange={(e) => void run(() => flags.mutateAsync({ id: p.id, paid: e.target.checked }), e.target.checked ? "Marcada como pagada" : "Marcada como pendiente")} /> {p.paid ? "Pagada" : "Pendiente"}
                        </label>
                      </td>
                      <td className="num">
                        <strong>{eur(p.totalCents)}</strong>
                      </td>
                      <td>
                        {p.status === "ordered" && (
                          <Button size="sm" icon={<CheckCircle2 size={14} />} loading={receive.isPending} onClick={() => void run(() => receive.mutateAsync({ id: p.id }), "Mercancía recibida y stock actualizado")}>
                            Recibir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card pad={false}>
          {supplierList.length === 0 ? (
            <Empty icon={<Building2 size={30} strokeWidth={1.25} />} title="Añade tu primer proveedor" />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>NIF</th>
                    <th className="num">Comprado</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierList.map((s) => (
                    <tr key={s.id} className="is-click" onClick={() => setSupplier({ id: s.id, name: s.name, contact: s.contact, phone: s.phone, email: s.email, taxId: s.taxId, notes: s.notes })}>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.contact}</td>
                      <td>{s.phone}</td>
                      <td>{s.email}</td>
                      <td>{s.taxId}</td>
                      <td className="num">{eur(list.filter((p) => p.supplierId === s.id && p.status === "received").reduce((a, p) => a + p.totalCents, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {draft && <PurchaseDrawer draft={draft} suppliers={supplierList} onClose={() => setDraft(null)} onSaved={refresh} />}
      {supplier && <SupplierDrawer draft={supplier} onClose={() => setSupplier(null)} onSaved={refresh} />}
    </>
  );
}

function PurchaseDrawer({ draft: initial, suppliers, onClose, onSaved }: { draft: PurchaseDraft; suppliers: { id: string; name: string }[]; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const stock = trpc.business.listStock.useQuery();
  const save = trpc.business.savePurchase.useMutation();
  const flags = trpc.business.updatePurchase.useMutation();
  const [d, setD] = useState(initial);
  const setLine = (i: number, patch: Partial<Line>) => setD((x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const total = d.lines.reduce((a, l) => a + Math.round(l.qty * l.unitCostCents), 0);

  const submit = async () => {
    try {
      const { number: _n, ...payload } = d;
      await save.mutateAsync(payload);
      toast.success("Compra guardada");
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
      width={720}
      title={d.number ?? "Nueva compra"}
      footer={
        <>
          {d.id && (
            <Button
              variant="ghost"
              onClick={async () => {
                await flags.mutateAsync({ id: d.id!, status: "cancelled" });
                await onSaved();
                onClose();
              }}
            >
              Cancelar compra
            </Button>
          )}
          <div className="adm-spacer" />
          <strong className="adm-total">{eur(total)}</strong>
          <Button variant="primary" loading={save.isPending} onClick={() => void submit()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="adm-form">
        <Field label="Proveedor">
          <Select value={d.supplierId} onChange={(e) => setD((x) => ({ ...x, supplierId: e.target.value }))}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Entrega prevista">
          <Input type="date" value={d.expectedAt} onChange={(e) => setD((x) => ({ ...x, expectedAt: e.target.value }))} />
        </Field>
        <Field label="Nº de albarán o factura del proveedor" span={2}>
          <Input value={d.invoiceRef} onChange={(e) => setD((x) => ({ ...x, invoiceRef: e.target.value }))} maxLength={60} />
        </Field>
      </div>
      <h3 className="adm-subtitle">Productos</h3>
      <div className="adm-lines">
        <div className="adm-lines__head adm-lines__head--buy">
          <span>Producto</span>
          <span>Cantidad</span>
          <span>Coste unitario s/IVA</span>
          <span />
        </div>
        {d.lines.map((line, i) => (
          <div className="adm-lines__row adm-lines__row--buy" key={i}>
            <Select
              value={line.productId ?? ""}
              aria-label="Producto"
              onChange={(e) => {
                const row = stock.data?.find((s) => s.productId === e.target.value);
                setLine(i, row ? { productId: row.productId, description: row.name, unitCostCents: row.costCents || line.unitCostCents } : { productId: undefined, description: "" });
              }}
            >
              <option value="">Elige un producto…</option>
              {(stock.data ?? []).map((s) => (
                <option key={s.productId} value={s.productId}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input inputMode="decimal" aria-label="Cantidad" value={String(line.qty).replace(".", ",")} onChange={(e) => setLine(i, { qty: numberFromText(e.target.value) })} />
            <MoneyInput cents={line.unitCostCents} aria-label="Coste" onCommit={(unitCostCents) => setLine(i, { unitCostCents })} />
            <button type="button" className="adm-icon-btn" aria-label="Quitar línea" onClick={() => setD((x) => ({ ...x, lines: x.lines.filter((_, j) => j !== i) }))}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setD((x) => ({ ...x, lines: [...x.lines, { description: "", qty: 1, unitCostCents: centsFromText("") }] }))}>
          Añadir línea
        </Button>
      </div>
      <Field label="Notas">
        <Textarea value={d.notes} onChange={(e) => setD((x) => ({ ...x, notes: e.target.value }))} maxLength={600} rows={2} />
      </Field>
    </Drawer>
  );
}

function SupplierDrawer({ draft: initial, onClose, onSaved }: { draft: SupplierDraft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const save = trpc.business.saveSupplier.useMutation();
  const del = trpc.business.deleteSupplier.useMutation();
  const [d, setD] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const set = (k: keyof SupplierDraft, v: string) => setD((x) => ({ ...x, [k]: v }));

  return (
    <Drawer
      open
      onClose={onClose}
      title={d.id ? d.name : "Nuevo proveedor"}
      footer={
        <>
          {d.id && (
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirm(true)}>
              Eliminar
            </Button>
          )}
          <div className="adm-spacer" />
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={async () => {
              try {
                await save.mutateAsync(d);
                toast.success("Proveedor guardado");
                await onSaved();
                onClose();
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="adm-form">
        <Field label="Nombre" span={2}>
          <Input value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
        </Field>
        <Field label="Persona de contacto">
          <Input value={d.contact} onChange={(e) => set("contact", e.target.value)} maxLength={120} />
        </Field>
        <Field label="Teléfono">
          <Input value={d.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
        </Field>
        <Field label="Email">
          <Input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} maxLength={160} />
        </Field>
        <Field label="NIF / CIF">
          <Input value={d.taxId} onChange={(e) => set("taxId", e.target.value)} maxLength={30} />
        </Field>
        <Field label="Notas" span={2}>
          <Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={600} rows={3} />
        </Field>
      </div>
      <Confirm
        open={confirm}
        danger
        title="¿Eliminar este proveedor?"
        text={`Se borrará ${d.name}.`}
        confirmLabel="Eliminar"
        loading={del.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          try {
            await del.mutateAsync({ id: d.id! });
            await onSaved();
            onClose();
          } catch (err) {
            toast.error(errorMessage(err));
            setConfirm(false);
          }
        }}
      />
    </Drawer>
  );
}
