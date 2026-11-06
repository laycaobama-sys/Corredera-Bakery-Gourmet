import { trpc } from "@/lib/trpc";
import { Download, Plus, Target, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { categoryName, LIVE, MoneyInput, today } from "../business";
import { Badge, Button, Card, Confirm, downloadCsv, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Select, Toggle } from "../ui";
import { CHART, ChartTooltip } from "./Dashboard";

const CATEGORIES = ["Alquiler", "Nóminas", "Suministros", "Marketing", "Transporte", "Impuestos", "Gestoría", "Mantenimiento", "Otros"];
const monthName = (m: string) => new Date(`${m}-15T00:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const csvEuros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

type ExpenseDraft = { id?: string; date: string; category: string; description: string; amountCents: number; paid: boolean };

export function FinanceSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.overview.useQuery(undefined, LIVE);
  const expenses = trpc.business.listExpenses.useQuery();
  const goal = trpc.business.setMonthlyGoal.useMutation();
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const refresh = () => Promise.all([utils.business.listExpenses.invalidate(), utils.business.overview.invalidate()]);
  const series = d.series12.map((m) => ({ month: new Date(`${m.month}-15T00:00:00`).toLocaleDateString("es-ES", { month: "short" }), Ingresos: Math.round(m.revenueCents / 100), Costes: Math.round(m.expensesCents / 100) }));

  return (
    <>
      <PageHeader
        title="Finanzas"
        subtitle="Ingresos de pedidos entregados y facturas, menos compras recibidas y gastos."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDraft({ date: today(), category: "Otros", description: "", amountCents: 0, paid: true })}>
            Añadir gasto
          </Button>
        }
      />
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Ingresos del mes" value={eur(d.revenueCents)} tone="success" icon={<Wallet size={18} />} />
        <Kpi label="Compras y gastos" value={eur(d.purchasesMonthCents + d.expensesMonthCents)} tone="warning" />
        <Kpi label="Resultado del mes" value={eur(d.resultCents)} tone="accent" hint="Antes de impuestos" />
        <Kpi label="Previsión de cierre" value={eur(d.forecastCents)} hint="Al ritmo actual de ventas" />
      </div>
      <div className="adm-grid adm-grid--2-1">
        <Card title="Evolución" subtitle="Últimos 12 meses, en euros">
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={series} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART.goldSoft }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill={CHART.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Costes" fill={CHART.gold} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Tesorería y objetivo">
          <ul className="adm-statlist">
            <li>
              <span>Por cobrar</span>
              <strong>{eur(d.receivableCents)}</strong>
            </li>
            <li>
              <span>Por pagar</span>
              <strong>{eur(d.payableCents)}</strong>
            </li>
            <li>
              <span>Valor del inventario</span>
              <strong>{eur(d.inventoryValueCents)}</strong>
            </li>
          </ul>
          <Field label="Objetivo de ventas del mes (€)" hint="Se muestra en el panel de dirección">
            <MoneyInput
              cents={d.goalCents}
              onCommit={async (cents) => {
                await goal.mutateAsync({ cents });
                await refresh();
                toast.success("Objetivo guardado");
              }}
            />
          </Field>
          {d.goalCents > 0 && (
            <p className="adm-small adm-muted">
              <Target size={13} /> Llevas {Math.round((d.revenueCents / d.goalCents) * 100)} % del objetivo.
            </p>
          )}
        </Card>
      </div>
      <Card
        title="Gastos"
        pad={false}
        actions={
          <Button
            size="sm"
            icon={<Download size={14} />}
            disabled={(expenses.data ?? []).length === 0}
            onClick={() =>
              downloadCsv(`gastos-corredera-${today()}.csv`, [["Fecha", "Categoría", "Concepto", "Importe (€)", "Pagado"], ...(expenses.data ?? []).map((e) => [e.date, e.category, e.description, csvEuros(e.amountCents), e.paid ? "Sí" : "No"])])
            }
          >
            CSV
          </Button>
        }
      >
        {(expenses.data ?? []).length === 0 ? (
          <Empty title="Aún no hay gastos" text="Apunta alquiler, nóminas, suministros… para ver el resultado real del mes." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Concepto</th>
                  <th>Estado</th>
                  <th className="num">Importe</th>
                </tr>
              </thead>
              <tbody>
                {[...(expenses.data ?? [])]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <tr key={e.id} className="is-click" onClick={() => setDraft({ id: e.id, date: e.date, category: e.category, description: e.description, amountCents: e.amountCents, paid: e.paid })}>
                      <td>{fmtDate(e.date, false)}</td>
                      <td>{e.category}</td>
                      <td>{e.description}</td>
                      <td>
                        <Badge tone={e.paid ? "success" : "warning"}>{e.paid ? "Pagado" : "Pendiente"}</Badge>
                      </td>
                      <td className="num">
                        <strong>{eur(e.amountCents)}</strong>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {draft && <ExpenseDrawer draft={draft} onClose={() => setDraft(null)} onSaved={refresh} />}
    </>
  );
}

function ExpenseDrawer({ draft: initial, onClose, onSaved }: { draft: ExpenseDraft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const save = trpc.business.saveExpense.useMutation();
  const del = trpc.business.deleteExpense.useMutation();
  const [d, setD] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  return (
    <Drawer
      open
      onClose={onClose}
      title={d.id ? "Editar gasto" : "Nuevo gasto"}
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
                toast.success("Gasto guardado");
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
        <Field label="Fecha">
          <Input type="date" value={d.date} onChange={(e) => setD((x) => ({ ...x, date: e.target.value }))} />
        </Field>
        <Field label="Categoría">
          <Select value={d.category} onChange={(e) => setD((x) => ({ ...x, category: e.target.value }))}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Concepto" span={2}>
          <Input value={d.description} onChange={(e) => setD((x) => ({ ...x, description: e.target.value }))} maxLength={200} />
        </Field>
        <Field label="Importe (€)">
          <MoneyInput cents={d.amountCents} onCommit={(amountCents) => setD((x) => ({ ...x, amountCents }))} />
        </Field>
      </div>
      <Toggle checked={d.paid} onChange={(paid) => setD((x) => ({ ...x, paid }))} label="Pagado" />
      <Confirm
        open={confirm}
        danger
        title="¿Eliminar este gasto?"
        text={d.description}
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

/* ------------------------------------------------------------------ Reports */

export function ReportsSection() {
  const q = trpc.business.overview.useQuery(undefined, LIVE);
  const stock = trpc.business.listStock.useQuery();
  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const rows = stock.data ?? [];
  const byCategory = new Map<string, { label: string; refs: number; value: number; tracked: number }>();
  for (const r of rows) {
    const key = `${r.mode}:${r.category}`;
    const c = byCategory.get(key) ?? { label: categoryName(r.mode, r.category), refs: 0, value: 0, tracked: 0 };
    c.refs += 1;
    c.value += r.valueCents;
    if (r.tracked) c.tracked += 1;
    byCategory.set(key, c);
  }
  const categoriesRows = [...byCategory.values()].sort((a, b) => b.value - a.value || b.refs - a.refs);
  const months = [...d.series12].reverse();

  return (
    <>
      <PageHeader title="Informes" subtitle="Datos reales de ventas, márgenes e inventario, listos para exportar." />
      <div className="adm-grid adm-grid--2">
        <Card
          title="Productos más vendidos"
          subtitle="Pedidos entregados"
          pad={false}
          actions={
            <Button
              size="sm"
              icon={<Download size={14} />}
              disabled={d.topProducts.length === 0}
              onClick={() => downloadCsv(`ventas-productos-${today()}.csv`, [["Producto", "Unidades", "Ventas (€)", "Margen s/IVA (€)"], ...d.topProducts.map((p) => [p.name, p.qty, csvEuros(p.cents), p.marginCents === null ? "" : csvEuros(p.marginCents)])])}
            >
              CSV
            </Button>
          }
        >
          {d.topProducts.length === 0 ? (
            <Empty title="Aún no hay ventas" text="Aparecerán al marcar pedidos como entregados." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--compact">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="num">Uds.</th>
                    <th className="num">Ventas</th>
                    <th className="num">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="num">{num(p.qty)}</td>
                      <td className="num">{eur(p.cents)}</td>
                      <td className="num">{p.marginCents === null ? "—" : eur(p.marginCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Resultados por mes" pad={false} actions={
          <Button size="sm" icon={<Download size={14} />} onClick={() => downloadCsv(`resultados-mensuales-${today()}.csv`, [["Mes", "Ingresos (€)", "Costes (€)", "Resultado (€)"], ...months.map((m) => [m.month, csvEuros(m.revenueCents), csvEuros(m.expensesCents), csvEuros(m.revenueCents - m.expensesCents)])])}>
            CSV
          </Button>
        }>
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--compact">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="num">Ingresos</th>
                  <th className="num">Costes</th>
                  <th className="num">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month}>
                    <td>{monthName(m.month)}</td>
                    <td className="num">{eur(m.revenueCents)}</td>
                    <td className="num">{eur(m.expensesCents)}</td>
                    <td className="num">
                      <strong>{eur(m.revenueCents - m.expensesCents)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card title="Inventario por categoría" pad={false}>
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--compact">
            <thead>
              <tr>
                <th>Categoría</th>
                <th className="num">Referencias</th>
                <th className="num">Con stock controlado</th>
                <th className="num">Valor a coste</th>
              </tr>
            </thead>
            <tbody>
              {categoriesRows.map((c) => (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td className="num">{num(c.refs)}</td>
                  <td className="num">{num(c.tracked)}</td>
                  <td className="num">{eur(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
