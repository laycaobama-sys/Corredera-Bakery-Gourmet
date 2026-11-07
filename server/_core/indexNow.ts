import { SITE_URL } from "./seoRender";

/** Public key: IndexNow reads it back from /<key>.txt to confirm the site owner sent the URLs. */
export const INDEXNOW_KEY = "3079845a89be23d4cfc595b618e540bd";

/**
 * Tells Bing and the other IndexNow engines that pages changed. Only runs on the real domain in
 * production, and a failure never affects the owner's save in the panel.
 */
export function pingIndexNow(paths: string[]) {
  if (process.env.NODE_ENV !== "production" || !SITE_URL.endsWith("correderamadrid.com") || paths.length === 0) return;
  const host = new URL(SITE_URL).hostname;
  void fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => `${SITE_URL}${p}`) }),
  }).catch((err) => console.warn("[IndexNow] Could not notify:", err));
}
