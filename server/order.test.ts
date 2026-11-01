import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildWhatsAppOrderMessage,
  formatPrice,
  menuItems,
  parsePriceEuros,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  whatsappUrl,
} from "../shared/catalog";
import { setAnalyticsStoragePathsForTests } from "./analyticsRepository";
import { appRouter } from "./routers";

describe("Corredera Bakery & Gourmet — Contact & Orders Flow Audit", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-orders-test-"));
    setAnalyticsStoragePathsForTests({
      analyticsFile: path.join(tmpDir, "analytics.json"),
      ordersFile: path.join(tmpDir, "orders.json"),
    });
  });

  afterEach(() => {
    setAnalyticsStoragePathsForTests(undefined);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  it("verifies the official WhatsApp number format and URL encoder", () => {
    expect(WHATSAPP_NUMBER).toBe("34640341932");
    expect(WHATSAPP_DISPLAY).toBe("+34 640 34 19 32");

    const sampleMsg = "Hola Corredera! Pedido con tildes: Jamón ibérico, café con leche & tarta de limón.";
    const url = whatsappUrl(sampleMsg);

    expect(url).toBe(`https://wa.me/34640341932?text=${encodeURIComponent(sampleMsg)}`);
    expect(url).toContain("34640341932");
    expect(decodeURIComponent(url.replace("https://wa.me/34640341932?text=", ""))).toBe(sampleMsg);
  });

  it("encodes multiline orders with special characters, accents, bullet points and currency symbols correctly", () => {
    const d3 = menuItems.find((i) => i.id === "d3")!;
    const bo1 = menuItems.find((i) => i.id === "bo1")!;

    const message = buildWhatsAppOrderMessage({
      items: [
        { item: d3, qty: 2 },
        { item: bo1, qty: 3 },
      ],
      modality: "pickup",
      customerName: "Álvaro González & Peña",
      desiredTime: "Hoy a las 10:30h (mañana)",
      notes: "Por favor, pan bien tostado y servilletas adicionales.",
      lang: "es",
    });

    expect(message).toContain("• 2x Desayuno Ibérico");
    expect(message).toContain("• 3x Croissant de Mantequilla");
    expect(message).toContain("Álvaro González & Peña");
    expect(message).toContain("15,00 €"); // 2 * 4.50 + 3 * 2.00 = 9.00 + 6.00 = 15.00
    expect(message).toContain("Recogida en el establecimiento (Calle de la Puebla, 15)");

    const encoded = whatsappUrl(message);
    expect(encoded.startsWith("https://wa.me/34640341932?text=")).toBe(true);

    const roundtrip = decodeURIComponent(encoded.replace("https://wa.me/34640341932?text=", ""));
    expect(roundtrip).toBe(message);
  });

  it("handles empty items or inquiries gracefully without producing NaN or undefined", () => {
    const emptyMsgEs = buildWhatsAppOrderMessage({
      items: [],
      modality: "reservation",
      customerName: "Carlos",
      desiredTime: "Viernes 20:00",
      notes: "Mesa para 4",
      lang: "es",
    });

    expect(emptyMsgEs).toContain("Hola Corredera Bakery & Gourmet");
    expect(emptyMsgEs).toContain("Reserva de mesa / barra de degustación");
    expect(emptyMsgEs).not.toContain("NaN");
    expect(emptyMsgEs).not.toContain("undefined");

    const emptyMsgEn = buildWhatsAppOrderMessage({
      items: [],
      modality: "event",
      customerName: "Sarah",
      desiredTime: "Next Tuesday 10am",
      notes: "Office catering",
      lang: "en",
    });

    expect(emptyMsgEn).toContain("Corporate / event / bespoke gourmet gift order");
    expect(emptyMsgEn).not.toContain("NaN");
  });

  it("correctly identifies and flags variable / by-weight items in the message subtotal", () => {
    const cakeByWeight = menuItems.find((i) => i.id === "t6")!; // 39,99 € / kg
    const lomoByWeight = menuItems.find((i) => i.id === "em1")!; // 98,00 € / kg
    const coffee = menuItems.find((i) => i.id === "c1")!; // 1,99 €

    const mixedMsg = buildWhatsAppOrderMessage({
      items: [
        { item: coffee, qty: 2 },
        { item: cakeByWeight, qty: 1 },
        { item: lomoByWeight, qty: 1 },
      ],
      modality: "pickup",
      customerName: "Beatriz",
      desiredTime: "12:00",
      notes: "",
      lang: "es",
    });

    expect(mixedMsg).toContain("3,98 € (+ productos al corte por kilo)");
    expect(mixedMsg).toContain("Bizcocho Casero de Naranja (39,99 € / kg)");
    expect(mixedMsg).toContain("Presa Ibérica Curada (98,00 € / kg)");
  });

  it("server-side order validation router recalculates authoritative prices and ignores manipulated client inputs", async () => {
    const caller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: {} as any,
      user: null,
    });

    // Submitting 2x Jamón 100% Bellota (g1, real price 24,50 € each) + 1x Croissant de Mantequilla (bo1, 2,00 €)
    const result = await caller.order.validateAndPrepareOrder({
      items: [
        { id: "g1", qty: 2 },
        { id: "bo1", qty: 1 },
      ],
      modality: "pickup",
      customerName: "Elena",
      desiredTime: "Mañana 11:00",
      notes: "Cortado fino",
      lang: "es",
    });

    expect(result.success).toBe(true);
    expect(result.orderCode).toMatch(/^CORR-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(result.itemCount).toBe(3);
    expect(result.distinctItemsCount).toBe(2);
    // Authoritative total: 2 * 24.50 + 1 * 2.00 = 49.00 + 2.00 = 51.00 €
    expect(result.authoritativeNumericTotal).toBe(51.0);
    expect(result.authoritativeTotalFormatted).toBe("51,00 €");
    expect(result.whatsappUrl).toContain("34640341932");
    expect(result.whatsappDisplay).toBe("+34 640 34 19 32");

    // Honest persistence audit: without DATABASE_URL configured, reports unpersisted safely
    expect(result.persisted).toBe(false);
    expect(result.persistenceStatus).toBe("DATABASE_URL_NOT_CONFIGURED");
  });

  it("merges duplicate product IDs and rejects non-existent product IDs with BAD_REQUEST", async () => {
    const caller = appRouter.createCaller({
      req: { ip: "127.0.0.1" } as any,
      res: {} as any,
      user: null,
    });

    // Merging duplicate entries for 'bo1' (qty 2 + qty 3 = 5)
    const mergedResult = await caller.order.validateAndPrepareOrder({
      items: [
        { id: "bo1", qty: 2 },
        { id: "bo1", qty: 3 },
      ],
      modality: "pickup",
      lang: "es",
    });

    expect(mergedResult.itemCount).toBe(5);
    expect(mergedResult.distinctItemsCount).toBe(1);
    expect(mergedResult.authoritativeNumericTotal).toBe(10.0); // 5 * 2.00 = 10.00 €

    // Non-existent ID rejection
    await expect(
      caller.order.validateAndPrepareOrder({
        items: [{ id: "invalid-product-ref-999", qty: 1 }],
        modality: "pickup",
      })
    ).rejects.toThrow(/no existe en la carta/);
  });

  it("checks persistence diagnostics and reports unconfigured state transparently", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    const diag = await caller.order.diagnostics();
    expect(diag.catalogItemsCount).toBe(127);
    expect(diag.officialWhatsAppDigits).toBe("34640341932");
    expect(diag.officialWhatsAppNumber).toBe("+34 640 34 19 32");
    expect(diag.persistenceStorage).toBe("unconfigured_database_url");
  });
});
