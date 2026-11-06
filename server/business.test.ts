import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import { clearRateLimitForTests } from "./adminAuth";
import { setAnalyticsStoragePathsForTests } from "./analyticsRepository";
import { documentTotals } from "./businessRepository";
import { setCatalogStoragePathsForTests } from "./catalogRepository";
import { appRouter } from "./routers";
import { SERVER_DATA_DIR } from "./_core/paths";

const owner: User = { id: 1, openId: "owner-admin", name: "Propietario", email: null, loginMethod: "admin_token", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = () => appRouter.createCaller({ req: { ip: "127.0.0.1", headers: {} } as any, res: {} as any, user: owner });
const visitor = () => appRouter.createCaller({ req: { ip: "10.0.0.9", headers: {} } as any, res: {} as any, user: null });

async function placeOrder(items: { id: string; qty: number }[]) {
  await visitor().order.validateAndPrepareOrder({ items, modality: "delivery", customerName: "Ana Prueba", customerPhone: "600111222", deliveryAddress: "Calle Mayor 1, Madrid", desiredTime: "", notes: "", privacyAccepted: true, lang: "es" } as any);
  const orders = await admin().admin.listOrders();
  return orders[0];
}

describe("Back office: stock, sales, purchases, documents and direction board", () => {
  let tmpDir: string;
  const storeFile = path.join(SERVER_DATA_DIR, "business-store.json");

  beforeEach(() => {
    clearRateLimitForTests();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-business-"));
    fs.rmSync(storeFile, { force: true });
    setCatalogStoragePathsForTests({ storeFile: path.join(tmpDir, "catalog.json"), auditFile: path.join(tmpDir, "audit.json"), backupDir: path.join(tmpDir, "backups") });
    setAnalyticsStoragePathsForTests({ analyticsFile: path.join(tmpDir, "analytics.json"), ordersFile: path.join(tmpDir, "orders.json") });
  });

  afterEach(() => {
    setCatalogStoragePathsForTests(undefined);
    setAnalyticsStoragePathsForTests(undefined);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(storeFile, { force: true });
  });

  it("is only available to the owner", async () => {
    await expect(visitor().business.overview()).rejects.toThrow();
    await expect(visitor().business.listInvoices()).rejects.toThrow();
  });

  it("starts at zero: the board never shows invented figures", async () => {
    const d = await admin().business.overview();
    expect(d.revenueCents).toBe(0);
    expect(d.inventoryValueCents).toBe(0);
    expect(d.grossMarginPct).toBeNull();
    expect(d.activeReferences).toBeGreaterThan(100);
  });

  it("takes stock out once when confirming, returns it on cancel, and books the sale only when delivered", async () => {
    const api = admin();
    await api.business.updateStock({ productId: "sj3", tracked: true, costCents: 1000, minQty: 2 });
    await api.business.moveStock({ productId: "sj3", qty: 10, type: "purchase", note: "inicial" });

    const order = await placeOrder([{ id: "sj3", qty: 3 }]);
    const qtyOf = async () => (await api.business.listStock()).find((s) => s.productId === "sj3")!.qty;

    await api.admin.updateOrderStatus({ orderId: order.id, status: "confirmed" });
    await api.admin.updateOrderStatus({ orderId: order.id, status: "preparing" });
    expect(await qtyOf()).toBe(7);
    expect((await api.business.overview()).revenueCents).toBe(0);

    await api.admin.updateOrderStatus({ orderId: order.id, status: "completed" });
    const d = await api.business.overview();
    expect(d.revenueCents).toBe(order.totalAmountCents);
    expect(d.newClients).toBe(1);
    expect(d.inventoryValueCents).toBe(7000);
    expect(d.grossMarginPct).toBeGreaterThan(0);

    await api.admin.updateOrderStatus({ orderId: order.id, status: "cancelled" });
    expect(await qtyOf()).toBe(10);
    expect((await api.business.overview()).revenueCents).toBe(0);
  });

  it("flags stockouts and low stock, and receiving a purchase adds stock and updates the cost", async () => {
    const api = admin();
    await api.business.updateStock({ productId: "je1", tracked: true, minQty: 1 });
    expect((await api.business.overview()).stockouts.map((s) => s.id)).toContain("je1");

    const supplier = await api.business.saveSupplier({ name: "Distribuidor Ibérico", contact: "", phone: "", email: "", taxId: "", notes: "" });
    const purchase = await api.business.savePurchase({ supplierId: supplier.id, lines: [{ productId: "je1", description: "Jamón", qty: 1, unitCostCents: 45000 }], expectedAt: "2026-11-10", invoiceRef: "", notes: "" });
    expect(purchase.number).toMatch(/^PC-\d{4}-0001$/);
    await api.business.receivePurchase({ id: purchase.id });
    await api.business.receivePurchase({ id: purchase.id });

    const row = (await api.business.listStock()).find((s) => s.productId === "je1")!;
    expect(row.qty).toBe(1);
    expect(row.costCents).toBe(45000);
    const d = await api.business.overview();
    expect(d.lowStock.map((s) => s.id)).toContain("je1");
    expect(d.payableCents).toBe(45000);
    await expect(api.business.deleteSupplier({ id: supplier.id })).rejects.toThrow();
  });

  it("numbers invoices consecutively, splits VAT from VAT-inclusive prices and counts them once", async () => {
    const api = admin();
    const lines = [
      { description: "Cesta gourmet", qty: 2, unitCents: 1100, vatPct: 10 },
      { description: "Vino", qty: 1, unitCents: 1210, vatPct: 21 },
    ];
    expect(documentTotals(lines)).toEqual({ baseCents: 3000, vatCents: 410, totalCents: 3410 });
    const first = await api.business.createInvoice({ customerName: "Empresa SL", taxId: "B1", address: "", email: "", lines, method: "Tarjeta", notes: "" });
    const second = await api.business.createInvoice({ customerName: "Otra SL", taxId: "B2", address: "", email: "", lines, method: "Tarjeta", notes: "" });
    expect(Number(second.number.slice(-4))).toBe(Number(first.number.slice(-4)) + 1);
    let d = await api.business.overview();
    expect(d.revenueCents).toBe(6820);
    expect(d.receivableCents).toBe(6820);

    await api.business.setInvoiceStatus({ id: first.id, status: "paid" });
    await api.business.setInvoiceStatus({ id: second.id, status: "void" });
    d = await api.business.overview();
    expect(d.revenueCents).toBe(3410);
    expect(d.receivableCents).toBe(0);
  });

  it("moves a lead to quoted when a quote is created for it", async () => {
    const api = admin();
    const lead = await api.business.saveLead({ name: "Hotel Centro", phone: "", email: "", source: "Teléfono", interest: "Cestas", stage: "new", valueCents: 0, notes: "", nextActionAt: "" });
    const quote = await api.business.saveQuote({ customerName: "Hotel Centro", phone: "", email: "", taxId: "", address: "", lines: [{ description: "Cestas", qty: 5, unitCents: 5000, vatPct: 10 }], status: "sent", validUntil: "", notes: "", leadId: lead.id });
    expect(quote.totalCents).toBe(25000);
    const updated = (await api.business.listLeads()).find((l) => l.id === lead.id)!;
    expect(updated.stage).toBe("quoted");
    expect(updated.valueCents).toBe(25000);
  });
});
