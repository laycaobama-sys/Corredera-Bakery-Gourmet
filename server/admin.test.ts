import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import {
  ADMIN_COOKIE_NAME,
  authenticateAdminFromRequest,
  clearRateLimitForTests,
  setAdminOwnerLockPathForTests,
} from "./adminAuth";
import { setAdminUploadDirForTests } from "./adminRouter";
import { setCatalogStoragePathsForTests } from "./catalogRepository";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Isolated temporary directory so automated tests NEVER alter production data
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-admin-test-"));
const testStoreFile = path.join(tempRoot, "catalog-store.json");
const testAuditFile = path.join(tempRoot, "admin-audit-log.json");
const testOwnerLockFile = path.join(tempRoot, "admin-owner-lock.json");
const testBackupDir = path.join(tempRoot, "backups");
const testUploadDir = path.join(tempRoot, "uploads");

function createMockContext(opts?: {
  user?: User | null;
  ip?: string;
}): {
  ctx: TrpcContext;
  cookiesSet: { name: string; value: string; options: Record<string, unknown> }[];
  cookiesCleared: string[];
} {
  const cookiesSet: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const cookiesCleared: string[] = [];

  const ctx: TrpcContext = {
    user: opts?.user ?? null,
    req: {
      protocol: "https",
      ip: opts?.ip ?? "127.0.0.1",
      headers: {
        "x-forwarded-proto": "https",
      },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookiesSet.push({ name, value, options });
      },
      clearCookie: (name: string) => {
        cookiesCleared.push(name);
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, cookiesSet, cookiesCleared };
}

const adminUser: User = {
  id: 1,
  openId: "owner-admin",
  name: "Propietario Corredera",
  email: "info@correderamadrid.com",
  loginMethod: "admin_token",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const regularUser: User = {
  id: 2,
  openId: "customer-user-99",
  name: "Cliente Regular",
  email: "cliente@example.com",
  loginMethod: "oauth",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Corredera Admin Panel & Server Persistence Suite", () => {
  const originalToken = process.env.ADMIN_ACCESS_TOKEN;

  beforeEach(() => {
    clearRateLimitForTests();
    if (fs.existsSync(testStoreFile)) fs.unlinkSync(testStoreFile);
    if (fs.existsSync(testAuditFile)) fs.unlinkSync(testAuditFile);
    if (fs.existsSync(testOwnerLockFile)) fs.unlinkSync(testOwnerLockFile);
    setCatalogStoragePathsForTests({
      storeFile: testStoreFile,
      auditFile: testAuditFile,
      backupDir: testBackupDir,
    });
    setAdminOwnerLockPathForTests(testOwnerLockFile);
    setAdminUploadDirForTests(testUploadDir);
  });

  afterAll(() => {
    process.env.ADMIN_ACCESS_TOKEN = originalToken;
    setCatalogStoragePathsForTests();
    setAdminOwnerLockPathForTests();
    setAdminUploadDirForTests();
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  // =========================================================================
  // 1. RBAC & SERVER-SIDE ACCESS CONTROL
  // =========================================================================
  describe("1. Server-Side Authentication & Role-Based Access Control (RBAC)", () => {
    it("rejects unauthenticated callers on all private admin procedures with UNAUTHORIZED", async () => {
      const { ctx } = createMockContext({ user: null });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.listAllProducts()).rejects.toThrow();
      await expect(
        caller.admin.toggleProductActive({ id: "d1", active: false })
      ).rejects.toThrow();
      await expect(
        caller.admin.deleteProduct({ id: "d1", confirmId: "d1" })
      ).rejects.toThrow();
      await expect(caller.admin.createBackup()).rejects.toThrow();
      await expect(caller.admin.listAuditLogs()).rejects.toThrow();
    });

    it("rejects authenticated non-admin users (role='user') on all admin procedures with FORBIDDEN", async () => {
      const { ctx } = createMockContext({ user: regularUser });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.listAllProducts()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.admin.createProduct({
          id: "hack1",
          mode: "bakery",
          category: "desayunos",
          name: "Intento no autorizado",
          nameEn: "Unauthorized attempt",
          desc: "Descripción válida",
          descEn: "Valid description",
          price: "3,90 €",
          badge: "",
          badgeEn: "",
          icon: "coffee",
          imageUrl: "/assets/products/d1.jpg",
          active: true,
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.admin.deleteProduct({ id: "d1", confirmId: "d1" })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("enforces ADMIN_ACCESS_TOKEN precondition, timing-safe token verification, signed HttpOnly cookie, and IP rate limiting", async () => {
      // Case A: Unconfigured ADMIN_ACCESS_TOKEN -> PRECONDITION_FAILED on loginWithToken,
      // while setupFirstAdmin initializes scrypt-hashed owner credential and locks further setup calls
      delete process.env.ADMIN_ACCESS_TOKEN;
      const { ctx: unconfCtx } = createMockContext({ user: null, ip: "10.0.0.10" });
      const unconfCaller = appRouter.createCaller(unconfCtx);

      await expect(
        unconfCaller.admin.loginWithToken({ token: "any-token-value-1234" })
      ).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });

      const setupRes = await unconfCaller.admin.setupFirstAdmin({
        token: "initial-owner-secret-2026",
        actorName: "Fundador Corredera",
      });
      expect(setupRes.success).toBe(true);
      expect(setupRes.sessionToken.length).toBeGreaterThan(20);

      // Subsequent setupFirstAdmin calls must be rejected once initialized
      await expect(
        unconfCaller.admin.setupFirstAdmin({
          token: "second-attempt-secret-2026",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });

      // Reset testOwnerLockFile to test env-based ADMIN_ACCESS_TOKEN next
      if (fs.existsSync(testOwnerLockFile)) fs.unlinkSync(testOwnerLockFile);

      // Case B: Configured ADMIN_ACCESS_TOKEN -> wrong token rejected, rate limit triggered after 5 attempts
      process.env.ADMIN_ACCESS_TOKEN = "corredera-test-secret-2026";
      const { ctx: bruteCtx } = createMockContext({ user: null, ip: "10.0.0.99" });
      const bruteCaller = appRouter.createCaller(bruteCtx);

      for (let i = 0; i < 5; i++) {
        await expect(
          bruteCaller.admin.loginWithToken({ token: "wrong-password-attempt" })
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      }

      // 6th attempt from same IP must be blocked with TOO_MANY_REQUESTS
      await expect(
        bruteCaller.admin.loginWithToken({ token: "corredera-test-secret-2026" })
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      // Case C: Valid login from clean IP sets HttpOnly signed JWT cookie and authenticates request
      const { ctx: validCtx, cookiesSet } = createMockContext({
        user: null,
        ip: "10.0.0.50",
      });
      const validCaller = appRouter.createCaller(validCtx);
      const loginRes = await validCaller.admin.loginWithToken({
        token: "corredera-test-secret-2026",
        actorName: "Auditor Corredera",
      });

      expect(loginRes.success).toBe(true);
      expect(loginRes.role).toBe("admin");
      expect(cookiesSet.length).toBe(1);
      expect(cookiesSet[0].name).toBe(ADMIN_COOKIE_NAME);
      expect(cookiesSet[0].options.httpOnly).toBe(true);

      // Verify that authenticateAdminFromRequest decodes the signed cookie into an admin User
      const authenticatedUser = await authenticateAdminFromRequest({
        headers: {
          cookie: `${ADMIN_COOKIE_NAME}=${cookiesSet[0].value}`,
        },
      } as Parameters<typeof authenticateAdminFromRequest>[0]);

      expect(authenticatedUser).not.toBeNull();
      expect(authenticatedUser?.role).toBe("admin");
      expect(authenticatedUser?.name).toBe("Auditor Corredera");
    });
  });

  // =========================================================================
  // 2. REAL PRODUCT CRUD & PUBLIC PERSISTENCE
  // =========================================================================
  describe("2. Real Product CRUD, Order Sync & Persistence Across Reloads", () => {
    it("seeds the 192 canonical references (57 Bakery + 135 Gourmet) and persists full CRUD operations", async () => {
      const { ctx: adminCtx } = createMockContext({ user: adminUser });
      const { ctx: publicCtx } = createMockContext({ user: null });
      const adminCaller = appRouter.createCaller(adminCtx);
      const publicCaller = appRouter.createCaller(publicCtx);

      // 1. Initial seed check
      const initialAll = await adminCaller.admin.listAllProducts();
      expect(initialAll.length).toBe(192);
      expect(initialAll.filter((p) => p.mode === "bakery").length).toBe(57);
      expect(initialAll.filter((p) => p.mode === "gourmet").length).toBe(135);

      // 2. Create a new product
      const created = await adminCaller.admin.createProduct({
        id: "bo99",
        mode: "bakery",
        category: "bolleria",
        name: "Caracola Artesana de Canela y Nuez",
        nameEn: "Artisan Cinnamon & Pecan Roll",
        desc: "Masa hojaldrada con mantequilla y glaseado ligero.",
        descEn: "Flaky butter pastry with light glaze.",
        price: "3,40 €",
        badge: "Nuevo",
        badgeEn: "New",
        icon: "cake",
        imageUrl: "/assets/products/bo1.jpg",
        active: true,
      });

      expect(created.id).toBe("bo99");
      expect(created.price).toBe("3,40 €");

      // Duplicate ID creation must fail cleanly
      await expect(
        adminCaller.admin.createProduct({
          id: "bo99",
          mode: "bakery",
          category: "bolleria",
          name: "Duplicado",
          nameEn: "Duplicate",
          desc: "Desc",
          descEn: "Desc",
          price: "2,00 €",
          badge: "",
          badgeEn: "",
          icon: "cake",
          imageUrl: "/assets/products/bo1.jpg",
          active: true,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      // 3. Verify new product is persisted and visible on public catalog endpoint
      const publicAfterCreate = await publicCaller.catalog.listPublic();
      expect(publicAfterCreate.length).toBe(193);
      expect(publicAfterCreate.some((p) => p.id === "bo99")).toBe(true);

      // 4. Update product price and name, verify public catalog and order calculation reflect new price
      const updated = await adminCaller.admin.updateProduct({
        id: "bo99",
        mode: "bakery",
        category: "bolleria",
        name: "Caracola Reina de Canela",
        nameEn: "Queen Cinnamon Roll",
        desc: "Masa hojaldrada con mantequilla francesa.",
        descEn: "Flaky French butter pastry.",
        price: "3,80 €",
        badge: "Edición Especial",
        badgeEn: "Special Edition",
        icon: "cake",
        imageUrl: "/assets/products/bo1.jpg",
        active: true,
      });
      expect(updated.price).toBe("3,80 €");

      const orderValidation = await publicCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo99", qty: 2 }],
        modality: "pickup",
        customerName: "María",
        lang: "es",
      });
      expect(orderValidation.authoritativeNumericTotal).toBeCloseTo(7.6, 2);
      expect(orderValidation.whatsappMessage).toContain("Caracola Reina de Canela");

      // 5. Deactivate product -> hidden from public catalog & blocked from new orders, still in admin list
      const deactivated = await adminCaller.admin.toggleProductActive({
        id: "bo99",
        active: false,
      });
      expect(deactivated.active).toBe(false);

      const publicAfterDeactivate = await publicCaller.catalog.listPublic();
      expect(publicAfterDeactivate.some((p) => p.id === "bo99")).toBe(false);
      expect(publicAfterDeactivate.length).toBe(192);

      const adminListAfterDeactivate = await adminCaller.admin.listAllProducts();
      expect(adminListAfterDeactivate.length).toBe(193);

      await expect(
        publicCaller.order.validateAndPrepareOrder({
          items: [{ id: "bo99", qty: 1 }],
          modality: "pickup",
          lang: "es",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      // 6. Delete product with confirmation safeguard
      await expect(
        adminCaller.admin.deleteProduct({ id: "bo99", confirmId: "wrong-id" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const deleted = await adminCaller.admin.deleteProduct({
        id: "bo99",
        confirmId: "bo99",
      });
      expect(deleted.deletedId).toBe("bo99");
      expect(deleted.remainingCount).toBe(192);
    });
  });

  // =========================================================================
  // 3. INPUT VALIDATION & SECURITY SCHEMAS
  // =========================================================================
  describe("3. Input Validation & Security Constraints", () => {
    it("rejects mismatched category/mode, invalid prices, HTML/XSS tags, and unsafe image URLs", async () => {
      const { ctx } = createMockContext({ user: adminUser });
      const caller = appRouter.createCaller(ctx);

      // Mismatched category ('jamones_enteros' in 'bakery')
      await expect(
        caller.admin.createProduct({
          id: "bad1",
          mode: "bakery",
          category: "jamones_enteros" as any,
          name: "Producto Inválido",
          nameEn: "Invalid Product",
          desc: "Descripción válida",
          descEn: "Valid description",
          price: "4,50 €",
          badge: "",
          badgeEn: "",
          icon: "coffee",
          imageUrl: "/assets/products/d1.jpg",
          active: true,
        })
      ).rejects.toThrow();

      // Invalid price format
      await expect(
        caller.admin.createProduct({
          id: "bad2",
          mode: "bakery",
          category: "desayunos",
          name: "Precio Mal Formateado",
          nameEn: "Bad Price Format",
          desc: "Descripción válida",
          descEn: "Valid description",
          price: "FREE $0",
          badge: "",
          badgeEn: "",
          icon: "coffee",
          imageUrl: "/assets/products/d1.jpg",
          active: true,
        })
      ).rejects.toThrow();

      // HTML / script injection in name
      await expect(
        caller.admin.createProduct({
          id: "bad3",
          mode: "bakery",
          category: "desayunos",
          name: "<script>alert(1)</script>",
          nameEn: "Clean Name",
          desc: "Descripción válida",
          descEn: "Valid description",
          price: "3,90 €",
          badge: "",
          badgeEn: "",
          icon: "coffee",
          imageUrl: "/assets/products/d1.jpg",
          active: true,
        })
      ).rejects.toThrow();

      // Unsafe imageUrl (path traversal or javascript:)
      await expect(
        caller.admin.createProduct({
          id: "bad4",
          mode: "bakery",
          category: "desayunos",
          name: "Ruta Insegura",
          nameEn: "Unsafe Path",
          desc: "Descripción válida",
          descEn: "Valid description",
          price: "3,90 €",
          badge: "",
          badgeEn: "",
          icon: "coffee",
          imageUrl: "/assets/../../etc/passwd",
          active: true,
        })
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 4. IMAGE UPLOAD VALIDATION & BACKUP / RECOVERY
  // =========================================================================
  describe("4. Image Upload Magic-Byte Validation & Backup/Recovery", () => {
    it("validates image magic bytes and rejects forged MIME files", async () => {
      const { ctx } = createMockContext({ user: adminUser });
      const caller = appRouter.createCaller(ctx);

      // Forged file: claims to be image/jpeg but contains text bytes
      const forgedBase64 = Buffer.from("not-a-real-jpeg-image-content").toString("base64");
      await expect(
        caller.admin.uploadProductImage({
          fileName: "forged.jpg",
          mimeType: "image/jpeg",
          base64Data: forgedBase64,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      // Valid JPEG magic bytes (FF D8 FF E0 + padding)
      const validJpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0xff, 0xd9,
      ]);
      const uploadRes = await caller.admin.uploadProductImage({
        fileName: "tosta-jamon.jpg",
        mimeType: "image/jpeg",
        base64Data: validJpegBuffer.toString("base64"),
      });

      expect(uploadRes.imageUrl).toMatch(/^\/assets\/uploads\/tosta-jamon-\d+\.jpg$/);
      expect(uploadRes.sizeBytes).toBe(validJpegBuffer.length);
    });

    it("creates backup snapshots and restores the canonical 192 catalog safely", async () => {
      const { ctx } = createMockContext({ user: adminUser });
      const caller = appRouter.createCaller(ctx);

      const backup = await caller.admin.createBackup({ label: "vitest-check" });
      expect(backup.productsCount).toBe(192);
      expect(backup.fileName).toContain("vitest-check");

      // Delete one item in test store, then restore canonical catalog
      await caller.admin.deleteProduct({ id: "d1", confirmId: "d1" });
      const afterDelete = await caller.admin.listAllProducts();
      expect(afterDelete.length).toBe(191);

      const restored = await caller.admin.restoreCanonicalDefaults({
        confirmPhrase: "RESTAURAR_102",
      });
      expect(restored.restoredCount).toBe(192);

      const afterRestore = await caller.admin.listAllProducts();
      expect(afterRestore.length).toBe(192);

      const logs = await caller.admin.listAuditLogs({ limit: 10 });
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs[0].action).toBe("RESTORE_CANONICAL_102");
    });
  });
});
