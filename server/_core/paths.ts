import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the canonical project root directory reliably in both development
 * (`tsx watch server/_core/index.ts`) and bundled production (`node dist/index.js`).
 */
export function resolveProjectRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(import.meta.dirname, ".."),
    path.resolve(import.meta.dirname, "../.."),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
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
