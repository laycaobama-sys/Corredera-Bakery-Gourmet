import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_SETTINGS,
  SEASONAL_CAMPAIGN_PRESETS,
} from "../shared/siteSettingsSchema";
import {
  clearRateLimitForTests,
  hashClientIp,
  setAdminOwnerLockPathForTests,
} from "./adminAuth";
import { setAnalyticsStoragePathsForTests } from "./analyticsRepository";
import { setCatalogStoragePathsForTests } from "./catalogRepository";
import { appRouter } from "./routers";
import { setSiteSettingsFilePathForTests } from "./siteSettingsRepository";

describe("Security, Privacy (RGPD/LSSI) & Full Website CMS Audit Suite", () => {
  let tmpDir: string;
  let originalAdminEnv: string | undefined;

  beforeEach(() => {
    originalAdminEnv = process.env.ADMIN_ACCESS_TOKEN;
    delete process.env.ADMIN_ACCESS_TOKEN;
    clearRateLimitForTests();

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-sec-cms-"));
    setAdminOwnerLockPathForTests(path.join(tmpDir, "owner-lock.json"));
    setSiteSettingsFilePathForTests(path.join(tmpDir, "site-settings.json"));
    setCatalogStoragePathsForTests({
      storeFile: path.join(tmpDir, "catalog-store.json"),
      auditFile: path.join(tmpDir, "audit-log.json"),
      backupDir: path.join(tmpDir, "backups"),
    });
    setAnalyticsStoragePathsForTests({
      analyticsFile: path.join(tmpDir, "analytics-store.json"),
      ordersFile: path.join(tmpDir, "orders-store.json"),
    });
  });

  afterEach(() => {
    if (originalAdminEnv !== undefined) {
      process.env.ADMIN_ACCESS_TOKEN = originalAdminEnv;
    } else {
      delete process.env.ADMIN_ACCESS_TOKEN;
    }
    clearRateLimitForTests();
    setAdminOwnerLockPathForTests(undefined);
    setSiteSettingsFilePathForTests(undefined);
    setCatalogStoragePathsForTests(undefined);
    setAnalyticsStoragePathsForTests(undefined);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  it("pseudonymizes client IP addresses with SHA-256 so raw IPs are never stored", () => {
    const rawIp = "83.44.192.105";
    const hashed = hashClientIp(rawIp);

    expect(hashed).toMatch(/^[a-f0-9]{16}$/);
    expect(hashed).not.toContain("83.44");
    expect(hashed).not.toContain("192.105");
    expect(hashClientIp(rawIp)).toBe(hashed);
  });

  it("enforces explicit privacy acceptance (RGPD) and XSS rejection on order submissions", async () => {
    const publicCaller = appRouter.createCaller({
      req: { ip: "10.20.30.40" } as any,
      res: {} as any,
      user: null,
    });

    // 1. Explicit privacyAccepted = false must be rejected
    await expect(
      publicCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 2 }],
        modality: "pickup",
        customerName: "María",
        privacyAccepted: false,
        lang: "es",
      })
    ).rejects.toThrow(/Política de Privacidad/);

    // 2. XSS tags in customerName, desiredTime, or notes must be rejected
    await expect(
      publicCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 1 }],
        modality: "pickup",
        customerName: "<script>alert(1)</script>",
        privacyAccepted: true,
        lang: "es",
      })
    ).rejects.toThrow(/No se permiten etiquetas HTML/);

    await expect(
      publicCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 1 }],
        modality: "pickup",
        notes: "Nota con <img src=x onerror=alert(1)>",
        privacyAccepted: true,
        lang: "es",
      })
    ).rejects.toThrow(/No se permiten etiquetas HTML/);
  });

  it("enforces rate limiting on order validation to prevent automated abuse", async () => {
    const spamCaller = appRouter.createCaller({
      req: { ip: "198.51.100.77" } as any,
      res: {} as any,
      user: null,
    });

    for (let i = 0; i < 15; i++) {
      const ok = await spamCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 1 }],
        modality: "pickup",
        privacyAccepted: true,
      });
      expect(ok.success).toBe(true);
    }

    // 16th request within the 10-minute window must be rate-limited
    await expect(
      spamCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 1 }],
        modality: "pickup",
        privacyAccepted: true,
      })
    ).rejects.toThrow(/demasiadas solicitudes/i);
  });

  it("blocks unauthorized users from reading or modifying CMS site settings and allows admin to publish Christmas campaign and edit any site content", async () => {
    const anonymousCaller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: {} as any,
      user: null,
    });

    // Anonymous caller cannot call admin CMS endpoints
    await expect(anonymousCaller.admin.getSiteSettings()).rejects.toThrow();
    await expect(
      anonymousCaller.admin.updateSiteSettings(DEFAULT_SITE_SETTINGS)
    ).rejects.toThrow();

    // Admin caller can read and update any website content, including Christmas campaign
    const adminCaller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: { cookie: () => undefined } as any,
      user: {
        id: 1,
        openId: "owner-admin",
        name: "Propietario Corredera",
        email: null,
        loginMethod: "admin_token",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });

    const initial = await anonymousCaller.catalog.siteSettings();
    expect(initial.seasonalCampaign.enabled).toBe(false);
    expect(initial.legal.companyName).toBe("Vallejo Lorenzo S.L.");

    // Owner activates the Christmas campaign preset and updates holiday hours + NIF
    const updatedPayload = {
      ...DEFAULT_SITE_SETTINGS,
      seasonalCampaign: SEASONAL_CAMPAIGN_PRESETS.navidad.config,
      schedule: {
        ...DEFAULT_SITE_SETTINGS.schedule,
        specialHolidayHoursEs: "Horario Nochebuena y Nochevieja: 08:30 a 15:30h",
        specialHolidayHoursEn: "Christmas Eve & NYE hours: 08:30 to 15:30",
      },
      legal: {
        ...DEFAULT_SITE_SETTINGS.legal,
        nif: "B12345678",
      },
    };

    const saved = await adminCaller.admin.updateSiteSettings(updatedPayload);
    expect(saved.seasonalCampaign.enabled).toBe(true);
    expect(saved.seasonalCampaign.badgeEs).toContain("NAVIDAD");
    expect(saved.schedule.specialHolidayHoursEs).toContain("Nochebuena");
    expect(saved.legal.nif).toBe("B12345678");

    // Verify public endpoint immediately serves the persisted Christmas campaign & updated settings
    const publicSettings = await anonymousCaller.catalog.siteSettings();
    expect(publicSettings.seasonalCampaign.enabled).toBe(true);
    expect(publicSettings.seasonalCampaign.titleEs).toContain("Navidad");
    expect(publicSettings.schedule.specialHolidayHoursEs).toContain("Nochebuena");
    expect(publicSettings.legal.nif).toBe("B12345678");

    // Rejects XSS in CMS fields
    await expect(
      adminCaller.admin.updateSiteSettings({
        ...DEFAULT_SITE_SETTINGS,
        hero: {
          ...DEFAULT_SITE_SETTINGS.hero,
          heroTitleEs: "Título malicioso <script>alert(1)</script>",
        },
      })
    ).rejects.toThrow(/etiquetas HTML/);
  });

  it("allows the owner to pause online WhatsApp orders during holidays/maintenance and rotates admin password securely", async () => {
    const mockRes = { cookie: () => undefined, clearCookie: () => undefined } as any;
    const anonCaller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: mockRes,
      user: null,
    });

    // Bootstrap first admin password
    await anonCaller.admin.setupFirstAdmin({
      token: "InitialOwnerKey#2026!",
      actorName: "Propietario",
    });

    const adminCaller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: mockRes,
      user: {
        id: 1,
        openId: "owner-admin",
        name: "Propietario",
        email: null,
        loginMethod: "admin_token",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });

    // Rotate password
    const rotated = await adminCaller.admin.changePassword({
      currentPassword: "InitialOwnerKey#2026!",
      newPassword: "RotatedChristmasKey#2027!",
    });
    expect(rotated.success).toBe(true);

    // Old password must now fail
    await expect(
      anonCaller.admin.loginWithToken({ token: "InitialOwnerKey#2026!" })
    ).rejects.toThrow(/inválida/);

    // New password succeeds
    const loginNew = await anonCaller.admin.loginWithToken({
      token: "RotatedChristmasKey#2027!",
    });
    expect(loginNew.success).toBe(true);

    // Pause WhatsApp orders temporarily
    await adminCaller.admin.updateSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      contact: {
        ...DEFAULT_SITE_SETTINGS.contact,
        whatsappOrdersEnabled: false,
        pauseOrdersNoticeEs: "Cerrado por descanso del personal el 25 de diciembre.",
      },
    });

    await expect(
      anonCaller.order.validateAndPrepareOrder({
        items: [{ id: "bo1", qty: 1 }],
        modality: "pickup",
        privacyAccepted: true,
        lang: "es",
      })
    ).rejects.toThrow(/25 de diciembre/);
  });

  it("preserves rolling CMS version history, supports 1-click version rollback, restores catalog backups, and tracks first-party analytics & orders", async () => {
    const mockRes = { cookie: () => undefined, clearCookie: () => undefined } as any;
    const publicCaller = appRouter.createCaller({
      req: { ip: "192.0.2.55" } as any,
      res: mockRes,
      user: null,
    });

    const adminCaller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: mockRes,
      user: {
        id: 1,
        openId: "owner-admin",
        name: "Propietario",
        email: null,
        loginMethod: "admin_token",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });

    // 1. Update CMS settings twice and verify version history snapshots
    const v2 = await adminCaller.admin.updateSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        heroTitleEs: "Título Especial de Navidad v2 en Corredera",
      },
    });
    expect(v2.version).toBe(2);

    const v3 = await adminCaller.admin.updateSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        heroTitleEs: "Título Erróneo v3 que quiero deshacer",
      },
    });
    expect(v3.version).toBe(3);

    const history = await adminCaller.admin.listSiteSettingsHistory();
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history.some((h) => h.version === 2)).toBe(true);

    // Rollback to v2 in 1 click
    const rolledBack = await adminCaller.admin.restoreSiteSettingsVersion({
      version: 2,
    });
    expect(rolledBack.version).toBe(4);
    expect(rolledBack.hero.heroTitleEs).toBe("Título Especial de Navidad v2 en Corredera");

    // 2. Delete a catalog product -> automatic backup snapshot is created -> restore it in 1 click
    const delRes = await adminCaller.admin.deleteProduct({
      id: "bo1",
      confirmId: "bo1",
    });
    expect(delRes.remainingCount).toBe(126);

    const statusAfterDel = await adminCaller.admin.authStatus();
    expect(statusAfterDel.storage.backups.length).toBeGreaterThan(0);
    const autoBackupFile = statusAfterDel.storage.backups.find((f) =>
      f.includes("pre-del-bo1")
    )!;
    expect(autoBackupFile).toBeDefined();

    const restoredCatalog = await adminCaller.admin.restoreCatalogBackup({
      fileName: autoBackupFile,
    });
    expect(restoredCatalog.restoredCount).toBe(127);

    // 3. First-party telemetry & durable disk order persistence
    await publicCaller.order.recordEvent({
      eventType: "pageview",
      device: "mobile",
      lang: "es",
    });
    await publicCaller.order.recordEvent({
      eventType: "cart_add",
      device: "mobile",
      lang: "es",
      productId: "g1",
      productName: "Jamón 100% Ibérico de Bellota",
    });

    const orderRes = await publicCaller.order.validateAndPrepareOrder({
      items: [{ id: "g1", qty: 1 }],
      modality: "pickup",
      customerName: "Lucía Malasaña",
      privacyAccepted: true,
      lang: "es",
    });
    expect(orderRes.diskPersisted).toBe(true);
    expect(orderRes.diskOrderId).toMatch(/^ORD-/);

    const dash = await adminCaller.admin.getAnalyticsDashboard();
    expect(dash.totals.pageviews).toBe(1);
    expect(dash.totals.devices.mobile).toBe(1);
    expect(dash.totals.conversions.cartAdd).toBe(1);
    expect(dash.totals.totalOrdersCount).toBe(1);
    expect(dash.recentOrders[0].customerName).toBe("Lucía Malasaña");
    expect(dash.recentOrders[0].status).toBe("pending_whatsapp_confirmation");

    // Update order status to completed
    const updatedOrd = await adminCaller.admin.updateOrderStatus({
      orderId: dash.recentOrders[0].id,
      status: "completed",
    });
    expect(updatedOrd.status).toBe("completed");
  });
});
