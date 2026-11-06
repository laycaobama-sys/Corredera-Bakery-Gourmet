/**
 * Printable menus for the shop (A4 PDF, Spanish and English). They are not published on the website.
 *
 *   node scripts/build-cartas.mjs                 uses server/data/catalog-store.json
 *   node scripts/build-cartas.mjs --live https://your-domain   uses the prices published on the site
 *
 * Output: cartas/Carta-Gourmet-ES.pdf, -EN.pdf, Carta-Bakery-Cafe-ES.pdf, -EN.pdf
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const { values } = parseArgs({ options: { live: { type: "string" } } });
const asset = (p) => pathToFileURL(path.join(root, p)).href;

const settings = JSON.parse(fs.readFileSync(path.join(root, "server/data/site-settings.json"), "utf8"));
async function loadProducts() {
  if (values.live) {
    const res = await fetch(`${values.live.replace(/\/+$/, "")}/api/trpc/catalog.listPublic`);
    return (await res.json()).result.data.json;
  }
  return JSON.parse(fs.readFileSync(path.join(root, "server/data/catalog-store.json"), "utf8")).products.filter((p) => p.active);
}

const TAPAS = new Set(["g1", "g3", "g6", "g7"]);
const COPAS = new Set(["g8", "g9", "g20"]);

const GOURMET = [
  { es: "Jamones y paletas", en: "Whole hams & shoulders", noteEs: "Corte a cuchillo y envasado al vacío gratis en los jamones enteros.", noteEn: "Free hand-carving and vacuum packing on whole hams.", match: (p) => p.category === "jamones_enteros" },
  { es: "Jamón loncheado · Sobres de 100 g", en: "Sliced ham · 100 g packs", match: (p) => p.category === "sobres_jamon" },
  { es: "Embutidos ibéricos al corte", en: "Iberian charcuterie by weight", match: (p) => p.category === "embutidos" && !TAPAS.has(p.id) },
  { es: "Embutidos loncheados · Sobres de 100 g", en: "Sliced charcuterie · 100 g packs", match: (p) => p.category === "sobres_embutidos" },
  { es: "Quesos", en: "Cheeses", noteEs: "Pregúntenos el precio de los quesos sin importe indicado.", noteEn: "Please ask for the price of cheeses shown without one.", match: (p) => p.category === "quesos" },
  { es: "Aceites de oliva virgen extra", en: "Extra virgin olive oils", match: (p) => p.category === "aceites" },
  { es: "Gildas y conservas", en: "Gildas & preserves", match: (p) => p.category === "conservas" },
  { es: "Tablas para compartir", en: "Sharing boards", match: (p) => p.mode === "gourmet" && p.category === "tablas" },
  { es: "Raciones, tostas y bocadillos", en: "Portions, toasts & sandwiches", match: (p) => TAPAS.has(p.id) || (p.mode === "gourmet" && p.category === "raciones") },
  { es: "Copas y bebidas", en: "Wine & drinks", match: (p) => COPAS.has(p.id) },
];

const BAKERY = [
  { es: "Desayunos y ofertas", en: "Breakfast & offers", match: (p) => p.mode === "bakery" && p.category === "desayunos" },
  { es: "Cafetería y bebidas", en: "Coffee & drinks", match: (p) => p.mode === "bakery" && p.category === "cafeteria" },
  { es: "Panadería y bollería", en: "Bakery & pastries", match: (p) => p.mode === "bakery" && p.category === "bolleria" },
  { es: "Bocadillos y empanadas", en: "Sandwiches & pies", match: (p) => p.mode === "bakery" && p.category === "bocadillos" },
  { es: "Tartas", en: "Cakes", noteEs: "Tartas enteras por encargo con 24–48 horas de antelación.", noteEn: "Whole cakes to order with 24–48 hours' notice.", match: (p) => p.mode === "bakery" && p.category === "tartas" },
  { es: "Sweet & Salty Packs", en: "Sweet & Salty Packs", noteEs: "Bandejas para reuniones y oficinas.", noteEn: "Trays for meetings and offices.", match: (p) => p.category === "packs" },
];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function priceText(price, lang) {
  if (price === "Consultar") return lang === "en" ? "Ask staff" : "Consultar";
  const m = price.match(/^(\+?)(\d+)[,.](\d+)\s*€(?:\s*\/\s*(kg|unidad))?/);
  if (!m) return price;
  const [, plus, whole, dec, unit] = m;
  if (lang === "en") return `${plus}€${whole}.${dec}${unit === "kg" ? " / kg" : unit ? " each" : ""}`;
  return `${plus}${whole},${dec} €${unit === "kg" ? " / kg" : unit ? " / ud." : ""}`;
}

const nameOf = (p, lang) => (lang === "en" ? p.nameEn || p.name : p.name).replace(/^(Promoción|Promotion)\s+/i, "");
const descOf = (p, lang) => (lang === "en" ? p.descEn || p.desc : p.desc).replace(/^(Más vendido\.|Best seller\.)\s*/i, "");
const infoOf = (p, lang) => {
  const raw = lang === "en" ? p.weightInfoEn || "" : p.weightInfo || "";
  return raw.replace(/^(Peso aproximado|Approx\. weight)\s*:\s*/i, "");
};

function renderCarta({ title, subtitle, groups, lang, products, cover }) {
  const c = settings.contact;
  const s = settings.schedule;
  const es = lang === "es";
  const sections = groups
    .map((g) => {
      const items = products.filter(g.match);
      if (!items.length) return "";
      const row = (p) =>
        `<li><div class="row"><h3>${esc(nameOf(p, lang))}</h3><i></i><b>${esc(priceText(p.price, lang))}</b></div>${infoOf(p, lang) ? `<p class="fmt">${esc(infoOf(p, lang))}</p>` : ""}<p>${esc(descOf(p, lang))}</p></li>`;
      const note = es ? g.noteEs : g.noteEn;
      // The heading travels with the first product, so a section never starts at the bottom of a column.
      return `<section><div class="keep"><h2>${esc(es ? g.es : g.en)}</h2>${note ? `<p class="note">${esc(note)}</p>` : ""}<ul>${row(items[0])}</ul></div><ul>${items.slice(1).map(row).join("")}</ul></section>`;
    })
    .join("");
  const hours = title.includes("Bakery")
    ? [s[es ? "bakeryWeekdaysEs" : "bakeryWeekdaysEn"], s[es ? "bakeryWeekendEs" : "bakeryWeekendEn"], s[es ? "bakerySundayEs" : "bakerySundayEn"]]
    : [s[es ? "gourmetHoursEs" : "gourmetHoursEn"], s[es ? "gourmetClosedNoteEs" : "gourmetClosedNoteEn"]];

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@font-face{font-family:"EB Garamond";src:url("${asset("node_modules/@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-normal.woff2")}") format("woff2");font-weight:400 800}
@font-face{font-family:"EB Garamond";font-style:italic;src:url("${asset("node_modules/@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-italic.woff2")}") format("woff2");font-weight:400 800}
@font-face{font-family:"Jost";src:url("${asset("node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2")}") format("woff2");font-weight:100 900}
@page{size:A4;margin:9mm 0 9mm}
@page cover{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;font-family:"Jost",sans-serif;color:#241e19;background:#fff}
.cover{page:cover;position:relative;width:210mm;height:297mm;background:#2b0f11;color:#f5efe6;display:flex;flex-direction:column;align-items:center;text-align:center;page-break-after:always;overflow:hidden}
.cover .frame{position:absolute;inset:9mm;border:.3mm solid #b08a4a;pointer-events:none;z-index:2}
.cover .logo{margin-top:30mm;width:104mm;z-index:1}
.cover .eyebrow{margin:14mm 0 0;font-size:9.5pt;letter-spacing:.34em;text-transform:uppercase;color:#d9c29a}
.cover h1{margin:4mm 0 0;font:400 44pt/1.05 "EB Garamond",serif;color:#fff}
.cover .sub{margin:4mm 24mm 0;font:italic 14pt/1.35 "EB Garamond",serif;color:#e7dccb}
.cover .photo{position:absolute;left:0;right:0;bottom:0;height:118mm;background-size:cover;background-position:center}
.cover .photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#2b0f11 0%,rgba(43,15,17,.1) 34%,rgba(43,15,17,.25) 100%)}
.cover .addr{position:absolute;left:0;right:0;bottom:16mm;font-size:9.5pt;letter-spacing:.14em;text-transform:uppercase;color:#fff;z-index:1}
.body{padding:6mm 13mm 0;columns:2;column-gap:9mm;column-rule:.2mm solid #eadfce}
.head{display:flex;align-items:center;justify-content:space-between;margin:0 13mm;padding:0 0 3mm;border-bottom:.5mm solid #5e2023}
.head img{height:12mm}
.head span{font-size:8pt;letter-spacing:.24em;text-transform:uppercase;color:#9c7a43}
section{margin:0 0 5.5mm}
.keep{break-inside:avoid}
h2{margin:0 0 2mm;padding:0 0 1.2mm;font:500 16pt/1.15 "EB Garamond",serif;color:#5e2023;border-bottom:.25mm solid #b08a4a;break-after:avoid}
.note{margin:0 0 1.5mm;font:italic 9.5pt/1.3 "EB Garamond",serif;color:#655d54;break-after:avoid}
ul{list-style:none;margin:0;padding:0}
li{padding:1mm 0;break-inside:avoid}
.row{display:flex;align-items:baseline;gap:1.5mm}
h3{margin:0;font:500 10.5pt/1.2 "EB Garamond",serif;color:#241e19;font-size:11pt}
.row i{flex:1;min-width:5mm;border-bottom:.25mm dotted #b9a98f;transform:translateY(-.7mm)}
.row b{font-weight:500;font-size:9.5pt;color:#5e2023;white-space:nowrap}
li p{margin:.5mm 0 0;font-size:8pt;line-height:1.32;color:#655d54}
li .fmt{color:#9c7a43;font-size:7.6pt;letter-spacing:.02em}
.foot{break-inside:avoid;margin:2mm 0 0;padding:4mm 5mm;border:.25mm solid #b08a4a;font-size:8pt;line-height:1.5;color:#4b433b;text-align:center}
.foot strong{font:500 11pt "EB Garamond",serif;color:#5e2023;display:block;margin-bottom:1mm}
</style></head><body>
<div class="cover"><div class="frame"></div><img class="logo" src="${asset("client/public/assets/brand/corredera-lockup-light.png")}" alt="Corredera">
<p class="eyebrow">${esc(es ? "Carta" : "Menu")}</p><h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p>
<div class="photo" style="background-image:url('${asset(cover)}')"></div>
<p class="addr">Calle de la Puebla, 15 · 28004 Madrid</p></div>
<div class="head"><img src="${asset("client/public/assets/brand/corredera-lockup.png")}" alt="Corredera"><span>${esc(title)}</span></div>
<div class="body">${sections}<div class="foot"><strong>${esc(c.addressLine)}</strong>${esc(es ? "Tel." : "Phone")} ${esc(c.landlineDisplay)} · WhatsApp ${esc(c.whatsappDisplay)} · ${esc(hours.filter(Boolean).join(" · "))}<br>
${esc(es ? "Precios en euros con IVA incluido. Productos al peso: importe según peso exacto. Si tiene alguna alergia o intolerancia, consulte a nuestro personal: disponemos de información sobre alérgenos." : "Prices in euros, VAT included. Items sold by weight are charged by exact weight. If you have any allergy or intolerance, please ask our staff: allergen information is available.")}</div></div>
</body></html>`;
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("Chrome not found: set CHROME_PATH");
  return found;
}

const products = await loadProducts();
const outDir = path.join(root, "cartas");
fs.mkdirSync(outDir, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-cartas-"));

const cartas = [
  { file: "Carta-Gourmet-ES", lang: "es", title: "Corredera Gourmet", subtitle: "Jamones ibéricos, embutidos, quesos, aceites y barra gourmet", groups: GOURMET, cover: "client/public/assets/home/hero-jamon.jpg" },
  { file: "Carta-Gourmet-EN", lang: "en", title: "Corredera Gourmet", subtitle: "Iberian hams, charcuterie, cheeses, olive oils and gourmet bar", groups: GOURMET, cover: "client/public/assets/home/hero-jamon.jpg" },
  { file: "Carta-Bakery-Cafe-ES", lang: "es", title: "Bakery & Café", subtitle: "Desayunos, café, bollería de obrador, bocadillos y tartas artesanas", groups: BAKERY, cover: "client/public/assets/corredera-bakery-interior.jpg" },
  { file: "Carta-Bakery-Cafe-EN", lang: "en", title: "Bakery & Café", subtitle: "Breakfasts, coffee, fresh pastries, sandwiches and artisan cakes", groups: BAKERY, cover: "client/public/assets/corredera-bakery-interior.jpg" },
];

const chrome = chromePath();
for (const carta of cartas) {
  const htmlFile = path.join(work, `${carta.file}.html`);
  fs.writeFileSync(htmlFile, renderCarta({ ...carta, products }));
  const pdf = path.join(outDir, `${carta.file}.pdf`);
  execFileSync(chrome, ["--headless=new", "--disable-gpu", `--user-data-dir=${path.join(work, "profile")}`, "--no-pdf-header-footer", "--allow-file-access-from-files", `--print-to-pdf=${pdf}`, pathToFileURL(htmlFile).href], { stdio: "ignore", timeout: 120_000 });
  const included = carta.groups.reduce((n, g) => n + products.filter(g.match).length, 0);
  console.log(`${carta.file}.pdf · ${included} productos · ${Math.round(fs.statSync(pdf).size / 1024)} KB`);
}
fs.rmSync(work, { recursive: true, force: true });
