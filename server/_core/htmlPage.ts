import { listCatalogProducts } from "../catalogRepository";
import { getSiteSettings } from "../siteSettingsRepository";
import { resolveHtmlRouteSeoStatus } from "./seoMiddleware";
import { buildSeoPage, injectSeo } from "./seoRender";

export type RenderedHtmlPage = { status: number; robots: string; html: string };

const PRIVATE_ROBOTS = "noindex, nofollow, noarchive";

/**
 * Builds the HTML for any storefront URL (shared by the Node server and the Cloudflare Worker):
 * per-page SEO plus the live catalog and CMS settings embedded as JSON, so the first paint
 * already shows the owner's content without waiting for an API round trip.
 */
export async function renderHtmlPage(template: string, rawUrl: string): Promise<RenderedHtmlPage> {
  const seoStatus = resolveHtmlRouteSeoStatus(rawUrl);
  if (seoStatus.robotsHeader === PRIVATE_ROBOTS) {
    return { status: seoStatus.statusCode, robots: seoStatus.robotsHeader, html: template };
  }

  let status: number = seoStatus.statusCode;
  let robots = seoStatus.robotsHeader;
  let html = template;
  try {
    const catalog = await listCatalogProducts({ includeInactive: false });
    const settings = getSiteSettings();

    // Products created from the admin panel are real pages too, not 404s.
    const productId = rawUrl.split(/[?#]/)[0].match(/^\/producto\/([A-Za-z0-9_-]+)\/?$/)?.[1];
    if (productId) {
      const exists = catalog.some((p) => p.id === decodeURIComponent(productId));
      status = exists ? 200 : 404;
      robots = exists ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" : "noindex, nofollow";
    }

    html = injectSeo(html, await buildSeoPage(rawUrl));
    const boot = JSON.stringify({ at: Date.now(), catalog, settings }).replace(/</g, "\\u003c");
    html = html.replace('<div id="root">', `<script id="cbg-boot" type="application/json">${boot}</script>\n    <div id="root">`);
  } catch (err) {
    console.warn("[HTML] Could not render page data:", err);
  }
  return { status, robots, html };
}
