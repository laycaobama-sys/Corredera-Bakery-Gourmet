import type { DataFsBackend } from "../server/_core/dataFs";

// Durable Object SQLite rows are limited to 2 MB, so files are stored in 1 MB parts.
const PART_BYTES = 1024 * 1024;
const MAX_CACHED_BYTES = 2 * 1024 * 1024;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function enoent(filePath: string) {
  return Object.assign(new Error(`ENOENT: no such file, open '${filePath}'`), { code: "ENOENT" });
}

function wantsText(options: unknown) {
  return typeof options === "string" || (typeof options === "object" && options !== null && "encoding" in options);
}

/**
 * File storage inside the Durable Object's SQLite database. The object runs one request at a time,
 * so an in-memory copy of each file stays consistent with the database.
 * Writes to "*.tmp" are kept in memory until the repositories rename them (their atomic-write pattern).
 */
export function createSqlFs(sql: SqlStorage): DataFsBackend {
  sql.exec(
    "CREATE TABLE IF NOT EXISTS files (path TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (path, part))"
  );

  const cache = new Map<string, Uint8Array>();
  const pending = new Map<string, Uint8Array>();
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");

  function load(p: string): Uint8Array | null {
    const key = norm(p);
    const hit = pending.get(key) ?? cache.get(key);
    if (hit) return hit;
    const parts = sql.exec<{ data: ArrayBuffer }>("SELECT data FROM files WHERE path = ? ORDER BY part", key).toArray();
    if (parts.length === 0) return null;
    const total = parts.reduce((n, r) => n + r.data.byteLength, 0);
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const r of parts) {
      bytes.set(new Uint8Array(r.data), offset);
      offset += r.data.byteLength;
    }
    if (total <= MAX_CACHED_BYTES) cache.set(key, bytes);
    return bytes;
  }

  function persist(key: string, bytes: Uint8Array) {
    sql.exec("DELETE FROM files WHERE path = ?", key);
    for (let part = 0, offset = 0; offset < bytes.byteLength || part === 0; part++, offset += PART_BYTES) {
      sql.exec("INSERT INTO files (path, part, data) VALUES (?, ?, ?)", key, part, bytes.subarray(offset, offset + PART_BYTES));
    }
    if (bytes.byteLength <= MAX_CACHED_BYTES) cache.set(key, bytes);
    else cache.delete(key);
  }

  function childNames(dir: string): string[] {
    const prefix = `${norm(dir)}/`;
    const rows = sql
      .exec<{ path: string }>("SELECT DISTINCT path FROM files WHERE substr(path, 1, ?) = ?", prefix.length, prefix)
      .toArray();
    const names = new Set<string>();
    for (const { path } of rows) names.add(path.slice(prefix.length).split("/")[0]);
    return [...names];
  }

  return {
    existsSync(p) {
      const key = norm(p);
      if (pending.has(key) || cache.has(key)) return true;
      if (sql.exec("SELECT 1 FROM files WHERE path = ? LIMIT 1", key).toArray().length > 0) return true;
      return childNames(key).length > 0;
    },
    readFileSync(p, options) {
      const bytes = load(p);
      if (!bytes) throw enoent(p);
      return wantsText(options) ? decoder.decode(bytes) : Buffer.from(bytes);
    },
    writeFileSync(p, data) {
      const key = norm(p);
      const bytes = typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);
      if (key.endsWith(".tmp")) pending.set(key, bytes);
      else persist(key, bytes);
    },
    renameSync(from, to) {
      const src = norm(from);
      const bytes = load(src);
      if (!bytes) throw enoent(from);
      persist(norm(to), bytes);
      pending.delete(src);
      cache.delete(src);
      sql.exec("DELETE FROM files WHERE path = ?", src);
    },
    mkdirSync() {
      return undefined;
    },
    readdirSync(dir) {
      return childNames(dir);
    },
  };
}

/** Reads one stored file as bytes (uploaded photos and videos). */
export function readStoredBytes(fs: DataFsBackend, filePath: string): Uint8Array | null {
  try {
    return new Uint8Array(fs.readFileSync(filePath) as Buffer);
  } catch {
    return null;
  }
}
