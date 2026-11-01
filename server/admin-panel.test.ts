import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import {
  clearRateLimitForTests,
  forceSetOwnerPassword,
  setAdminOwnerLockPathForTests,
  verifyAdminAccessToken,
} from "./adminAuth";
import { classifyReferrer, normalizeTrackedPath, setAnalyticsStoragePathsForTests } from "./analyticsRepository";
import { setCatalogStoragePathsForTests } from "./catalogRepository";
import { appRouter } from "./routers";
import { setSiteSettingsFilePathForTests } from "./siteSettingsRepository";

const owner: User = {
  id: 1,
  openId: "owner-admin",
  name: "Propietario Corredera",
  email: null,
  loginMethod: "admin_token",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Owner admin panel: single access, analytics, orders and customers", () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearRateLimitForTests();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-admin-panel-"));
    setAdminOwnerLockPathForTests(path.join(tmpDir, "owner-lock.json"));
    setSiteSettingsFilePathForTests(path.join(tmpDir, "site-settings.json"));
    setCatalogStoragePathsForTests({
      storeFile: path.join(tmpDir, "catalog.json"),
      auditFile: path.join(tmpDir, "audit.json"),
      backupDir: path.join(tmpDir, "backups"),
    });
    setAnalyticsStoragePathsForTests({
      analyticsFile: path.join(tmpDir, "analytics.json"),
      ordersFile: path.join(tmpDir, "orders.json"),
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setAdminOwnerLockPathForTests(undefined);
    setSiteSettingsFilePathForTests(undefined);
    setCatalogStoragePathsForTests(undefined);
    setAnalyticsStoragePathsForTests(undefined);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("blocks web-based admin creation outside tests and only accepts the owner password set from the server", async () => {
    delete process.env.ADMIN_ACCESS_TOKEN;
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_ALLOW_WEB_SETUP;
    const anon = appRouter.createCaller({ req: { ip: "203.0.113.9" } as any, res: { cookie: () => undefined } as any, user: null });

    await expect(anon.admin.setupFirstAdmin({ token: "intruso-quiere-entrar-2026" })).rejects.toThrow(/desactivada/);
    expect(fs.existsSync(path.join(tmpDir, "owner-lock.json"))).toBe(false);

    forceSetOwnerPassword("Clave-Del-Dueno-2026");
    expect(verifyAdminAccessToken("Clave-Del-Dueno-2026")).toBe(true);
    expect(verifyAdminAccessToken("otra-clave-cualquiera")).toBe(false);

    const ok = await anon.admin.loginWithToken({ token: "Clave-Del-Dueno-2026" });
    expect(ok.success).toBe(true);
    await expect(anon.admin.loginWithToken({ token: "otra-clave-cualquiera" })).rejects.toThrow();

    // Resetting the password invalidates the previous one.
    forceSetOwnerPassword("Nueva-Clave-Del-Dueno-2026");
    expect(verifyAdminAccessToken("Clave-Del-Dueno-2026")).toBe(false);
  });

  it("tracks pages, time on page, traffic sources and product views", async () => {
    const visitor = appRouter.createCaller({ req: { ip: "198.51.100.4", headers: { host: "correderagourmet.com" } } as any, res: {} as any, user: null });
    await visitor.order.recordEvent({ eventType: "pageview", path: "/", referrer: "https://www.google.com/search?q=jamon", device: "mobile", lang: "es" });
    await visitor.order.recordEvent({ eventType: "pageview", path: "/producto/je1?utm=x", device: "mobile", lang: "es" });
    await visitor.order.recordEvent({ eventType: "page_time", path: "/producto/je1", seconds: 40 });
    await visitor.order.recordEvent({ eventType: "page_time", path: "/producto/je1", seconds: 20 });
    await visitor.order.recordEvent({ eventType: "product_view", productId: "je1", productName: "Jamón 5 Jotas" });
    await visitor.order.recordEvent({ eventType: "pageview", path: "/admin/pedidos" });

    const admin = appRouter.createCaller({ req: { ip: "127.0.0.1" } as any, res: {} as any, user: owner });
    const dash = await admin.admin.getAnalyticsDashboard();
    const product = dash.pages.find((p) => p.path === "/producto/je1");
    expect(product?.views).toBe(1);
    expect(product?.avgSeconds).toBe(30);
    expect(dash.pages.some((p) => p.path.startsWith("/admin"))).toBe(false);
    expect(dash.sources[0]).toEqual({ name: "Google", count: 1 });
    expect(dash.topViewedProducts[0].id).toBe("je1");
    expect(dash.funnel[1].value).toBe(1);
    expect(dash.series30).toHaveLength(30);
  });

  it("classifies referrers and normalizes tracked paths", () => {
    expect(classifyReferrer("")).toBe("Directo");
    expect(classifyReferrer("https://l.instagram.com/?u=x")).toBe("Instagram");
    expect(classifyReferrer("https://correderagourmet.com/tienda", "correderagourmet.com")).toBe("Directo");
    expect(normalizeTrackedPath("/gourmet/quesos/?a=1")).toBe("/gourmet/quesos");
    expect(normalizeTrackedPath("/api/trpc")).toBeNull();
    expect(normalizeTrackedPath("javascript:alert(1)")).toBeNull();
  });

  it("stores the full customer phone for the owner, groups customers, saves notes and deletes orders", async () => {
    const buyer = appRouter.createCaller({ req: { ip: "198.51.100.8" } as any, res: {} as any, user: null });
    for (const items of [[{ id: "je1", qty: 1 }], [{ id: "sj2", qty: 2 }]]) {
      await buyer.order.validateAndPrepareOrder({
        items,
        modality: "delivery",
        customerName: "Ana Gómez",
        customerPhone: "+34 611 222 333",
        deliveryAddress: "Calle Mayor 1",
        privacyAccepted: true,
        lang: "es",
      });
    }

    const admin = appRouter.createCaller({ req: { ip: "127.0.0.1" } as any, res: {} as any, user: owner });
    const orders = await admin.admin.listOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0].customerPhone).toBe("+34 611 222 333");

    const customers = await admin.admin.listCustomers();
    expect(customers).toHaveLength(1);
    expect(customers[0].orders).toBe(2);
    expect(customers[0].totalCents).toBe(62500 + 2 * 2299);

    const noted = await admin.admin.updateOrderNote({ orderId: orders[0].id, note: "Pagado en tienda" });
    expect(noted.internalNote).toBe("Pagado en tienda");

    await admin.admin.deleteOrder({ orderId: orders[0].id });
    expect(await admin.admin.listOrders()).toHaveLength(1);

    const anon = appRouter.createCaller({ req: { ip: "198.51.100.8" } as any, res: {} as any, user: null });
    await expect(anon.admin.listOrders()).rejects.toThrow();
  });

  it("publishes editable homepage announcements and hero slides through the CMS", async () => {
    const admin = appRouter.createCaller({ req: { ip: "127.0.0.1" } as any, res: {} as any, user: owner });
    const current = await admin.admin.getSiteSettings();
    const { version: _v, updatedAt: _u, updatedBy: _b, ...settings } = current;
    expect(settings.storefront.heroSlides.length).toBeGreaterThan(0);

    const saved = await admin.admin.updateSiteSettings({
      ...settings,
      storefront: {
        announcements: [{ textEs: "Cata de jamón el sábado", textEn: "Ham tasting on Saturday" }],
        heroSlides: [{ ...settings.storefront.heroSlides[0], titleEs: "Cata especial", href: "/#visitanos" }],
      },
    });
    expect(saved.storefront.announcements[0].textEs).toBe("Cata de jamón el sábado");

    const publicSettings = await appRouter.createCaller({ req: {} as any, res: {} as any, user: null }).catalog.siteSettings();
    expect(publicSettings.storefront.heroSlides[0].titleEs).toBe("Cata especial");

    await expect(
      admin.admin.updateSiteSettings({
        ...settings,
        storefront: { ...settings.storefront, heroSlides: [{ ...settings.storefront.heroSlides[0], href: "https://evil.example" }] },
      }),
    ).rejects.toThrow();
  });
});
