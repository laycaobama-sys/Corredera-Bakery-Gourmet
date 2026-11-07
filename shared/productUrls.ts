import { PRODUCT_SLUGS } from "./productSlugs";

const ID_BY_SLUG = new Map(Object.entries(PRODUCT_SLUGS).map(([id, slug]) => [slug, id]));

/** Public address of a product. Products created later in the panel keep their id until a slug is added. */
export function productPath(id: string) {
  return `/producto/${PRODUCT_SLUGS[id] ?? id}`;
}

/** The product behind a URL segment, whether it is the keyword slug or the old id. */
export function productIdFromParam(param: string) {
  return ID_BY_SLUG.get(param) ?? param;
}

/** Keyword address an old id URL must redirect to, or null if the URL is already correct. */
export function productRedirectPath(param: string) {
  const slug = PRODUCT_SLUGS[param];
  return slug ? `/producto/${slug}` : null;
}

/** Raise when bundled product photos are replaced, so browsers fetch the new files instead of cached ones. */
export const PRODUCT_PHOTO_VERSION = "5";

/** Versioned address of a product photo. */
export function versionedProductImage(url: string) {
  return url.startsWith("/assets/products/") ? `${url}?v=${PRODUCT_PHOTO_VERSION}` : url;
}

/** Smaller hero file for phones. */
export function heroSrcSet(url: string) {
  return /^\/assets\/home\/[a-z0-9-]+\.jpg$/.test(url) ? `${url.replace(/\.jpg$/, "-800.jpg")} 800w, ${url} 1376w` : undefined;
}
