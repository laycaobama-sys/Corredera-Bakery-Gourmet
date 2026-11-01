import { asc, desc, eq } from "drizzle-orm";
import fs from "./_core/dataFs";
import path from "path";
import {
  adminAuditLogs,
  catalogProducts,
  type InsertCatalogProductRow,
} from "../drizzle/schema";
import {
  menuItems,
  productRealPhotoFor,
  type Category,
  type MenuItem,
} from "../shared/catalog";
import { type ManagedCatalogProduct } from "../shared/catalogAdminSchema";
import { SERVER_DATA_DIR } from "./_core/paths";
import { getDb } from "./db";

export interface CatalogStoreState {
  version: number;
  updatedAt: string;
  products: ManagedCatalogProduct[];
}

export interface AuditLogEntry {
  id: number;
  actorOpenId: string;
  action: string;
  targetProductId: string | null;
  detailsJson: string | null;
  createdAt: string;
}

const DEFAULT_DATA_DIR = SERVER_DATA_DIR;
const DEFAULT_STORE_FILE = path.join(DEFAULT_DATA_DIR, "catalog-store.json");
const DEFAULT_AUDIT_FILE = path.join(DEFAULT_DATA_DIR, "admin-audit-log.json");
const DEFAULT_BACKUP_DIR = path.join(DEFAULT_DATA_DIR, "backups");

let activeStoreFilePath = DEFAULT_STORE_FILE;
let activeAuditFilePath = DEFAULT_AUDIT_FILE;
let activeBackupDirPath = DEFAULT_BACKUP_DIR;

/**
 * Allows automated tests to run against a temporary file path so production/canonical data is never altered during testing.
 */
export function setCatalogStoragePathsForTests(opts?: {
  storeFile?: string;
  auditFile?: string;
  backupDir?: string;
}) {
  activeStoreFilePath = opts?.storeFile ?? DEFAULT_STORE_FILE;
  activeAuditFilePath = opts?.auditFile ?? DEFAULT_AUDIT_FILE;
  activeBackupDirPath = opts?.backupDir ?? DEFAULT_BACKUP_DIR;
}

export function buildCanonicalManagedCatalog(): ManagedCatalogProduct[] {
  return menuItems.map((item, idx) => ({
    ...item,
    badge: item.badge ?? "",
    badgeEn: item.badgeEn ?? "",
    imageUrl: productRealPhotoFor(item),
    active: true,
    sortOrder: idx + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system-seed",
  }));
}

function ensureDirectories() {
  fs.mkdirSync(path.dirname(activeStoreFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(activeAuditFilePath), { recursive: true });
  fs.mkdirSync(activeBackupDirPath, { recursive: true });
}

function readDiskStore(): CatalogStoreState {
  ensureDirectories();
  if (!fs.existsSync(activeStoreFilePath)) {
    const initial: CatalogStoreState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      products: buildCanonicalManagedCatalog(),
    };
    writeDiskStoreAtomic(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(activeStoreFilePath, "utf-8");
    const parsed = JSON.parse(raw) as CatalogStoreState;
    if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
      throw new Error("Invalid or empty store file");
    }
    return parsed;
  } catch {
    const initial: CatalogStoreState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      products: buildCanonicalManagedCatalog(),
    };
    writeDiskStoreAtomic(initial);
    return initial;
  }
}

function writeDiskStoreAtomic(state: CatalogStoreState): void {
  ensureDirectories();
  const tempPath = `${activeStoreFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tempPath, activeStoreFilePath);
}

function appendDiskAuditLog(
  actorOpenId: string,
  action: string,
  targetProductId: string | null,
  details: unknown
): void {
  ensureDirectories();
  let logs: AuditLogEntry[] = [];
  if (fs.existsSync(activeAuditFilePath)) {
    try {
      logs = JSON.parse(fs.readFileSync(activeAuditFilePath, "utf-8"));
    } catch {
      logs = [];
    }
  }
  const nextEntry: AuditLogEntry = {
    id: logs.length + 1,
    actorOpenId,
    action,
    targetProductId,
    detailsJson: details ? JSON.stringify(details) : null,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(nextEntry);
  const trimmed = logs.slice(0, 500);
  const tempPath = `${activeAuditFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(trimmed, null, 2), "utf-8");
  fs.renameSync(tempPath, activeAuditFilePath);
}

function rowToManagedProduct(row: typeof catalogProducts.$inferSelect): ManagedCatalogProduct {
  return {
    id: row.id,
    mode: row.mode,
    category: row.category as Exclude<Category, "todos">,
    name: row.name,
    nameEn: row.nameEn,
    desc: row.desc,
    descEn: row.descEn,
    price: row.price,
    badge: row.badge || undefined,
    badgeEn: row.badgeEn || undefined,
    icon: row.icon,
    imageUrl: row.imageUrl,
    active: row.active === 1,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    updatedBy: row.updatedBy,
  };
}

async function ensureDbSeeded() {
  const db = await getDb();
  if (!db) return null;
  try {
    const existing = await db.select().from(catalogProducts).limit(1);
    if (existing.length === 0) {
      const seedItems = buildCanonicalManagedCatalog();
      const rows: InsertCatalogProductRow[] = seedItems.map((item) => ({
        id: item.id,
        mode: item.mode,
        category: item.category,
        name: item.name,
        nameEn: item.nameEn,
        desc: item.desc,
        descEn: item.descEn,
        price: item.price,
        badge: item.badge || null,
        badgeEn: item.badgeEn || null,
        icon: item.icon,
        imageUrl: item.imageUrl,
        active: item.active ? 1 : 0,
        sortOrder: item.sortOrder,
        updatedBy: "system-seed",
      }));
      await db.insert(catalogProducts).values(rows);
    }
    return db;
  } catch (err) {
    console.warn("[CatalogRepository] MySQL table not ready, falling back to server disk store:", err);
    return null;
  }
}

export async function recordAuditAction(
  actorOpenId: string,
  action: string,
  targetProductId: string | null,
  details?: unknown
) {
  const db = await ensureDbSeeded();
  if (db) {
    try {
      await db.insert(adminAuditLogs).values({
        actorOpenId,
        action,
        targetProductId,
        detailsJson: details ? JSON.stringify(details) : null,
      });
      return;
    } catch {
      // Fall through to disk log
    }
  }
  appendDiskAuditLog(actorOpenId, action, targetProductId, details);
}

export async function getCatalogStorageDiagnostics() {
  const db = await ensureDbSeeded();
  const state = readDiskStore();
  const backups = fs.existsSync(activeBackupDirPath)
    ? fs.readdirSync(activeBackupDirPath).filter((f) => f.endsWith(".json"))
    : [];

  return {
    engine: db ? ("mysql_drizzle" as const) : ("server_disk_json" as const),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    mysqlActive: Boolean(db),
    diskStorePath: "server/data/catalog-store.json",
    totalProductsCount: state.products.length,
    activeProductsCount: state.products.filter((p) => p.active).length,
    inactiveProductsCount: state.products.filter((p) => !p.active).length,
    lastUpdatedAt: state.updatedAt,
    availableBackupsCount: backups.length,
    backups: backups.sort().reverse().slice(0, 15),
  };
}

export async function listCatalogProducts(opts?: {
  includeInactive?: boolean;
}): Promise<ManagedCatalogProduct[]> {
  const includeInactive = opts?.includeInactive ?? false;
  const db = await ensureDbSeeded();

  if (db) {
    const rows = await db
      .select()
      .from(catalogProducts)
      .orderBy(asc(catalogProducts.sortOrder), asc(catalogProducts.id));
    const mapped = rows.map(rowToManagedProduct);
    return includeInactive ? mapped : mapped.filter((p) => p.active);
  }

  const state = readDiskStore();
  const sorted = [...state.products].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  );
  return includeInactive ? sorted : sorted.filter((p) => p.active);
}

export async function getCatalogProductById(
  id: string
): Promise<ManagedCatalogProduct | null> {
  const db = await ensureDbSeeded();
  if (db) {
    const rows = await db
      .select()
      .from(catalogProducts)
      .where(eq(catalogProducts.id, id))
      .limit(1);
    return rows[0] ? rowToManagedProduct(rows[0]) : null;
  }

  const state = readDiskStore();
  return state.products.find((p) => p.id === id) ?? null;
}

export async function createCatalogProduct(
  input: Omit<ManagedCatalogProduct, "sortOrder" | "updatedAt" | "updatedBy">,
  actorOpenId: string
): Promise<ManagedCatalogProduct> {
  const existing = await getCatalogProductById(input.id);
  if (existing) {
    throw new Error(`Ya existe un producto con el ID '${input.id}'`);
  }

  const state = readDiskStore();
  const maxOrder = state.products.reduce((max, p) => Math.max(max, p.sortOrder), 0);
  const nowIso = new Date().toISOString();

  const created: ManagedCatalogProduct = {
    ...input,
    badge: input.badge?.trim() || undefined,
    badgeEn: input.badgeEn?.trim() || undefined,
    sortOrder: maxOrder + 1,
    updatedAt: nowIso,
    updatedBy: actorOpenId,
  };

  const db = await ensureDbSeeded();
  if (db) {
    await db.insert(catalogProducts).values({
      id: created.id,
      mode: created.mode,
      category: created.category,
      name: created.name,
      nameEn: created.nameEn,
      desc: created.desc,
      descEn: created.descEn,
      price: created.price,
      badge: created.badge || null,
      badgeEn: created.badgeEn || null,
      icon: created.icon,
      imageUrl: created.imageUrl,
      active: created.active ? 1 : 0,
      sortOrder: created.sortOrder,
      updatedBy: actorOpenId,
    });
  }

  // Always keep disk store synchronized as durable replica
  state.products.push(created);
  state.updatedAt = nowIso;
  state.version += 1;
  writeDiskStoreAtomic(state);

  await recordAuditAction(actorOpenId, "CREATE_PRODUCT", created.id, {
    name: created.name,
    mode: created.mode,
    category: created.category,
    price: created.price,
  });

  return created;
}

export async function updateCatalogProduct(
  input: Omit<ManagedCatalogProduct, "sortOrder" | "updatedAt" | "updatedBy">,
  actorOpenId: string
): Promise<ManagedCatalogProduct> {
  const state = readDiskStore();
  const idx = state.products.findIndex((p) => p.id === input.id);

  const db = await ensureDbSeeded();
  if (idx === -1 && !db) {
    throw new Error(`No existe ningún producto con el ID '${input.id}'`);
  }

  const currentOrder = idx >= 0 ? state.products[idx].sortOrder : state.products.length + 1;
  const prev = idx >= 0 ? state.products[idx] : undefined;
  const nowIso = new Date().toISOString();

  const updated: ManagedCatalogProduct = {
    ...prev,
    ...input,
    badge: input.badge?.trim() || undefined,
    badgeEn: input.badgeEn?.trim() || undefined,
    unitInfo: input.unitInfo !== undefined ? input.unitInfo : prev?.unitInfo,
    unitInfoEn: input.unitInfoEn !== undefined ? input.unitInfoEn : prev?.unitInfoEn,
    weightInfo: input.weightInfo !== undefined ? input.weightInfo : prev?.weightInfo,
    weightInfoEn: input.weightInfoEn !== undefined ? input.weightInfoEn : prev?.weightInfoEn,
    refPricePerKg: input.refPricePerKg !== undefined ? input.refPricePerKg : prev?.refPricePerKg,
    subGroup: input.subGroup !== undefined ? input.subGroup : prev?.subGroup,
    freeCuttingService:
      input.freeCuttingService !== undefined ? input.freeCuttingService : prev?.freeCuttingService,
    featured: input.featured !== undefined ? input.featured : prev?.featured,
    sortOrder: currentOrder,
    updatedAt: nowIso,
    updatedBy: actorOpenId,
  };

  if (db) {
    const existingDb = await getCatalogProductById(input.id);
    if (!existingDb) {
      throw new Error(`No existe ningún producto con el ID '${input.id}'`);
    }
    await db
      .update(catalogProducts)
      .set({
        mode: updated.mode,
        category: updated.category,
        name: updated.name,
        nameEn: updated.nameEn,
        desc: updated.desc,
        descEn: updated.descEn,
        price: updated.price,
        badge: updated.badge || null,
        badgeEn: updated.badgeEn || null,
        icon: updated.icon,
        imageUrl: updated.imageUrl,
        active: updated.active ? 1 : 0,
        updatedBy: actorOpenId,
      })
      .where(eq(catalogProducts.id, updated.id));
  }

  if (idx >= 0) {
    state.products[idx] = updated;
  } else {
    state.products.push(updated);
  }
  state.updatedAt = nowIso;
  state.version += 1;
  writeDiskStoreAtomic(state);

  await recordAuditAction(actorOpenId, "UPDATE_PRODUCT", updated.id, {
    name: updated.name,
    price: updated.price,
    active: updated.active,
  });

  return updated;
}

export async function toggleCatalogProductActive(
  id: string,
  active: boolean,
  actorOpenId: string
): Promise<ManagedCatalogProduct> {
  const existing = await getCatalogProductById(id);
  if (!existing) {
    throw new Error(`No existe ningún producto con el ID '${id}'`);
  }
  return updateCatalogProduct(
    {
      ...existing,
      active,
    },
    actorOpenId
  );
}

export async function deleteCatalogProduct(
  id: string,
  actorOpenId: string
): Promise<{ deletedId: string; remainingCount: number }> {
  const existing = await getCatalogProductById(id);
  if (!existing) {
    throw new Error(`No existe ningún producto con el ID '${id}'`);
  }

  // Automatic safety backup before deleting any product
  await createCatalogBackupSnapshot(actorOpenId, `pre-del-${id}`);

  const db = await ensureDbSeeded();
  if (db) {
    await db.delete(catalogProducts).where(eq(catalogProducts.id, id));
  }

  const state = readDiskStore();
  state.products = state.products.filter((p) => p.id !== id);
  state.updatedAt = new Date().toISOString();
  state.version += 1;
  writeDiskStoreAtomic(state);

  await recordAuditAction(actorOpenId, "DELETE_PRODUCT", id, {
    deletedName: existing.name,
  });

  return {
    deletedId: id,
    remainingCount: state.products.length,
  };
}

export async function createCatalogBackupSnapshot(
  actorOpenId: string,
  label = "manual"
): Promise<{ fileName: string; productsCount: number; createdAt: string }> {
  ensureDirectories();
  const products = await listCatalogProducts({ includeInactive: true });
  const createdAt = new Date().toISOString();
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "backup";
  const stamp = createdAt.replace(/[:.]/g, "-");
  const fileName = `catalog-backup-${stamp}-${safeLabel}.json`;
  const fullPath = path.join(activeBackupDirPath, fileName);

  const snapshot: CatalogStoreState = {
    version: 1,
    updatedAt: createdAt,
    products,
  };

  fs.writeFileSync(fullPath, JSON.stringify(snapshot, null, 2), "utf-8");

  await recordAuditAction(actorOpenId, "CREATE_BACKUP", null, {
    fileName,
    productsCount: products.length,
  });

  return {
    fileName,
    productsCount: products.length,
    createdAt,
  };
}

export async function restoreCatalogFromBackupFile(
  fileName: string,
  actorOpenId: string
): Promise<{ restoredCount: number; fileName: string }> {
  ensureDirectories();
  const cleanName = path.basename(fileName);
  if (!cleanName.endsWith(".json") || cleanName.includes("..")) {
    throw new Error("Nombre de archivo de copia de seguridad no válido.");
  }
  const fullPath = path.join(activeBackupDirPath, cleanName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`No existe el archivo de copia '${cleanName}'.`);
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(raw) as CatalogStoreState;
  if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
    throw new Error("El archivo de copia de seguridad está vacío o corrupto.");
  }

  // Save current state before restoring
  await createCatalogBackupSnapshot(actorOpenId, "pre-restore-auto");

  const nowIso = new Date().toISOString();
  const db = await ensureDbSeeded();
  if (db) {
    for (const item of parsed.products) {
      const existing = await getCatalogProductById(item.id);
      if (existing) {
        await db
          .update(catalogProducts)
          .set({
            mode: item.mode,
            category: item.category,
            name: item.name,
            nameEn: item.nameEn,
            desc: item.desc,
            descEn: item.descEn,
            price: item.price,
            badge: item.badge || null,
            badgeEn: item.badgeEn || null,
            icon: item.icon,
            imageUrl: item.imageUrl,
            active: item.active ? 1 : 0,
            sortOrder: item.sortOrder,
            updatedBy: actorOpenId,
          })
          .where(eq(catalogProducts.id, item.id));
      } else {
        await db.insert(catalogProducts).values({
          id: item.id,
          mode: item.mode,
          category: item.category,
          name: item.name,
          nameEn: item.nameEn,
          desc: item.desc,
          descEn: item.descEn,
          price: item.price,
          badge: item.badge || null,
          badgeEn: item.badgeEn || null,
          icon: item.icon,
          imageUrl: item.imageUrl,
          active: item.active ? 1 : 0,
          sortOrder: item.sortOrder,
          updatedBy: actorOpenId,
        });
      }
    }
  }

  const currentState = readDiskStore();
  writeDiskStoreAtomic({
    version: currentState.version + 1,
    updatedAt: nowIso,
    products: parsed.products,
  });

  await recordAuditAction(actorOpenId, "RESTORE_BACKUP_SNAPSHOT", null, {
    fileName: cleanName,
    restoredCount: parsed.products.length,
  });

  return {
    restoredCount: parsed.products.length,
    fileName: cleanName,
  };
}

export async function restoreCatalogToCanonicalDefault(
  actorOpenId: string
): Promise<{ restoredCount: number }> {
  // Always create a safety backup before restoring defaults
  await createCatalogBackupSnapshot(actorOpenId, "pre-reset-auto");

  const canonical = buildCanonicalManagedCatalog();
  const nowIso = new Date().toISOString();

  const db = await ensureDbSeeded();
  if (db) {
    for (const item of canonical) {
      const existing = await getCatalogProductById(item.id);
      if (existing) {
        await db
          .update(catalogProducts)
          .set({
            mode: item.mode,
            category: item.category,
            name: item.name,
            nameEn: item.nameEn,
            desc: item.desc,
            descEn: item.descEn,
            price: item.price,
            badge: item.badge || null,
            badgeEn: item.badgeEn || null,
            icon: item.icon,
            imageUrl: item.imageUrl,
            active: 1,
            sortOrder: item.sortOrder,
            updatedBy: actorOpenId,
          })
          .where(eq(catalogProducts.id, item.id));
      } else {
        await db.insert(catalogProducts).values({
          id: item.id,
          mode: item.mode,
          category: item.category,
          name: item.name,
          nameEn: item.nameEn,
          desc: item.desc,
          descEn: item.descEn,
          price: item.price,
          badge: item.badge || null,
          badgeEn: item.badgeEn || null,
          icon: item.icon,
          imageUrl: item.imageUrl,
          active: 1,
          sortOrder: item.sortOrder,
          updatedBy: actorOpenId,
        });
      }
    }
  }

  writeDiskStoreAtomic({
    version: 1,
    updatedAt: nowIso,
    products: canonical,
  });

  await recordAuditAction(actorOpenId, "RESTORE_CANONICAL_102", null, {
    restoredCount: canonical.length,
  });

  return { restoredCount: canonical.length };
}

export async function listAdminAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const db = await ensureDbSeeded();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.id))
        .limit(limit);
      return rows.map((r) => ({
        id: r.id,
        actorOpenId: r.actorOpenId,
        action: r.action,
        targetProductId: r.targetProductId,
        detailsJson: r.detailsJson,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      // Fallback to disk
    }
  }

  if (!fs.existsSync(activeAuditFilePath)) return [];
  try {
    const logs = JSON.parse(fs.readFileSync(activeAuditFilePath, "utf-8")) as AuditLogEntry[];
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}
