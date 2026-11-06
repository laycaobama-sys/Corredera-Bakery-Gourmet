import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileText, Plus, Printer, Receipt, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { companyFrom, documentTotals, LIVE, LineEditor, printDocument, today, vatForCategory, type DocLine } from "../business";
import { Badge, Button, Card, Confirm, downloadCsv, Drawer, Empty, errorMessage, eur, Field, fmtDate, Input, Kpi, Loading, num, PageHeader, Select, Textarea } from "../ui";

const QUOTE_STATUS = {
  draft: { label: "Borrador", tone: "neutral" },
  sent: { label: "Enviado", tone: "info" },
  accepted: { label: "Aceptado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
} as const;

const INVOICE_STATUS = {
  issued: { label: "Pendiente de cobro", tone: "warning" },
  paid: { label: "Cobrada", tone: "success" },
  void: { label: "Anulada", tone: "neutral" },
} as const;

/* ------------------------------------------------------------------ Quotes */

type QuoteDraft = { id?: string; number?: string; customerName: string; phone: string; email: string; taxId: string; address: string; lines: DocLine[]; status: keyof typeof QUOTE_STATUS; validUntil: string; notes: string; leadId?: string };

const newQuote = (): QuoteDraft => {
  const valid = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
  return { customerName: "", phone: "", email: "", taxId: "", address: "", lines: [{ description: "", qty: 1, unitCents: 0, vatPct: 10 }], status: "draft", validUntil: valid, notes: "" };
};

export function QuotesSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.listQuotes.useQuery(undefined, LIVE);
  const leads = trpc.business.listLeads.useQuery();
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const quotes = q.data ?? [];
  const refresh = () => Promise.all([utils.business.listQuotes.invalidate(), utils.business.listLeads.invalidate(), utils.business.overview.invalidate()]);

  // Coming from a lead: the quote starts with their details.
  useEffect(() => {
    const leadId = new URLSearchParams(window.location.search).get("lead");
    const lead = leadId ? leads.data?.find((l) => l.id === leadId) : undefined;
    if (lead) {
      setDraft({ ...newQuote(), customerName: lead.name, phone: lead.phone, email: lead.email, leadId: lead.id, notes: lead.interest });
      window.history.replaceState(null, "", "/admin/presupuestos");
    }
  }, [leads.data]);

  const open = quotes.filter((x) => x.status === "draft" || x.status === "sent");
  const decided = quotes.filter((x) => x.status === "accepted" || x.status === "rejected");
  const accepted = quotes.filter((x) => x.status === "accepted");

  return (
    <>
      <PageHeader
        title="Presupuestos"
        subtitle="Cestas de empresa, catering, jamones por encargo… Imprímelos o guárdalos en PDF y conviértelos en factura cuando los acepten."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDraft(newQuote())}>
            Nuevo presupuesto
          </Button>
        }
      />
      <div className="adm-kpis adm-kpis--3">
        <Kpi label="Abiertos" value={num(open.length)} hint={eur(open.reduce((a, x) => a + x.totalCents, 0))} tone="accent" />
        <Kpi label="Aceptados" value={num(accepted.length)} hint={eur(accepted.reduce((a, x) => a + x.totalCents, 0))} tone="success" />
        <Kpi label="Tasa de aceptación" value={decided.length ? `${Math.round((accepted.length / decided.length) * 100)} %` : "—"} />
      </div>
      <Card pad={false}>
        {q.isLoading ? (
          <Loading />
        ) : quotes.length === 0 ? (
          <Empty icon={<FileText size={30} strokeWidth={1.25} />} title="Aún no hay presupuestos" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Válido hasta</th>
                  <th>Estado</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((x) => (
                  <tr key={x.id} className="is-click" onClick={() => setDraft({ id: x.id, number: x.number, customerName: x.customerName, phone: x.phone, email: x.email, taxId: x.taxId, address: x.address, lines: x.lines, status: x.status, validUntil: x.validUntil, notes: x.notes, leadId: x.leadId })}>
                    <td>
                      <strong>{x.number}</strong>
                    </td>
                    <td>{x.customerName}</td>
                    <td>{fmtDate(x.createdAt, false)}</td>
                    <td>{x.validUntil ? fmtDate(x.validUntil, false) : "—"}</td>
                    <td>
                      <Badge tone={QUOTE_STATUS[x.status].tone}>{QUOTE_STATUS[x.status].label}</Badge>
                    </td>
                    <td className="num">{eur(x.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {draft && <QuoteDrawer draft={draft} onClose={() => setDraft(null)} onSaved={refresh} />}
    </>
  );
}

function QuoteDrawer({ draft: initial, onClose, onSaved }: { draft: QuoteDraft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const utils = trpc.useUtils();
  const settings = trpc.catalog.siteSettings.useQuery();
  const save = trpc.business.saveQuote.useMutation();
  const del = trpc.business.deleteQuote.useMutation();
  const invoice = trpc.business.createInvoice.useMutation();
  const [d, setD] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof QuoteDraft>(k: K, v: QuoteDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const [, navigate] = useLocation();

  const persist = async () => {
    const { number: _n, ...payload } = d;
    return save.mutateAsync(payload);
  };
  const submit = async () => {
    try {
      await persist();
      toast.success("Presupuesto guardado");
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const print = async () => {
    if (!settings.data) return;
    try {
      const saved = await persist();
      setD((x) => ({ ...x, id: saved.id, number: saved.number }));
      await onSaved();
      printDocument({
        title: "Presupuesto",
        number: saved.number,
        date: fmtDate(saved.createdAt, false),
        extra: saved.validUntil ? `Válido hasta ${fmtDate(saved.validUntil, false)}` : undefined,
        company: companyFrom(settings.data),
        customer: { name: d.customerName, taxId: d.taxId, address: d.address, email: d.email, phone: d.phone },
        lines: d.lines,
        notes: d.notes,
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const toInvoice = async () => {
    try {
      const saved = await persist();
      await invoice.mutateAsync({ customerName: d.customerName, taxId: d.taxId, address: d.address, email: d.email, lines: d.lines, method: "", notes: d.notes, quoteId: saved.id });
      toast.success("Factura creada");
      await Promise.all([onSaved(), utils.business.listInvoices.invalidate()]);
      navigate("/admin/facturacion");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={760}
      title={d.number ?? "Nuevo presupuesto"}
      footer={
        <>
          {d.id && (
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirm(true)}>
              Eliminar
            </Button>
          )}
          <div className="adm-spacer" />
          <Button icon={<Printer size={16} />} onClick={() => void print()}>
            Imprimir / PDF
          </Button>
          <Button icon={<Receipt size={16} />} onClick={() => void toInvoice()} loading={invoice.isPending}>
            Facturar
          </Button>
          <Button variant="primary" loading={save.isPending} onClick={() => void submit()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="adm-form">
        <Field label="Cliente o empresa" span={2}>
          <Input value={d.customerName} onChange={(e) => set("customerName", e.target.value)} maxLength={160} />
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
        <Field label="Dirección">
          <Input value={d.address} onChange={(e) => set("address", e.target.value)} maxLength={240} />
        </Field>
        <Field label="Estado">
          <Select value={d.status} onChange={(e) => set("status", e.target.value as QuoteDraft["status"])}>
            {Object.entries(QUOTE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Válido hasta">
          <Input type="date" value={d.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
        </Field>
      </div>
      <h3 className="adm-subtitle">Líneas</h3>
      <LineEditor lines={d.lines} onChange={(lines) => set("lines", lines)} />
      <Field label="Notas y condiciones">
        <Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={800} rows={3} />
      </Field>
      <Confirm
        open={confirm}
        danger
        title="¿Eliminar este presupuesto?"
        text={`Se borrará ${d.number}.`}
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

/* ------------------------------------------------------------------ Invoices */

type InvoiceDraft = { customerName: string; taxId: string; address: string; email: string; lines: DocLine[]; method: string; notes: string; orderId?: string };
const newInvoice = (): InvoiceDraft => ({ customerName: "", taxId: "", address: "", email: "", lines: [{ description: "", qty: 1, unitCents: 0, vatPct: 10 }], method: "Tarjeta", notes: "" });

export function InvoicesSection() {
  const utils = trpc.useUtils();
  const q = trpc.business.listInvoices.useQuery(undefined, LIVE);
  const settings = trpc.catalog.siteSettings.useQuery();
  const setStatus = trpc.business.setInvoiceStatus.useMutation();
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [search, setSearch] = useState("");
  const invoices = q.data ?? [];
  const refresh = () => Promise.all([utils.business.listInvoices.invalidate(), utils.business.overview.invalidate()]);
  const visible = invoices.filter((i) => `${i.number} ${i.customerName} ${i.taxId}`.toLowerCase().includes(search.trim().toLowerCase()));
  const monthKey = new Date().toISOString().slice(0, 7);
  const valid = invoices.filter((i) => i.status !== "void");
  const month = valid.filter((i) => i.issuedAt.startsWith(monthKey));

  const print = (i: (typeof invoices)[number]) => {
    if (!settings.data) return;
    printDocument({
      title: i.status === "void" ? "Factura anulada" : "Factura",
      number: i.number,
      date: fmtDate(i.issuedAt, false),
      extra: i.method || undefined,
      company: companyFrom(settings.data),
      customer: { name: i.customerName, taxId: i.taxId, address: i.address, email: i.email },
      lines: i.lines,
      notes: i.notes,
    });
  };

  return (
    <>
      <PageHeader
        title="Facturación"
        subtitle="Facturas numeradas de forma consecutiva. Una factura emitida no se edita: se anula y se emite otra."
        actions={
          <>
            <Button
              disabled={valid.length === 0}
              onClick={() =>
                downloadCsv(`facturas-corredera-${today()}.csv`, [
                  ["Número", "Fecha", "Cliente", "NIF", "Base (€)", "IVA (€)", "Total (€)", "Estado"],
                  ...invoices.map((i) => [i.number, fmtDate(i.issuedAt, false), i.customerName, i.taxId, (i.baseCents / 100).toFixed(2).replace(".", ","), (i.vatCents / 100).toFixed(2).replace(".", ","), (i.totalCents / 100).toFixed(2).replace(".", ","), INVOICE_STATUS[i.status].label]),
                ])
              }
            >
              Exportar para el gestor
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDraft(newInvoice())}>
              Nueva factura
            </Button>
          </>
        }
      />
      <div className="adm-alert adm-alert--info">
        Registro interno de facturas. Antes de usarlas como facturas oficiales, confirma con tu gestor el cumplimiento de Verifactu (sistemas de facturación, RD 1007/2023).
      </div>
      <div className="adm-kpis adm-kpis--4">
        <Kpi label="Facturado este mes" value={eur(month.reduce((a, i) => a + i.totalCents, 0))} tone="success" />
        <Kpi label="IVA repercutido (mes)" value={eur(month.reduce((a, i) => a + i.vatCents, 0))} />
        <Kpi label="Pendiente de cobro" value={eur(invoices.filter((i) => i.status === "issued").reduce((a, i) => a + i.totalCents, 0))} tone="warning" />
        <Kpi label="Facturas emitidas" value={num(valid.length)} tone="accent" />
      </div>
      <Card pad={false}>
        <div className="adm-toolbar">
          <label className="adm-search adm-search--grow">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número, cliente o NIF…" />
          </label>
        </div>
        {q.isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty icon={<Receipt size={30} strokeWidth={1.25} />} title="Aún no hay facturas" />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th className="num">Base</th>
                  <th className="num">IVA</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.number}</strong>
                    </td>
                    <td>{fmtDate(i.issuedAt, false)}</td>
                    <td>{i.customerName}</td>
                    <td className="num">{eur(i.baseCents)}</td>
                    <td className="num">{eur(i.vatCents)}</td>
                    <td className="num">
                      <strong>{eur(i.totalCents)}</strong>
                    </td>
                    <td>
                      <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
                    </td>
                    <td className="adm-row-actions">
                      <button type="button" className="adm-icon-btn" title="Imprimir o guardar en PDF" aria-label="Imprimir" onClick={() => print(i)}>
                        <Printer size={15} />
                      </button>
                      {i.status === "issued" && (
                        <button
                          type="button"
                          className="adm-icon-btn"
                          title="Marcar como cobrada"
                          aria-label="Marcar como cobrada"
                          onClick={async () => {
                            await setStatus.mutateAsync({ id: i.id, status: "paid" });
                            await refresh();
                          }}
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      {i.status !== "void" && (
                        <button
                          type="button"
                          className="adm-icon-btn"
                          title="Anular"
                          aria-label="Anular"
                          onClick={async () => {
                            await setStatus.mutateAsync({ id: i.id, status: "void" });
                            await refresh();
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {draft && <InvoiceDrawer draft={draft} onClose={() => setDraft(null)} onSaved={refresh} />}
    </>
  );
}

function InvoiceDrawer({ draft: initial, onClose, onSaved }: { draft: InvoiceDraft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const create = trpc.business.createInvoice.useMutation();
  const orders = trpc.admin.listOrders.useQuery();
  const products = trpc.catalog.listPublic.useQuery();
  const [d, setD] = useState(initial);
  const set = <K extends keyof InvoiceDraft>(k: K, v: InvoiceDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const fromOrder = (orderId: string) => {
    const order = orders.data?.find((o) => o.id === orderId);
    if (!order) return set("orderId", undefined);
    setD((x) => ({
      ...x,
      orderId,
      customerName: order.customerName,
      address: order.deliveryAddress ?? x.address,
      lines: order.items.map((i) => ({
        description: i.name,
        qty: i.quantity,
        unitCents: i.quantity ? Math.round(i.subtotalCents / i.quantity) : 0,
        vatPct: vatForCategory(products.data?.find((p) => p.id === i.id)?.category),
      })),
    }));
  };

  const submit = async () => {
    if (documentTotals(d.lines).totalCents <= 0) return toast.error("La factura debe tener un importe.");
    try {
      await create.mutateAsync(d);
      toast.success("Factura emitida");
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
      width={760}
      title="Nueva factura"
      subtitle="Al emitirla recibe el siguiente número de la serie."
      footer={
        <>
          <div className="adm-spacer" />
          <Button variant="primary" loading={create.isPending} onClick={() => void submit()}>
            Emitir factura
          </Button>
        </>
      }
    >
      <div className="adm-form">
        <Field label="Crear desde un pedido (opcional)" span={2}>
          <Select value={d.orderId ?? ""} onChange={(e) => fromOrder(e.target.value)}>
            <option value="">Sin pedido</option>
            {(orders.data ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} · {o.customerName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cliente o razón social" span={2}>
          <Input value={d.customerName} onChange={(e) => set("customerName", e.target.value)} maxLength={160} />
        </Field>
        <Field label="NIF / CIF">
          <Input value={d.taxId} onChange={(e) => set("taxId", e.target.value)} maxLength={30} />
        </Field>
        <Field label="Email">
          <Input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} maxLength={160} />
        </Field>
        <Field label="Dirección fiscal" span={2}>
          <Input value={d.address} onChange={(e) => set("address", e.target.value)} maxLength={240} />
        </Field>
        <Field label="Forma de pago">
          <Select value={d.method} onChange={(e) => set("method", e.target.value)}>
            {["Tarjeta", "Efectivo", "Transferencia", "Bizum"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      <h3 className="adm-subtitle">Líneas</h3>
      <LineEditor lines={d.lines} onChange={(lines) => set("lines", lines)} />
      <Field label="Notas">
        <Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={800} rows={2} />
      </Field>
    </Drawer>
  );
}
