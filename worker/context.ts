import { serialize, type SerializeOptions } from "cookie";
import { authenticateAdminFromRequest } from "../server/adminAuth";
import type { TrpcContext } from "../server/_core/context";

type CookieOpts = { httpOnly?: boolean; path?: string; sameSite?: "none" | "lax" | "strict" | boolean; secure?: boolean; maxAge?: number };

function toSerializeOptions(opts: CookieOpts = {}): SerializeOptions {
  return {
    httpOnly: opts.httpOnly,
    path: opts.path ?? "/",
    sameSite: opts.sameSite,
    secure: opts.secure,
    // Express takes maxAge in milliseconds, the Set-Cookie header in seconds.
    ...(opts.maxAge !== undefined ? { maxAge: Math.max(0, Math.floor(opts.maxAge / 1000)) } : {}),
  };
}

/**
 * The routers were written for Express; on Cloudflare they get the small part of req/res they use:
 * headers, the client IP and cookies.
 */
export async function createWorkerContext(request: Request, resHeaders: Headers): Promise<TrpcContext> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const req = {
    headers,
    ip: request.headers.get("cf-connecting-ip") ?? "local",
    protocol: "https",
    hostname: new URL(request.url).hostname,
    get: (name: string) => request.headers.get(name) ?? undefined,
  };
  const res = {
    cookie(name: string, value: string, opts?: CookieOpts) {
      resHeaders.append("Set-Cookie", serialize(name, value, toSerializeOptions(opts)));
    },
    clearCookie(name: string, opts?: CookieOpts) {
      resHeaders.append("Set-Cookie", serialize(name, "", { ...toSerializeOptions(opts), maxAge: 0, expires: new Date(0) }));
    },
    setHeader(name: string, value: string) {
      resHeaders.set(name, value);
    },
  };

  let user: TrpcContext["user"] = null;
  try {
    user = await authenticateAdminFromRequest(req as never);
  } catch {
    user = null;
  }
  return { req: req as never, res: res as never, user };
}
