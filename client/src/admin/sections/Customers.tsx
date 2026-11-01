import { trpc } from "@/lib/trpc";
import { Download, MessageCircle, Phone, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { waLink } from "../shared";
import { Button, Card, downloadCsv, Drawer, Empty, eur, fmtDate, Kpi, Loading, num, PageHeader } from "../ui";
import { OrdersSection } from "./Orders";

export function CustomersSection() {
  const q = trpc.admin.listCustomers.useQuery();
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const customers = q.data ?? [];

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => `${c.name} ${c.phone} ${c.lastAddress ?? ""}`.toLowerCase().includes(s));
  }, [customers, search]);

  const repeat = customers.filter((c) => c.orders > 1).length;
  const totalCents = customers.reduce((a, c) => a + c.totalCents, 0);
  const open = customers.find((c) => c.key === openKey) ?? null;

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Personas que han hecho pedidos en la web, agrupadas por teléfono."
        actions={
          <Button
            icon={<Download size={16} />}
            disabled={customers.length === 0}
            onClick={() =>
              downloadCsv(`clientes-corredera-${new Date().toISOString().slice(0, 10)}.csv`, [
                ["Nombre", "Teléfono", "Pedidos", "Importe total (€)", "Primer pedido", "Último pedido", "Última dirección"],
                ...visible.map((c) => [c.name, c.phone, c.orders, (c.totalCents / 100).toFixed(2).replace(".", ","), fmtDate(c.firstOrderAt, false), fmtDate(c.lastOrderAt, false), c.lastAddress ?? ""]),
              ])
            }
          >
            Exportar Excel (CSV)
          </Button>
        }
      />

      <div className="adm-kpis adm-kpis--3">
        <Kpi label="Clientes" value={num(customers.length)} />
        <Kpi label="Clientes que repiten" value={num(repeat)} hint={customers.length ? `${Math.round((repeat / customers.length) * 100)}% del total` : undefined} tone="accent" />
        <Kpi label="Importe total estimado" value={eur(totalCents)} tone="success" />
      </div>

      <Card pad={false}>
        <div className="adm-toolbar">
          <label className="adm-search adm-search--grow">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, teléfono o dirección…" />
          </label>
        </div>
        {q.isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty icon={<Users size={30} strokeWidth={1.25} />} title={customers.length ? "Sin resultados" : "Aún no hay clientes"} text={customers.length ? undefined : "Cada persona que envíe un pedido aparecerá aquí con su historial."} />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--click">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th className="num">Pedidos</th>
                  <th className="num">Importe</th>
                  <th>Último pedido</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const wa = waLink(c.phone);
                  return (
                    <tr key={c.key} onClick={() => setOpenKey(c.key)}>
                      <td>
                        <span className="adm-person">
                          <span className="adm-avatar adm-avatar--soft">{c.name.slice(0, 1).toUpperCase()}</span>
                          <strong>{c.name}</strong>
                        </span>
                      </td>
                      <td>{c.phone || "—"}</td>
                      <td className="num">{c.orders}</td>
                      <td className="num">{eur(c.totalCents)}</td>
                      <td>{fmtDate(c.lastOrderAt, false)}</td>
                      <td className="num" onClick={(e) => e.stopPropagation()}>
                        {wa && (
                          <a className="adm-icon-btn adm-icon-btn--wa" href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${c.name}`}>
                            <MessageCircle size={16} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenKey(null)}
        title={open?.name ?? ""}
        subtitle={open ? `${open.orders} pedidos · cliente desde ${fmtDate(open.firstOrderAt, false)}` : ""}
        width={760}
        footer={
          open?.phone ? (
            <>
              <a className="adm-btn adm-btn--secondary adm-btn--md" href={`tel:${open.phone}`}>
                <Phone size={16} /> Llamar
              </a>
              {waLink(open.phone) && (
                <a className="adm-btn adm-btn--success adm-btn--md" href={waLink(open.phone)!} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
            </>
          ) : undefined
        }
      >
        {open && (
          <>
            <div className="adm-kpis adm-kpis--3 adm-kpis--tight">
              <Kpi label="Pedidos" value={open.orders} />
              <Kpi label="Importe" value={eur(open.totalCents)} />
              <Kpi label="Último" value={fmtDate(open.lastOrderAt, false)} />
            </div>
            {open.lastAddress && <p className="adm-muted adm-small">Última dirección de entrega: {open.lastAddress}</p>}
            <OrdersSection initialIds={open.orderIds} />
          </>
        )}
      </Drawer>
    </>
  );
}
