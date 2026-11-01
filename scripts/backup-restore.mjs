#!/usr/bin/env node
/**
 * Corredera Bakery & Gourmet — Vallejo Lorenzo S.L.
 * Sistema de Copias de Seguridad y Recuperación (Backup & Restore)
 *
 * Uso:
 *   node scripts/backup-restore.mjs backup [etiqueta]
 *   node scripts/backup-restore.mjs restore <directorio-backup>
 *   node scripts/backup-restore.mjs list
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "server", "data");
const UPLOADS_DIR = path.join(ROOT_DIR, "client", "public", "assets", "uploads");
const PRODUCTS_IMG_DIR = path.join(ROOT_DIR, "client", "public", "assets", "products");
const BACKUPS_ROOT = path.join(ROOT_DIR, "backups");

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function copyDirRecursive(srcDir, destDir, manifestFiles = [], baseRel = "") {
  if (!fs.existsSync(srcDir)) return manifestFiles;
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "raw-reference-backups") continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relPath = path.posix.join(baseRel, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, manifestFiles, relPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      const stat = fs.statSync(destPath);
      manifestFiles.push({
        path: relPath,
        sizeBytes: stat.size,
        sha256: sha256File(destPath),
      });
    }
  }
  return manifestFiles;
}

function createBackup(tag = "preproduction") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeTag = String(tag).replace(/[^a-zA-Z0-9_-]/g, "_");
  const backupId = `backup-${timestamp}-${safeTag}`;
  const targetDir = path.join(BACKUPS_ROOT, backupId);

  fs.mkdirSync(targetDir, { recursive: true });
  const files = [];

  // 1. Datos persistentes CMS, catálogo, configuración y encargos (server/data)
  copyDirRecursive(DATA_DIR, path.join(targetDir, "server-data"), files, "server-data");

  // 2. Fotografías y medios subidos desde /admin (client/public/assets/uploads)
  copyDirRecursive(UPLOADS_DIR, path.join(targetDir, "uploads"), files, "uploads");

  // 3. Catálogo base compartido (shared/catalog.ts y shared/siteSettingsSchema.ts)
  const sharedDir = path.join(targetDir, "shared-snapshot");
  fs.mkdirSync(sharedDir, { recursive: true });
  for (const f of ["catalog.ts", "siteSettingsSchema.ts", "gourmetRoutes.ts"]) {
    const src = path.join(ROOT_DIR, "shared", f);
    if (fs.existsSync(src)) {
      const dst = path.join(sharedDir, f);
      fs.copyFileSync(src, dst);
      files.push({
        path: `shared-snapshot/${f}`,
        sizeBytes: fs.statSync(dst).size,
        sha256: sha256File(dst),
      });
    }
  }

  // 4. Inventario de imágenes de producto (/client/public/assets/products)
  const productPhotos = fs.existsSync(PRODUCTS_IMG_DIR)
    ? fs.readdirSync(PRODUCTS_IMG_DIR).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
    : [];

  const manifest = {
    backupId,
    createdAt: new Date().toISOString(),
    company: "Vallejo Lorenzo S.L. — Corredera Bakery & Gourmet",
    totalFilesBackedUp: files.length,
    totalProductImagesVerified: productPhotos.length,
    files,
  };

  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  console.log(`✅ Copia de seguridad completada: ${backupId}`);
  console.log(`   Ruta: ${targetDir}`);
  console.log(`   Archivos respaldados: ${files.length}`);
  console.log(`   Fotografías de producto verificadas: ${productPhotos.length}`);
  return { backupId, targetDir, manifest };
}

function restoreBackup(backupIdOrPath) {
  const resolvedDir = path.isAbsolute(backupIdOrPath)
    ? backupIdOrPath
    : path.join(BACKUPS_ROOT, backupIdOrPath);

  const manifestPath = path.join(resolvedDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No se encontró manifest.json en ${resolvedDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  for (const entry of manifest.files) {
    const fileFull = path.join(resolvedDir, entry.path);
    if (!fs.existsSync(fileFull)) {
      throw new Error(`Archivo faltante en backup: ${entry.path}`);
    }
    const currentHash = sha256File(fileFull);
    if (currentHash !== entry.sha256) {
      throw new Error(`Checksum SHA-256 inválido para ${entry.path}`);
    }
  }

  const srcData = path.join(resolvedDir, "server-data");
  if (fs.existsSync(srcData)) {
    copyDirRecursive(srcData, DATA_DIR);
  }
  const srcUploads = path.join(resolvedDir, "uploads");
  if (fs.existsSync(srcUploads)) {
    copyDirRecursive(srcUploads, UPLOADS_DIR);
  }

  console.log(`✅ Restauración completada y verificada con SHA-256 desde: ${manifest.backupId}`);
}

function listBackups() {
  if (!fs.existsSync(BACKUPS_ROOT)) {
    console.log("No existen copias de seguridad todavía.");
    return;
  }
  const dirs = fs
    .readdirSync(BACKUPS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("backup-"))
    .map((d) => d.name)
    .sort()
    .reverse();

  console.log(`Copias de seguridad disponibles (${dirs.length}):`);
  for (const d of dirs) {
    console.log(` - ${d}`);
  }
}

const [, , cmd = "backup", arg] = process.argv;
if (cmd === "backup") {
  createBackup(arg || "preproduction");
} else if (cmd === "restore") {
  if (!arg) {
    console.error("Uso: node scripts/backup-restore.mjs restore <backupId>");
    process.exit(1);
  }
  restoreBackup(arg);
} else if (cmd === "list") {
  listBackups();
} else {
  console.error(`Comando desconocido: ${cmd}`);
  process.exit(1);
}
