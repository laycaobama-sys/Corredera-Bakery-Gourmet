import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, CheckCircle2, Euro, Eye, Info, MousePointerClick, ShoppingBag, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { MODALITY_LABEL, ORDER_STATUS, type OrderStatus } from "../shared";
import { Badge, Card, Empty, eur, fmtDate, fmtDuration, Kpi, Loading, num, PageHeader } from "../ui";
import { DirectionPanel } from "./Direction";

export const CHART = {
  primary: "#6b2328",
  primarySoft: "rgba(107, 35, 40, 0.14)",
  gold: "#b08a4a",
  goldSoft: "rgba(176, 138, 74, 0.18)",
  grid: "#ece6dd",
  axis: "#8a8178",
};

export const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

export function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; money?: string[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="adm-tooltip">
      <p className="adm-tooltip__label">{label ? shortDate(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.name}>
          <span style={{ background: p.color }} />
          {p.name}: <strong>{money?.includes(p.name) ? eur(p.value) : num(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export function Funnel({ steps }: { steps: { step: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="adm-funnel">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const rate = prev ? Math.round((s.value / Math.max(1, prev)) * 100) : null;
        return (
          <div key={s.step} className="adm-funnel__row">
            <div className="adm-funnel__meta">
              <span>{s.step}</span>
              <strong>{num(s.value)}</strong>
            </div>
            <div className="adm-funnel__bar">
              <span style={{ width: `${Math.max(2, (s.value / max) * 100)}%` }} />
            </div>
            {rate !== null && <span className="adm-funnel__rate">{rate}% del paso anterior</span>}
          </div>
        );
      })}
    </div>
  );
}

type Check = { tone: "warn" | "info"; text: string; href: string; action: string };

/** Things the owner should look at, computed from the live data (shown first on the summary). */
function StoreHealth({ pendingOrders }: { pendingOrders: number }) {
  const auth = trpc.admin.authStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const products = trpc.admin.listAllProducts.useQuery();
  const settings = trpc.catalog.siteSettings.useQuery();
  if (!products.data || !settings.data) return null;

  const s = settings.data;
  const visible = products.data.filter((p) => p.active);
  const askPrice = visible.filter((p) => p.price === "Consultar").length;
  const hidden = products.data.length - visible.length;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const emailDomain = s.contact.contactEmail.split("@")[1] ?? "";

  const checks: Check[] = [];
  if (auth.data?.ownerPasswordIsInitial)
    checks.push({ tone: "warn", text: "Sigues usando la contraseña inicial. Cámbiala por una tuya.", href: "/admin/seguridad", action: "Cambiar contraseña" });
  if (pendingOrders > 0)
    checks.push({ tone: "warn", text: `${pendingOrders} ${pendingOrders === 1 ? "pedido espera" : "pedidos esperan"} confirmación por WhatsApp.`, href: "/admin/pedidos", action: "Ver pedidos" });
  if (s.legal.nif.includes("PENDIENTE") || s.legal.registryInfo.includes("PENDIENTE"))
    checks.push({ tone: "warn", text: "Faltan el NIF o los datos del Registro Mercantil (obligatorios en el aviso legal).", href: "/admin/tienda", action: "Completar datos legales" });
  if (emailDomain === "correderagourmet.com" && !host.endsWith("correderagourmet.com"))
    checks.push({ tone: "warn", text: `El email de contacto (${s.contact.contactEmail}) es del dominio antiguo: puede que no recibas correos.`, href: "/admin/tienda", action: "Cambiar email" });
  if (askPrice > 0)
    checks.push({ tone: "info", text: `${askPrice} productos muestran «Consultar». Si tienes su precio, ponlo: se vende más.`, href: "/admin/productos?filtro=consultar", action: "Ver productos" });
  if (hidden > 0)
    checks.push({ tone: "info", text: `${hidden} productos están ocultos en la web.`, href: "/admin/productos?filtro=ocultos", action: "Revisar" });

  return (
    <Card title="Estado de la tienda" subtitle={checks.length ? "Lo que conviene revisar" : undefined}>
      {checks.length === 0 ? (
        <p className="adm-health adm-health--ok">
          <CheckCircle2 size={18} /> Todo en orden: datos legales completos, contraseña propia y ningún pedido pendiente.
        </p>
      ) : (
        <ul className="adm-health">
          {checks.map((c) => (
            <li key={c.text} className={`adm-health__item is-${c.tone}`}>
              {c.tone === "warn" ? <AlertTriangle size={18} /> : <Info size={18} />}
              <span>{c.text}</span>
              <Link href={c.href} className="adm-link">
                {c.action} <ArrowRight size={14} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DashboardSection() {
  const q = trpc.admin.getAnalyticsDashboard.useQuery(undefined, { refetchInterval: 60_000 });
  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const p30 = d.periods.last30;
  const p7 = d.periods.last7;

  return (
    <>
      <PageHeader
        title="Panel de dirección"
        subtitle="La foto del negocio en tiempo real: ventas, margen, inventario, pedidos y envíos."
      />

      <DirectionPanel />
      <StoreHealth pendingOrders={d.totals.pendingOrdersCount} />

      <h2 className="adm-section-title">La web</h2>

      <div className="adm-kpis">
        <Kpi label="Visitas (30 días)" value={num(p30.visits)} hint={`${num(p7.visits)} en los últimos 7 días · ${num(d.periods.today.visits)} hoy`} icon={<Eye size={18} />} />
        <Kpi label="Visitantes únicos (30 días)" value={num(p30.visitors)} hint={`${d.totals.mobileSharePct}% desde el móvil`} icon={<Users size={18} />} />
        <Kpi label="Pedidos (30 días)" value={num(p30.orders)} hint={`${d.totals.pendingOrdersCount} pendientes de confirmar`} icon={<ShoppingBag size={18} />} tone="accent" />
        <Kpi label="Importe estimado (30 días)" value={eur(p30.revenueCents)} hint="Sin contar artículos al peso" icon={<Euro size={18} />} tone="success" />
        <Kpi
          label="Conversión"
          value={`${d.totals.conversionRatePct}%`}
          hint="Visitantes que envían un pedido"
          icon={<MousePointerClick size={18} />}
          tone="warning"
        />
      </div>

      <div className="adm-grid adm-grid--2-1">
        <Card title="Visitas a la web" subtitle="Últimos 30 días">
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={d.series30} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="pageviews" name="Visitas" stroke={CHART.primary} strokeWidth={2} fill="url(#gVisits)" />
                <Area type="monotone" dataKey="uniqueVisitors" name="Visitantes" stroke={CHART.gold} strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="adm-legend">
            <span><i style={{ background: CHART.primary }} /> Visitas</span>
            <span><i style={{ background: CHART.gold }} /> Visitantes únicos</span>
          </div>
        </Card>

        <Card title="Embudo de compra" subtitle="Desde que entran hasta que piden">
          <Funnel steps={d.funnel} />
        </Card>
      </div>

      <div className="adm-grid adm-grid--2">
        <Card title="Pedidos por día" subtitle="Últimos 30 días">
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.series30} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART.goldSoft }} />
                <Bar dataKey="orders" name="Pedidos" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Páginas donde más se quedan"
          subtitle="Visitas y tiempo medio de permanencia"
          actions={<Link href="/admin/analitica" className="adm-link">Ver analítica <ArrowRight size={14} /></Link>}
          pad={false}
        >
          {d.pages.length === 0 ? (
            <Empty title="Aún no hay datos de navegación" text="Aparecerán en cuanto lleguen las primeras visitas." />
          ) : (
            <table className="adm-table adm-table--compact">
              <thead>
                <tr>
                  <th>Página</th>
                  <th className="num">Visitas</th>
                  <th className="num">Tiempo medio</th>
                </tr>
              </thead>
              <tbody>
                {d.pages.slice(0, 7).map((p) => (
                  <tr key={p.path}>
                    <td><PageName path={p.path} /></td>
                    <td className="num">{num(p.views)}</td>
                    <td className="num">{fmtDuration(p.avgSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="adm-grid adm-grid--2-1">
        <Card
          title="Últimos pedidos"
          actions={<Link href="/admin/pedidos" className="adm-link">Ver todos <ArrowRight size={14} /></Link>}
          pad={false}
        >
          {d.recentOrders.length === 0 ? (
            <Empty icon={<ShoppingBag size={28} strokeWidth={1.25} />} title="Todavía no hay pedidos" text="Cuando un cliente envíe un pedido desde la web aparecerá aquí." />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Entrega</th>
                  <th className="num">Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.customerName}</strong>
                      <small className="adm-muted">{o.id}</small>
                    </td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td>{MODALITY_LABEL[o.modality ?? "pickup"]}</td>
                    <td className="num">{o.totalAmountCents > 0 ? eur(o.totalAmountCents) : "Al peso"}</td>
                    <td>
                      <Badge tone={ORDER_STATUS[o.status as OrderStatus]?.tone ?? "neutral"}>{ORDER_STATUS[o.status as OrderStatus]?.label ?? o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Lo que más se añade al pedido" pad={false}>
          {d.topProducts.length === 0 ? (
            <Empty title="Sin datos todavía" />
          ) : (
            <ol className="adm-rank">
              {d.topProducts.slice(0, 7).map((p, i) => (
                <li key={p.id}>
                  <span className="adm-rank__n">{i + 1}</span>
                  <span className="adm-rank__name">{p.name}</span>
                  <strong>{num(p.count)}</strong>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}

const PAGE_NAMES: Record<string, string> = {
  "/": "Inicio",
  "/tienda": "Tienda",
  "/bakery-cafe": "Carta Bakery & Café",
  "/gourmet/jamones": "Jamones",
  "/gourmet/jamon-cortado": "Jamón cortado",
  "/gourmet/sobres-jamon": "Loncheados",
  "/gourmet/embutidos": "Embutidos",
  "/gourmet/sobres-embutidos": "Embutidos 100 g",
  "/gourmet/quesos": "Quesos",
  "/gourmet/aceites": "Aceites",
};

export function PageName({ path }: { path: string }) {
  const name = PAGE_NAMES[path] ?? (path.startsWith("/producto/") ? `Producto · ${path.slice(10)}` : path);
  return (
    <span className="adm-page-name">
      <strong>{name}</strong>
      <small>{path}</small>
    </span>
  );
}
