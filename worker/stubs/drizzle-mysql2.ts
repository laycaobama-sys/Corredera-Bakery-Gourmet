// Cloudflare build: data lives in the Durable Object, so the optional MySQL driver is left out of the bundle.
export function drizzle(): never {
  throw new Error("MySQL is not available on Cloudflare Workers");
}
