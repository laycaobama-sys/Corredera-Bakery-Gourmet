import { trpc } from "@/lib/trpc";
import { Boxes, Download, History, PackageX, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { categoryName, LIVE, MoneyInput, numberFromText } from "../business";
import { Badge, Button, Card, downloadCsv, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Select } from "../ui";

const STATUS = {
  ok: { label: "Con stock", tone: "success" },
  low: { label: "Bajo mínimo", tone: "warning" },
  out: { label: "Rotura", tone: "danger" },
  untracked: { label: "Sin controlar", tone: "neutral" },
} as const;

const MOVEMENT_LABEL: Record<string, string> = { purchase: "Entrada", sale: "Venta", adjustment: "Ajuste", waste: "Merma", return: "Devolución" };

/** Inline number that saves when the field is left. */
function QtyField({ value, onCommit, label }: { value: number; onCommit: (v: number) => void; label: string }) {
  const [text, setText] = useState(String(value).replace(".", ","));
  return (
    <Input
      className="adm-input adm-input--num"
      aria-label={label}
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const next = Math.max(0, numberFromText(text));
        if (next !== value) onCommit(next);
      }}
    />
  );
}

export function StockSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.listStock.useQuery(undefined, LIVE);
  const update = trpc.business.updateStock.useMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("gourmet");
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = q.data ?? [];

  const refresh = () => Promise.all([utils.business.listStock.invalidate(), utils.business.overview.invalidate()]);
  const patch = async (productId: string, values: Parameters<typeof update.mutateAsync>[0]) => {
    try {
      await update.mutateAsync({ ...values, productId });
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => (mode === "all" || r.mode === mode) && (status === "all" || r.status === status) && (!s || r.name.toLowerCase().includes(s)));
  }, [rows, search, status, mode]);

  const tracked = rows.filter((r) => r.tracked);
  const value = tracked.reduce((a, r) => a + r.valueCents, 0);
  const open = rows.find((r) => r.productId === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Control de stock"
        subtitle="Activa el control en cada producto e indica existencias, mínimo y coste sin IVA. Las ventas por unidades descuentan solas al confirmar el pedido; lo vendido al peso se ajusta a mano."
        actions={
          <Button
            icon={<Download size={16} />}
            onClick={() =>
              downloadCsv(`stock-corredera-${new Date().toISOString().slice(0, 10)}.csv`, [
                ["Producto", "Categoría", "Controlado", "Existencias", "Unidad", "Mínimo", "Coste (€)", "PVP", "Valor (€)", "Estado"],
                ...visible.map((r) => [r.name, categoryName(r.mode, r.category), r.tracked ? "Sí" : "No", r.qty, r.unit, r.minQty, (r.costCents / 100).toFixed(2).replace(".", ","), r.price, (r.valueCents / 100).toFixed(2).replace(".", ","), STATUS[r.status].label]),
              ])
            }
          >
            Exportar Excel (CSV)
          </Button>
        }
      />
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Valor del inventario" value={eur(value)} hint="A coste sin IVA" icon={<Boxes size={18} />} tone="success" />
        <Kpi label="Referencias controladas" value={`${num(tracked.length)} / ${num(rows.length)}`} />
        <Kpi label="Bajo mínimo" value={num(tracked.filter((r) => r.status === "low").length)} icon={<TriangleAlert size={18} />} tone="warning" />
        <Kpi label="Roturas de stock" value={num(tracked.filter((r) => r.status === "out").length)} icon={<PackageX size={18} />} tone="accent" />
      </div>
      <Card pad={false}>
        <div className="adm-toolbar adm-toolbar--wrap">
          <Select value={mode} onChange={(e) => setMode(e.target.value)} className="adm-select--auto" aria-label="Sección">
            <option value="gourmet">Tienda gourmet</option>
            <option value="bakery">Bakery & Café</option>
            <option value="all">Todo</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="adm-select--auto" aria-label="Estado">
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <label className="adm-search adm-search--grow">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" />
          </label>
        </div>
        {q.isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty title="No hay productos con estos filtros" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Controlar</th>
                  <th>Existencias</th>
                  <th>Unidad</th>
                  <th>Mínimo</th>
                  <th>Coste s/IVA</th>
                  <th>PVP</th>
                  <th className="num">Valor</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.productId}>
                    <td>
                      {r.name}
                      <small className="adm-muted"> {categoryName(r.mode, r.category)}</small>
                    </td>
                    <td>
                      <input type="checkbox" aria-label={`Controlar stock de ${r.name}`} checked={r.tracked} onChange={(e) => void patch(r.productId, { productId: r.productId, tracked: e.target.checked })} />
                    </td>
                    <td className="num">
                      <strong>{num(r.qty)}</strong>
                    </td>
                    <td>
                      <Select className="adm-select--auto" value={r.unit} aria-label="Unidad" onChange={(e) => void patch(r.productId, { productId: r.productId, unit: e.target.value as "ud" | "kg" })}>
                        <option value="ud">ud</option>
                        <option value="kg">kg</option>
                      </Select>
                    </td>
                    <td>
                      <QtyField key={`${r.productId}-${r.minQty}`} value={r.minQty} label="Mínimo" onCommit={(minQty) => void patch(r.productId, { productId: r.productId, minQty })} />
                    </td>
                    <td>
                      <MoneyInput className="adm-input adm-input--num" cents={r.costCents} aria-label="Coste" onCommit={(costCents) => void patch(r.productId, { productId: r.productId, costCents })} />
                    </td>
                    <td className="adm-nowrap">{r.price}</td>
                    <td className="num">{eur(r.valueCents)}</td>
                    <td>
                      <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    </td>
                    <td>
                      <Button size="sm" icon={<History size={14} />} onClick={() => setOpenId(r.productId)}>
                        Mover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {open && <MovementDrawer key={open.productId} productId={open.productId} name={open.name} unit={open.unit} qty={open.qty} onClose={() => setOpenId(null)} onSaved={refresh} />}
    </>
  );
}

function MovementDrawer({ productId, name, unit, qty, onClose, onSaved }: { productId: string; name: string; unit: string; qty: number; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const utils = trpc.useUtils();
  const history = trpc.business.listMovements.useQuery({ productId });
  const move = trpc.business.moveStock.useMutation();
  const [type, setType] = useState<"purchase" | "adjustment" | "waste" | "return">("purchase");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const save = async () => {
    const value = numberFromText(amount);
    if (!value) return toast.error("Indica una cantidad.");
    const signed = type === "waste" ? -Math.abs(value) : type === "adjustment" ? value : Math.abs(value);
    try {
      await move.mutateAsync({ productId, qty: signed, type, note: note.trim() });
      toast.success("Movimiento guardado");
      setAmount("");
      setNote("");
      await Promise.all([onSaved(), utils.business.listMovements.invalidate()]);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Drawer open onClose={onClose} title={name} subtitle={`Existencias actuales: ${num(qty)} ${unit}`}>
      <div className="adm-form">
        <Field label="Movimiento">
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="purchase">Entrada de mercancía</option>
            <option value="adjustment">Ajuste (usa «-» para restar)</option>
            <option value="waste">Merma</option>
            <option value="return">Devolución</option>
          </Select>
        </Field>
        <Field label={`Cantidad (${unit})`}>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Nota" span={2}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ej. recuento, albarán 123, venta en tienda…" />
        </Field>
      </div>
      <div className="adm-row-end">
        <Button variant="primary" loading={move.isPending} onClick={() => void save()}>
          Guardar movimiento
        </Button>
      </div>
      <h3 className="adm-subtitle">Historial</h3>
      {(history.data ?? []).length === 0 ? (
        <Empty title="Sin movimientos todavía" />
      ) : (
        <table className="adm-table adm-table--compact adm-table--boxed">
          <tbody>
            {(history.data ?? []).map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.at)}</td>
                <td>
                  {MOVEMENT_LABEL[m.type]}
                  {m.note && <small className="adm-muted"> {m.note}</small>}
                </td>
                <td className="num">
                  <strong>
                    {m.qty > 0 ? "+" : ""}
                    {num(m.qty)}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Drawer>
  );
}
