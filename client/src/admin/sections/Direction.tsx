import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, Boxes, CalendarClock, Euro, Package, PackageX, Percent, ShoppingBag, Target, TrendingUp, Truck, UserPlus } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { LIVE } from "../business";
import { Card, Empty, eur, fmtDate, Kpi, Loading, num } from "../ui";
import { CHART, ChartTooltip, shortDate } from "./Dashboard";

const monthLabel = (m: string) => new Date(`${m}-15T00:00:00`).toLocaleDateString("es-ES", { month: "short" });
const euros = (cents: number) => Math.round(cents / 100);

/** Live direction board: every figure comes from real orders, stock, purchases, invoices and expenses. */
export function DirectionPanel() {
  const q = trpc.business.overview.useQuery(undefined, LIVE);
  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const goalPct = d.goalCents > 0 ? Math.min(100, Math.round((d.revenueCents / d.goalCents) * 100)) : null;
  const daily = d.daily.map((x) => ({ date: x.date, Ventas: euros(x.revenueCents), Pedidos: x.orders }));
  const series = d.series12.map((m) => ({ month: monthLabel(m.month), Facturación: euros(m.revenueCents), Costes: euros(m.expensesCents) }));

  return (
    <>
      <div className="adm-live">
        <span className="adm-live__dot" aria-hidden="true" /> En directo · actualizado {fmtDate(d.updatedAt)}
      </div>

      <div className="adm-kpis adm-kpis--4">
        <Kpi
          label="Facturación del mes"
          value={eur(d.revenueCents)}
          hint={d.growthPct === null ? `Mes anterior: ${eur(d.revenueLastCents)}` : `${d.growthPct >= 0 ? "+" : ""}${d.growthPct} % respecto al mes anterior`}
          icon={<Euro size={18} />}
          tone="success"
        />
        <Kpi
          label="Margen bruto"
          value={d.grossMarginPct === null ? "—" : `${d.grossMarginPct} %`}
          hint={d.grossMarginPct === null ? "Pon el coste de tus productos en Stock" : `${eur(d.grossMarginCents)} sin IVA · ${d.marginCoveragePct} % de las ventas con coste`}
          icon={<Percent size={18} />}
          tone="accent"
        />
        <Kpi label="Clientes nuevos" value={num(d.newClients)} hint={`${num(d.clientsTotal)} clientes con compras`} icon={<UserPlus size={18} />} />
        <Kpi
          label="Previsión de cierre"
          value={eur(d.forecastCents)}
          hint={goalPct === null ? "Al ritmo actual · fija tu objetivo en Finanzas" : `${goalPct} % del objetivo de ${eur(d.goalCents)}`}
          icon={goalPct === null ? <TrendingUp size={18} /> : <Target size={18} />}
          tone="warning"
        />
      </div>
      {goalPct !== null && (
        <div className="adm-goal" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Objetivo del mes">
          <span style={{ width: `${goalPct}%` }} />
        </div>
      )}

      <div className="adm-kpis adm-kpis--5">
        <Kpi label="Valor del inventario" value={eur(d.inventoryValueCents)} hint={`${num(d.trackedReferences)} referencias con stock controlado`} icon={<Boxes size={18} />} />
        <Kpi label="Referencias activas" value={num(d.activeReferences)} hint="Visibles en la web" icon={<Package size={18} />} />
        <Kpi label="Pedidos de hoy" value={num(d.ordersToday)} hint={`${eur(d.ordersTodayCents)} · ${num(d.ordersPending)} por confirmar`} icon={<ShoppingBag size={18} />} tone="accent" />
        <Kpi label="Envíos en ruta" value={num(d.shipmentsInTransit)} hint={d.shipmentsIncidents ? `${num(d.shipmentsIncidents)} con incidencia` : `${num(d.ordersPreparing)} en preparación`} icon={<Truck size={18} />} />
        <Kpi label="Roturas de stock" value={num(d.stockouts.length)} hint={`${num(d.lowStock.length)} bajo mínimo`} icon={<PackageX size={18} />} tone={d.stockouts.length ? "warning" : "default"} />
      </div>

      <div className="adm-grid adm-grid--2">
        <Card title="Ventas de este mes" subtitle="Día a día, en euros">
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={daily} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Ventas" stroke={CHART.primary} strokeWidth={2} fill="url(#gSales)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Facturación y costes" subtitle="Últimos 12 meses, en euros">
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART.goldSoft }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Facturación" fill={CHART.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Costes" fill={CHART.gold} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="adm-grid adm-grid--3">
        <Card title="Finanzas" actions={<Link href="/admin/finanzas" className="adm-link">Abrir <ArrowRight size={14} /></Link>}>
          <ul className="adm-statlist">
            <li><span>Resultado del mes</span><strong className={d.resultCents < 0 ? "is-neg" : ""}>{eur(d.resultCents)}</strong></li>
            <li><span>Compras recibidas</span><strong>{eur(d.purchasesMonthCents)}</strong></li>
            <li><span>Gastos</span><strong>{eur(d.expensesMonthCents)}</strong></li>
            <li><span>Por cobrar</span><strong>{eur(d.receivableCents)}</strong></li>
            <li><span>Por pagar</span><strong>{eur(d.payableCents)}</strong></li>
          </ul>
        </Card>
        <Card title="Oportunidades" actions={<Link href="/admin/leads" className="adm-link">Abrir <ArrowRight size={14} /></Link>}>
          <ul className="adm-statlist">
            <li><span>Leads nuevos</span><strong>{num(d.leads.new)}</strong></li>
            <li><span>En conversación</span><strong>{num(d.leads.contacted)}</strong></li>
            <li><span>Con presupuesto</span><strong>{num(d.leads.quoted)}</strong></li>
            <li><span>Valor en curso</span><strong>{eur(d.leads.pipelineCents)}</strong></li>
            <li><span>Presupuestos abiertos</span><strong>{num(d.quotesOpen)} · {eur(d.quotesOpenCents)}</strong></li>
          </ul>
        </Card>
        <Card title="Requiere atención">
          {d.stockouts.length + d.lowStock.length + d.leadsDue.length === 0 ? (
            <Empty title="Nada urgente" text="Aquí verás roturas de stock y seguimientos pendientes." />
          ) : (
            <ul className="adm-attention">
              {d.stockouts.slice(0, 5).map((s) => (
                <li key={s.id} className="is-danger"><PackageX size={15} /> <Link href="/admin/stock">Sin stock: {s.name}</Link></li>
              ))}
              {d.lowStock.slice(0, 5).map((s) => (
                <li key={s.id}><AlertTriangle size={15} /> <Link href="/admin/stock">Bajo mínimo: {s.name} ({num(s.qty)} {s.unit})</Link></li>
              ))}
              {d.leadsDue.slice(0, 5).map((l) => (
                <li key={l.id}><CalendarClock size={15} /> <Link href="/admin/leads">Seguimiento: {l.name}</Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
