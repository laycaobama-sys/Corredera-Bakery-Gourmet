/**
 * Sends every URL in the live sitemap to IndexNow (Bing, Yandex and other engines).
 *
 *   pnpm indexnow [https://correderamadrid.com]
 */
const base = (process.argv[2] || "https://correderamadrid.com").replace(/\/+$/, "");
const key = "3079845a89be23d4cfc595b618e540bd";

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) throw new Error("El sitemap no tiene URLs");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(base).hostname, key, keyLocation: `${base}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs, respuesta ${res.status}`);
if (!res.ok && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
