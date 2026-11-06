import { trpc } from "@/lib/trpc";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { categories } from "../../../shared/catalog";
import { Button, eur, Input, Select } from "./ui";

/** Refresh rate of every "live" figure in the back office. */
export const LIVE = { refetchInterval: 15_000, refetchOnWindowFocus: true } as const;

export const centsFromText = (text: string) => {
  const n = Number(text.replace(/\s|€/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
};
export const textFromCents = (cents: number) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");
export const numberFromText = (text: string) => {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
export const today = () => new Date().toISOString().slice(0, 10);

/** Amount in euros typed by the owner; reports cents when the field is left. */
export function MoneyInput({ cents, onCommit, ...rest }: { cents: number; onCommit: (cents: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur">) {
  const [value, setValue] = useState(textFromCents(cents));
  useEffect(() => setValue(textFromCents(cents)), [cents]);
  return (
    <Input
      {...rest}
      inputMode="decimal"
      value={value}
      placeholder={rest.placeholder ?? "0,00"}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const next = centsFromText(value);
        if (next !== cents) onCommit(next);
      }}
    />
  );
}

export const categoryName = (mode: "bakery" | "gourmet", id: string) => categories[mode].find((c) => c.id === id)?.es ?? id;

export type DocLine = { description: string; qty: number; unitCents: number; vatPct: number };

/** VAT usually applied in Spain: wine and alcohol 21 %, food 10 %. The owner can change each line. */
export const vatForCategory = (category?: string) => (category === "vinos" ? 21 : 10);

export function documentTotals(lines: DocLine[]) {
  let total = 0;
  let base = 0;
  for (const l of lines) {
    const gross = Math.round(l.qty * l.unitCents);
    total += gross;
    base += Math.round(gross / (1 + l.vatPct / 100));
  }
  return { baseCents: base, vatCents: total - base, totalCents: total };
}

/** Editable lines of a quote or invoice; typing a product name fills its price. */
export function LineEditor({ lines, onChange }: { lines: DocLine[]; onChange: (lines: DocLine[]) => void }) {
  const products = trpc.catalog.listPublic.useQuery();
  const set = (i: number, patch: Partial<DocLine>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totals = documentTotals(lines);
  return (
    <div className="adm-lines">
      <datalist id="adm-products">
        {(products.data ?? []).map((p) => (
          <option key={p.id} value={p.name}>
            {p.price}
          </option>
        ))}
      </datalist>
      <div className="adm-lines__head">
        <span>Concepto</span>
        <span>Cant.</span>
        <span>Precio (IVA incl.)</span>
        <span>IVA</span>
        <span />
      </div>
      {lines.map((line, i) => (
        <div className="adm-lines__row" key={i}>
          <Input
            list="adm-products"
            value={line.description}
            maxLength={240}
            placeholder="Producto o concepto"
            onChange={(e) => {
              const match = (products.data ?? []).find((p) => p.name === e.target.value);
              const price = match ? match.price.match(/(\d+)[,.](\d+)/) : null;
              set(i, {
                description: e.target.value,
                ...(price ? { unitCents: Number(price[1]) * 100 + Number(price[2].padEnd(2, "0").slice(0, 2)), vatPct: vatForCategory(match?.category) } : {}),
              });
            }}
          />
          <Input inputMode="decimal" value={String(line.qty).replace(".", ",")} onChange={(e) => set(i, { qty: numberFromText(e.target.value) })} aria-label="Cantidad" />
          <MoneyInput cents={line.unitCents} onCommit={(unitCents) => set(i, { unitCents })} aria-label="Precio" />
          <Select value={line.vatPct} onChange={(e) => set(i, { vatPct: Number(e.target.value) })} aria-label="IVA">
            {[0, 4, 5, 10, 21].map((v) => (
              <option key={v} value={v}>
                {v} %
              </option>
            ))}
          </Select>
          <button type="button" className="adm-icon-btn" aria-label="Quitar línea" onClick={() => onChange(lines.filter((_, j) => j !== i))}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <div className="adm-lines__foot">
        <Button size="sm" icon={<Plus size={14} />} onClick={() => onChange([...lines, { description: "", qty: 1, unitCents: 0, vatPct: 10 }])}>
          Añadir línea
        </Button>
        <dl>
          <div>
            <dt>Base imponible</dt>
            <dd>{eur(totals.baseCents)}</dd>
          </div>
          <div>
            <dt>IVA</dt>
            <dd>{eur(totals.vatCents)}</dd>
          </div>
          <div className="is-total">
            <dt>Total</dt>
            <dd>{eur(totals.totalCents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type PrintableDoc = {
  title: string;
  number: string;
  date: string;
  extra?: string;
  company: { name: string; trade: string; nif: string; address: string; email: string; phone: string };
  customer: { name: string; taxId?: string; address?: string; email?: string; phone?: string };
  lines: DocLine[];
  notes?: string;
};

/** Prints a quote or invoice with the shop's letterhead from a hidden frame, so pop-up blockers never stop it. */
export function printDocument(doc: PrintableDoc) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) return;
  const totals = documentTotals(doc.lines);
  const vatRows = [...new Set(doc.lines.map((l) => l.vatPct))]
    .sort((a, b) => a - b)
    .map((pct) => {
      const t = documentTotals(doc.lines.filter((l) => l.vatPct === pct));
      return `<tr><td>Base ${pct} %</td><td class="r">${eur(t.baseCents)}</td><td>IVA ${pct} %</td><td class="r">${eur(t.vatCents)}</td></tr>`;
    })
    .join("");
  const rows = doc.lines
    .map((l) => `<tr><td>${esc(l.description)}</td><td class="r">${String(l.qty).replace(".", ",")}</td><td class="r">${eur(l.unitCents)}</td><td class="r">${l.vatPct} %</td><td class="r">${eur(Math.round(l.qty * l.unitCents))}</td></tr>`)
    .join("");
  const c = doc.customer;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(doc.title)} ${esc(doc.number)}</title><style>
body{font:13px/1.45 system-ui,sans-serif;color:#1f1a17;margin:36px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #5e2023;padding-bottom:14px}
img{height:52px}h1{font:500 26px Georgia,serif;color:#5e2023;margin:0;text-align:right}.n{text-align:right;color:#655d54;margin:2px 0 0}
.who{display:flex;gap:32px;margin:20px 0}.who>div{flex:1}.who b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#655d54;margin-bottom:4px}p{margin:1px 0}
table{width:100%;border-collapse:collapse}.l th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:left;border-bottom:1px solid #5e2023;padding:6px 4px}.l td{border-bottom:1px solid #e8e2d9;padding:7px 4px;vertical-align:top}.r{text-align:right;white-space:nowrap}.l th.r{text-align:right}
.s{width:60%;margin:14px 0 0 auto}.s td{padding:3px 4px;color:#655d54}.t{display:flex;justify-content:flex-end;gap:28px;font:500 20px Georgia,serif;color:#5e2023;margin-top:10px}.b{border:1px solid #d9d0c4;padding:10px 12px;margin-top:18px}
</style></head><body><header><img src="${window.location.origin}/assets/brand/corredera-logo.png" alt="Corredera"><div><h1>${esc(doc.title)}</h1><p class="n">${esc(doc.number)} · ${esc(doc.date)}${doc.extra ? ` · ${esc(doc.extra)}` : ""}</p></div></header>
<div class="who"><div><b>Emisor</b><p>${esc(doc.company.name)}</p><p>${esc(doc.company.trade)}</p>${doc.company.nif ? `<p>NIF ${esc(doc.company.nif)}</p>` : ""}<p>${esc(doc.company.address)}</p><p>${esc(doc.company.phone)} · ${esc(doc.company.email)}</p></div>
<div><b>Cliente</b><p>${esc(c.name)}</p>${c.taxId ? `<p>NIF ${esc(c.taxId)}</p>` : ""}${c.address ? `<p>${esc(c.address)}</p>` : ""}${c.phone ? `<p>${esc(c.phone)}</p>` : ""}${c.email ? `<p>${esc(c.email)}</p>` : ""}</div></div>
<table class="l"><thead><tr><th>Concepto</th><th class="r">Cant.</th><th class="r">Precio</th><th class="r">IVA</th><th class="r">Importe</th></tr></thead><tbody>${rows}</tbody></table>
<table class="s">${vatRows}</table><div class="t"><span>Total</span><span>${eur(totals.totalCents)}</span></div>
${doc.notes ? `<div class="b">${esc(doc.notes)}</div>` : ""}</body></html>`);
  win.document.close();
  window.setTimeout(() => {
    win.focus();
    win.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 400);
}

/** Letterhead data for documents; a tax ID still pending in the panel is left out. */
export function companyFrom(settings: { legal: { companyName: string; tradeName: string; nif: string; registeredAddress: string; privacyEmail: string }; contact: { landlineDisplay: string } }) {
  return {
    name: settings.legal.companyName,
    trade: settings.legal.tradeName,
    nif: settings.legal.nif.includes("PENDIENTE") ? "" : settings.legal.nif,
    address: settings.legal.registeredAddress,
    email: settings.legal.privacyEmail,
    phone: settings.contact.landlineDisplay,
  };
}
