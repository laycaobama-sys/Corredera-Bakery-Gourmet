import nodeFs from "node:fs";

/**
 * The few file operations the repositories need (catalog, settings, orders, analytics, owner lock, uploads).
 * On Node they go to disk. On Cloudflare the Durable Object swaps in a backend stored in its SQLite database,
 * so the same repository code runs in both places.
 */
export interface DataFsBackend {
  existsSync(filePath: string): boolean;
  readFileSync(filePath: string, options?: unknown): any;
  writeFileSync(filePath: string, data: string | Uint8Array, options?: unknown): void;
  renameSync(from: string, to: string): void;
  mkdirSync(dirPath: string, options?: unknown): unknown;
  readdirSync(dirPath: string): string[];
}

let backend: DataFsBackend = nodeFs as unknown as DataFsBackend;

export function setDataFsBackend(next: DataFsBackend) {
  backend = next;
}

const dataFs: DataFsBackend = {
  existsSync: (p) => backend.existsSync(p),
  readFileSync: (p, o) => backend.readFileSync(p, o),
  writeFileSync: (p, d, o) => backend.writeFileSync(p, d, o),
  renameSync: (a, b) => backend.renameSync(a, b),
  mkdirSync: (p, o) => backend.mkdirSync(p, o),
  readdirSync: (p) => backend.readdirSync(p),
};

export default dataFs;
