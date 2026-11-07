/**
 * SEO checks against a running site. Fails if any page in the sitemap is broken.
 *
 *   pnpm check:seo [url] [--rendered] [--all]
 *
 * Without flags it reads the raw HTML of every sitemap URL. --rendered also opens pages in Chrome and
 * compares them with the raw HTML (key pages and a sample of products; --all renders every page).
 */
const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith("http")) || "https://correderamadrid.com").replace(/\/+$/, "");
const rendered = args.includes("--rendered");
const renderAll = args.includes("--all");
const errors = [];
const fail = (url, msg) => errors.push(`${url.replace(base, "") || "/"}: ${msg}`);

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function parseRaw(url, html) {
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  const description = decode(html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? "");
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  const snapshot = html.match(/<div class="seo-snapshot"[^>]*>([\s\S]*?)<\/div><\/div>/)?.[1] ?? "";
  const h1s = [...snapshot.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1]));
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const ld = [];
  for (const b of blocks) {
    try {
      ld.push(JSON.parse(b));
    } catch {
      fail(url, "JSON-LD no se puede leer");
    }
  }
  if (!title) fail(url, "falta title");
  if (title.length > 75) fail(url, `title de ${title.length} caracteres`);
  if (!description) fail(url, "falta description");
  if (description.length > 175) fail(url, `description de ${description.length} caracteres`);
  if (canonical !== url) fail(url, `canonical distinto: ${canonical}`);
  if (h1s.length !== 1) fail(url, `${h1s.length} H1 en el HTML`);
  if (/TODO_CLIENTE/.test(html)) fail(url, "TODO_CLIENTE visible");
  return { title, description, canonical, h1: h1s[0] ?? "", ld };
}

async function mapLimit(list, limit, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < list.length) {
        const item = list[i++];
        await fn(item);
      }
    }),
  );
}

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (new Set(urls).size !== urls.length) errors.push("sitemap: URLs duplicadas");
if (/<lastmod>(?!\d{4}-\d{2}-\d{2}<)/.test(sitemap)) errors.push("sitemap: lastmod con formato incorrecto");
if (urls.length === 0) errors.push("sitemap: vacío");

const raw = new Map();
await mapLimit(urls, 8, async (url) => {
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== 200) return fail(url, `estado ${res.status}`);
  const robots = res.headers.get("x-robots-tag") ?? "";
  if (/noindex/.test(robots)) fail(url, `no indexable: ${robots}`);
  raw.set(url, parseRaw(url, await res.text()));
});

// Home page data must describe what the visitor sees.
const home = raw.get(`${base}/`);

if (rendered) {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const products = urls.filter((u) => u.includes("/producto/"));
  const keys = urls.filter((u) => !u.includes("/producto/"));
  const targets = renderAll ? urls : [...keys, ...products.filter((_, i) => i % 12 === 0)];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "es-ES" });
  await mapLimit(targets, 4, async (url) => {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "load", timeout: 45000 });
      await page.waitForFunction(() => !document.querySelector(".seo-snapshot"), null, { timeout: 15000 });
      await page.waitForTimeout(300);
      const dom = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.replace(/\s+/g, " ").trim()),
        noAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")),
        contentNoAlt: [...document.images]
          .filter((i) => i.getAttribute("alt") === "" && !i.closest('[aria-hidden="true"]') && i.getAttribute("aria-hidden") !== "true" && !/emblem/.test(i.src) && !i.closest(".cg-card__media, .cg-pdp__thumbs, .cg-cart__thumb, .cg-carta__thumb"))
          .map((i) => i.getAttribute("src")),
        faq: document.querySelectorAll(".cg-faq details").length,
        best: document.querySelectorAll('[aria-labelledby="mas-vendidos"] .cg-card').length,
      }));
      const r = raw.get(url);
      if (!r) return;
      if (dom.title !== r.title) fail(url, `title cambia al cargar: "${r.title}" -> "${dom.title}"`);
      if (dom.description !== r.description) fail(url, "description cambia al cargar");
      if (dom.canonical !== r.canonical) fail(url, `canonical cambia al cargar: ${dom.canonical}`);
      if (dom.h1.length !== 1) fail(url, `${dom.h1.length} H1 en la página cargada`);
      else if (dom.h1[0] !== r.h1) fail(url, `H1 cambia al cargar: "${r.h1}" -> "${dom.h1[0]}"`);
      if (dom.noAlt.length) fail(url, `imágenes sin atributo alt: ${dom.noAlt.slice(0, 3).join(", ")}`);
      if (dom.contentNoAlt.length) fail(url, `imágenes de contenido con alt vacío: ${dom.contentNoAlt.slice(0, 3).join(", ")}`);
      if (url === `${base}/` && home) {
        const faqLd = home.ld.find((j) => j["@type"] === "FAQPage");
        const listLd = home.ld.find((j) => j["@type"] === "ItemList");
        if (faqLd?.mainEntity?.length !== dom.faq) fail(url, `FAQPage tiene ${faqLd?.mainEntity?.length} preguntas y se ven ${dom.faq}`);
        if (listLd?.itemListElement?.length !== dom.best) fail(url, `ItemList tiene ${listLd?.itemListElement?.length} productos y se ven ${dom.best}`);
      }
    } catch (err) {
      fail(url, `no se pudo abrir: ${String(err.message).split("\n")[0]}`);
    } finally {
      await page.close();
    }
  });
  await browser.close();
  console.log(`Comparadas ${targets.length} páginas cargadas con su HTML`);
}

console.log(`Revisadas ${urls.length} URLs de ${base}`);
if (errors.length) {
  console.error(`\n${errors.length} problemas:`);
  for (const e of errors.slice(0, 60)) console.error(` - ${e}`);
  process.exit(1);
}
console.log("Sin problemas");
