import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the canonical project root directory reliably in both development
 * (`tsx watch server/_core/index.ts`) and bundled production (`node dist/index.js`).
 * On Cloudflare there is no project folder: the paths below are only storage keys.
 */
export function resolveProjectRoot(): string {
  const here = import.meta.dirname;
  const candidates = [
    process.cwd(),
    ...(here ? [path.resolve(here, ".."), path.resolve(here, "../..")] : []),
  ];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // no file system (Cloudflare Workers)
    }
  }

  return process.cwd();
}

export const PROJECT_ROOT = resolveProjectRoot();

export const SERVER_DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(PROJECT_ROOT, "server", "data");

export const CLIENT_PUBLIC_DIR = path.join(PROJECT_ROOT, "client", "public");

export const DIST_PUBLIC_DIR = path.join(PROJECT_ROOT, "dist", "public");

export const PUBLIC_UPLOADS_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(CLIENT_PUBLIC_DIR, "assets", "uploads");
