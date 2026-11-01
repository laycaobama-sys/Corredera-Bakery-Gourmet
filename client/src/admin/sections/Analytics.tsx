import { trpc } from "@/lib/trpc";
import { Clock, Eye, MapPin, MessageCircle, Phone, ShoppingCart, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty, fmtDate, fmtDuration, Kpi, Loading, num, PageHeader, Segmented } from "../ui";
import { CHART, ChartTooltip, Funnel, PageName, shortDate } from "./Dashboard";

type Range = "7" | "30";

const PIE = [CHART.primary, CHART.gold, "#c9b7a2"];

export function AnalyticsSection() {
  const q = trpc.admin.getAnalyticsDashboard.useQuery(undefined, { refetchInterval: 60_000 });
  const products = trpc.admin.listAllProducts.useQuery();
  const [range, setRange] = useState<Range>("30");

  const names = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p.name])), [products.data]);

  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const series = d.series30.slice(range === "7" ? -7 : -30);
  const sum = (k: keyof (typeof series)[number]) => series.reduce((a, s) => a + (s[k] as number), 0);
  const devices = [
    { name: "Móvil", value: d.totals.devices.mobile },
    { name: "Ordenador", value: d.totals.devices.desktop },
    { name: "Tablet", value: d.totals.devices.tablet },
  ];
  const langs = [
    { name: "Español", value: d.totals.languages.es },
    { name: "Inglés", value: d.totals.languages.en },
  ];
  const timed = d.pages.filter((p) => p.avgSeconds !== null);
  const avgTime = timed.length ? Math.round(timed.reduce((a, p) => a + (p.avgSeconds ?? 0) * p.views, 0) / Math.max(1, timed.reduce((a, p) => a + p.views, 0))) : null;

  return (
    <>
      <PageHeader
        title="Analítica web"
        subtitle={`Quién entra, qué miran y cuánto tiempo se quedan · actualizado ${fmtDate(d.updatedAt)}`}
        actions={<Segmented<Range> value={range} onChange={setRange} options={[{ value: "7", label: "7 días" }, { value: "30", label: "30 días" }]} />}
      />

      <div className="adm-kpis">
        <Kpi label="Visitas" value={num(sum("pageviews"))} icon={<Eye size={18} />} />
        <Kpi label="Visitantes únicos" value={num(sum("uniqueVisitors"))} icon={<Smartphone size={18} />} />
        <Kpi label="Fichas de producto vistas" value={num(sum("productViews"))} icon={<Eye size={18} />} tone="accent" />
        <Kpi label="Añadidos al pedido" value={num(sum("cartAdds"))} icon={<ShoppingCart size={18} />} tone="warning" />
        <Kpi label="Tiempo medio por página" value={fmtDuration(avgTime)} icon={<Clock size={18} />} tone="success" />
      </div>

      <Card title="Evolución diaria" subtitle="Visitas, fichas vistas y añadidos al pedido">
        <div className="adm-chart">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={range === "7" ? 0 : 4} />
              <YAxis allowDecimals={false} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="pageviews" name="Visitas" stroke={CHART.primary} strokeWidth={2} fill="url(#gA)" />
              <Area type="monotone" dataKey="productViews" name="Fichas vistas" stroke={CHART.gold} strokeWidth={2} fill="transparent" />
              <Area type="monotone" dataKey="cartAdds" name="Añadidos" stroke="#3d7a57" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="adm-legend">
          <span><i style={{ background: CHART.primary }} /> Visitas</span>
          <span><i style={{ background: CHART.gold }} /> Fichas de producto vistas</span>
          <span><i style={{ background: "#3d7a57" }} /> Añadidos al pedido</span>
        </div>
      </Card>

      <div className="adm-grid adm-grid--2">
        <Card title="Dónde se quedan" subtitle="Páginas más visitadas y tiempo medio de permanencia" pad={false}>
          {d.pages.length === 0 ? (
            <Empty title="Aún no hay datos" />
          ) : (
            <div className="adm-table-wrap adm-table-wrap--scroll">
              <table className="adm-table adm-table--compact">
                <thead>
                  <tr>
                    <th>Página</th>
                    <th className="num">Visitas</th>
                    <th className="num">Tiempo medio</th>
                  </tr>
                </thead>
                <tbody>
                  {d.pages.map((p) => {
                    const id = p.path.startsWith("/producto/") ? p.path.slice(10) : null;
                    return (
                      <tr key={p.path}>
                        <td>{id && names.get(id) ? <span className="adm-page-name"><strong>{names.get(id)}</strong><small>{p.path}</small></span> : <PageName path={p.path} />}</td>
                        <td className="num">{num(p.views)}</td>
                        <td className="num">{fmtDuration(p.avgSeconds)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Embudo de compra" subtitle="Total acumulado">
          <Funnel steps={d.funnel} />
          <div className="adm-mini-stats">
            <span><MessageCircle size={15} /> {num(d.totals.conversions.whatsappClick)} clics en WhatsApp</span>
            <span><Phone size={15} /> {num(d.totals.conversions.phoneClick)} llamadas</span>
            <span><MapPin size={15} /> {num(d.totals.conversions.mapsClick)} «Cómo llegar»</span>
          </div>
        </Card>
      </div>

      <div className="adm-grid adm-grid--3">
        <Card title="De dónde vienen">
          {d.sources.length === 0 ? (
            <Empty title="Sin datos todavía" />
          ) : (
            <div className="adm-chart">
              <ResponsiveContainer width="100%" height={Math.max(160, d.sources.length * 34)}>
                <BarChart data={d.sources} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#4a423b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: CHART.goldSoft }} formatter={(v) => [num(Number(v)), "Visitas"]} />
                  <Bar dataKey="count" fill={CHART.primary} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Dispositivos">
          <Donut data={devices} />
        </Card>

        <Card title="Idioma de la web">
          <Donut data={langs} />
        </Card>
      </div>

      <div className="adm-grid adm-grid--2">
        <Card title="Productos más vistos" pad={false}>
          <RankList items={d.topViewedProducts} names={names} empty="Sin visitas a fichas todavía" />
        </Card>
        <Card title="Productos más añadidos al pedido" pad={false}>
          <RankList items={d.topProducts} names={names} empty="Nadie ha añadido productos todavía" />
        </Card>
      </div>

      <p className="adm-privacy">
        Analítica propia y anónima: no usa cookies ni servicios externos y no guarda direcciones IP (cumple RGPD).
      </p>
    </>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <Empty title="Sin datos todavía" />;
  return (
    <div className="adm-donut">
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={PIE[i % PIE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => num(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="adm-donut__legend">
        {data.map((d, i) => (
          <li key={d.name}>
            <i style={{ background: PIE[i % PIE.length] }} />
            {d.name}
            <strong>{Math.round((d.value / total) * 100)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankList({ items, names, empty }: { items: { id: string; name: string; count: number }[]; names: Map<string, string>; empty: string }) {
  if (items.length === 0) return <Empty title={empty} />;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className="adm-rank adm-rank--bars">
      {items.map((p, i) => (
        <li key={p.id}>
          <span className="adm-rank__n">{i + 1}</span>
          <span className="adm-rank__name">
            {names.get(p.id) ?? p.name}
            <span className="adm-rank__bar"><span style={{ width: `${(p.count / max) * 100}%` }} /></span>
          </span>
          <strong>{num(p.count)}</strong>
        </li>
      ))}
    </ol>
  );
}
