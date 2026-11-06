import crypto from "crypto";
import path from "path";
import { parsePriceEuros } from "../shared/catalog";
import { SERVER_DATA_DIR } from "./_core/paths";
import fs from "./_core/dataFs";
import { listAllValidatedOrders, type OrderStatus, type StoredValidatedOrder } from "./analyticsRepository";
import { listCatalogProducts } from "./catalogRepository";

/**
 * Back-office data of the shop: stock, suppliers, purchases, leads, quotes, invoices, expenses,
 * shipments and the sales ledger. The ledger keeps no personal data, so monthly figures survive
 * the automatic deletion of customer orders promised in the privacy policy.
 */

export type StockUnit = "ud" | "kg";
export type StockEntry = { productId: string; tracked: boolean; qty: number; unit: StockUnit; minQty: number; costCents: number; supplierId?: string; updatedAt: string };
export type MovementType = "purchase" | "sale" | "adjustment" | "waste" | "return";
export type StockMovement = { id: string; productId: string; qty: number; type: MovementType; note: string; refId?: string; at: string };
export type Supplier = { id: string; name: string; contact: string; phone: string; email: string; taxId: string; notes: string; createdAt: string };
export type PurchaseStatus = "draft" | "ordered" | "received" | "cancelled";
export type PurchaseLine = { productId?: string; description: string; qty: number; unitCostCents: number };
export type Purchase = { id: string; number: string; supplierId: string; status: PurchaseStatus; lines: PurchaseLine[]; totalCents: number; expectedAt: string; receivedAt?: string; paid: boolean; invoiceRef: string; notes: string; createdAt: string };
export type LeadStage = "new" | "contacted" | "quoted" | "won" | "lost";
export type Lead = { id: string; name: string; phone: string; email: string; source: string; interest: string; stage: LeadStage; valueCents: number; notes: string; nextActionAt: string; createdAt: string; updatedAt: string };
export type DocLine = { description: string; qty: number; unitCents: number; vatPct: number };
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";
export type Quote = { id: string; number: string; customerName: string; phone: string; email: string; taxId: string; address: string; lines: DocLine[]; totalCents: number; status: QuoteStatus; validUntil: string; notes: string; leadId?: string; createdAt: string; updatedAt: string };
export type InvoiceStatus = "issued" | "paid" | "void";
export type Invoice = { id: string; number: string; issuedAt: string; customerName: string; taxId: string; address: string; email: string; lines: DocLine[]; baseCents: number; vatCents: number; totalCents: number; status: InvoiceStatus; paidAt?: string; method: string; orderId?: string; quoteId?: string; notes: string };
export type Expense = { id: string; date: string; category: string; description: string; amountCents: number; paid: boolean; createdAt: string };
export type ShipmentStatus = "pending" | "preparing" | "in_transit" | "delivered" | "incident";
export type Shipment = { orderId: string; status: ShipmentStatus; carrier: string; tracking: string; notes: string; updatedAt: string };
export type SaleItem = { productId: string; name: string; qty: number; cents: number; costCents: number | null };
export type Sale = { id: string; orderId: string; at: string; totalCents: number; customerKey: string; modality: string; items: SaleItem[] };

type Store = {
  stock: Record<string, StockEntry>;
  movements: StockMovement[];
  suppliers: Supplier[];
  purchases: Purchase[];
  leads: Lead[];
  quotes: Quote[];
  invoices: Invoice[];
  expenses: Expense[];
  shipments: Record<string, Shipment>;
  sales: Sale[];
  /** Orders whose stock has already been taken out, so a status change never counts twice. */
  stockTaken: Record<string, true>;
  /** Final amount set by the owner once items sold by weight are weighed. */
  finalAmounts: Record<string, number>;
  monthlyGoalCents: number;
  counters: Record<string, number>;
};

const MAX_MOVEMENTS = 3000;
/** Costs are entered without VAT, shop prices include it: margin compares both without VAT (food rate). */
const FOOD_VAT = 1.1;

function storeFile() {
  return path.join(SERVER_DATA_DIR, "business-store.json");
}

function emptyStore(): Store {
  return { stock: {}, movements: [], suppliers: [], purchases: [], leads: [], quotes: [], invoices: [], expenses: [], shipments: {}, sales: [], stockTaken: {}, finalAmounts: {}, monthlyGoalCents: 0, counters: {} };
}

function read(): Store {
  const file = storeFile();
  if (!fs.existsSync(file)) return emptyStore();
  try {
    return { ...emptyStore(), ...(JSON.parse(fs.readFileSync(file, "utf-8")) as Partial<Store>) };
  } catch {
    return emptyStore();
  }
}

function write(store: Store) {
  const file = storeFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(temp, file);
}

const newId = () => crypto.randomBytes(6).toString("hex");
const now = () => new Date().toISOString();

/** Consecutive numbers per series and year: a number is never reused, as tax rules require for invoices. */
function nextNumber(store: Store, prefix: string) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  store.counters[key] = (store.counters[key] ?? 0) + 1;
  return `${key}-${String(store.counters[key]).padStart(4, "0")}`;
}

/** Prices on the site and on documents include VAT; base and VAT are worked out line by line. */
export function documentTotals(lines: DocLine[]) {
  let totalCents = 0;
  let baseCents = 0;
  for (const l of lines) {
    const gross = Math.round(l.qty * l.unitCents);
    const base = Math.round(gross / (1 + l.vatPct / 100));
    totalCents += gross;
    baseCents += base;
  }
  return { baseCents, vatCents: totalCents - baseCents, totalCents };
}

/* ------------------------------------------------------------------ stock */

function defaultEntry(productId: string, price = ""): StockEntry {
  return { productId, tracked: false, qty: 0, unit: price.includes("/ kg") ? "kg" : "ud", minQty: 0, costCents: 0, updatedAt: now() };
}

export async function listStock() {
  const store = read();
  const products = await listCatalogProducts({ includeInactive: true });
  return products.map((p) => {
    const e = store.stock[p.id] ?? defaultEntry(p.id, p.price);
    const priceCents = Math.round((parsePriceEuros(p.price) ?? 0) * 100);
    const status: "untracked" | "out" | "low" | "ok" = !e.tracked ? "untracked" : e.qty <= 0 ? "out" : e.qty <= e.minQty ? "low" : "ok";
    return { ...e, name: p.name, category: p.category, mode: p.mode, price: p.price, active: p.active, priceCents, valueCents: e.tracked ? Math.round(Math.max(0, e.qty) * e.costCents) : 0, status };
  });
}

export function updateStock(productId: string, patch: Partial<Pick<StockEntry, "tracked" | "unit" | "minQty" | "costCents" | "supplierId">>) {
  const store = read();
  const entry = store.stock[productId] ?? defaultEntry(productId);
  store.stock[productId] = { ...entry, ...patch, productId, updatedAt: now() };
  write(store);
  return store.stock[productId];
}

function applyMovement(store: Store, productId: string, qty: number, type: MovementType, note: string, refId?: string) {
  const entry = store.stock[productId] ?? defaultEntry(productId);
  store.stock[productId] = { ...entry, qty: Math.round((entry.qty + qty) * 1000) / 1000, updatedAt: now() };
  store.movements.unshift({ id: newId(), productId, qty, type, note, refId, at: now() });
  store.movements = store.movements.slice(0, MAX_MOVEMENTS);
}

export function moveStock(productId: string, qty: number, type: MovementType, note: string) {
  const store = read();
  const entry = store.stock[productId] ?? defaultEntry(productId);
  store.stock[productId] = { ...entry, tracked: true };
  applyMovement(store, productId, qty, type, note);
  write(store);
  return store.stock[productId];
}

export function listMovements(productId?: string, limit = 200) {
  const { movements } = read();
  return (productId ? movements.filter((m) => m.productId === productId) : movements).slice(0, limit);
}

/* ------------------------------------------------------------------ order hooks */

const customerKey = (o: StoredValidatedOrder) =>
  crypto.createHash("sha256").update(`corredera-customer:${(o.customerPhone ?? o.customerPhoneMasked ?? o.id).replace(/\D/g, "") || o.id}`).digest("hex").slice(0, 16);

const isByWeight = (price: string) => price.includes("/ kg") || parsePriceEuros(price) === null;

/**
 * Keeps stock, sales ledger and shipments in step with the order status: confirmed orders take stock out
 * (only units; items sold by weight are adjusted by hand once weighed), delivered ones enter the ledger,
 * and cancelling undoes both.
 */
export function syncOrderStatus(order: StoredValidatedOrder, status: OrderStatus) {
  const store = read();
  const takesStock = status === "confirmed" || status === "preparing" || status === "completed";

  if (takesStock && !store.stockTaken[order.id]) {
    for (const item of order.items) {
      const entry = store.stock[item.id];
      if (entry?.tracked && !isByWeight(item.price)) applyMovement(store, item.id, -item.quantity, "sale", `Pedido ${order.id}`, order.id);
    }
    store.stockTaken[order.id] = true;
  }
  if (status === "cancelled" && store.stockTaken[order.id]) {
    for (const m of store.movements.filter((x) => x.refId === order.id && x.type === "sale")) {
      applyMovement(store, m.productId, -m.qty, "return", `Pedido ${order.id} cancelado`, order.id);
    }
    delete store.stockTaken[order.id];
  }

  store.sales = store.sales.filter((s) => s.orderId !== order.id);
  if (status === "completed") {
    const totalCents = store.finalAmounts[order.id] ?? order.totalAmountCents;
    store.sales.unshift({
      id: newId(),
      orderId: order.id,
      at: now(),
      totalCents,
      customerKey: customerKey(order),
      modality: order.modality ?? "pickup",
      items: order.items.map((i) => {
        const cost = store.stock[i.id]?.costCents;
        return { productId: i.id, name: i.name, qty: i.quantity, cents: i.subtotalCents, costCents: cost && !isByWeight(i.price) ? cost * i.quantity : null };
      }),
    });
  }

  if ((order.modality ?? "pickup") === "delivery") {
    const current = store.shipments[order.id];
    const mapped: ShipmentStatus | null = status === "completed" ? "delivered" : status === "preparing" ? "preparing" : null;
    if (mapped && current?.status !== "in_transit") {
      store.shipments[order.id] = { orderId: order.id, carrier: current?.carrier ?? "", tracking: current?.tracking ?? "", notes: current?.notes ?? "", status: mapped, updatedAt: now() };
    }
  }
  write(store);
}

export function setFinalAmount(order: StoredValidatedOrder, cents: number) {
  const store = read();
  store.finalAmounts[order.id] = cents;
  const sale = store.sales.find((s) => s.orderId === order.id);
  if (sale) sale.totalCents = cents;
  write(store);
}

export function forgetOrder(orderId: string) {
  const store = read();
  store.sales = store.sales.filter((s) => s.orderId !== orderId);
  delete store.shipments[orderId];
  delete store.finalAmounts[orderId];
  write(store);
}

/* ------------------------------------------------------------------ logistics */

export function listLogistics() {
  const store = read();
  const orders = listAllValidatedOrders().filter((o) => o.status !== "cancelled");
  return orders.map((o) => {
    const fallback: ShipmentStatus = o.status === "completed" ? "delivered" : o.status === "preparing" ? "preparing" : "pending";
    const s = store.shipments[o.id];
    return {
      orderId: o.id,
      createdAt: o.createdAt,
      customerName: o.customerName,
      customerPhone: o.customerPhone ?? o.customerPhoneMasked,
      modality: o.modality ?? "pickup",
      address: o.deliveryAddress ?? "",
      desiredTime: o.desiredTime ?? "",
      orderStatus: o.status,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      totalCents: store.finalAmounts[o.id] ?? o.totalAmountCents,
      hasVariableItems: Boolean(o.hasVariableItems),
      status: s?.status ?? fallback,
      carrier: s?.carrier ?? "",
      tracking: s?.tracking ?? "",
      notes: s?.notes ?? "",
    };
  });
}

export function updateShipment(orderId: string, patch: Partial<Pick<Shipment, "status" | "carrier" | "tracking" | "notes">>) {
  const store = read();
  const current = store.shipments[orderId] ?? { orderId, status: "pending" as ShipmentStatus, carrier: "", tracking: "", notes: "", updatedAt: now() };
  store.shipments[orderId] = { ...current, ...patch, updatedAt: now() };
  write(store);
  return store.shipments[orderId];
}

/* ------------------------------------------------------------------ suppliers and purchases */

export const listSuppliers = () => read().suppliers;

export function saveSupplier(input: Omit<Supplier, "id" | "createdAt"> & { id?: string }) {
  const store = read();
  const existing = input.id ? store.suppliers.find((s) => s.id === input.id) : undefined;
  const supplier: Supplier = { ...input, id: existing?.id ?? newId(), createdAt: existing?.createdAt ?? now() };
  store.suppliers = existing ? store.suppliers.map((s) => (s.id === supplier.id ? supplier : s)) : [supplier, ...store.suppliers];
  write(store);
  return supplier;
}

export function deleteSupplier(id: string) {
  const store = read();
  if (store.purchases.some((p) => p.supplierId === id)) throw new Error("Este proveedor tiene compras registradas: no se puede eliminar.");
  store.suppliers = store.suppliers.filter((s) => s.id !== id);
  write(store);
}

export const listPurchases = () => read().purchases;

export function savePurchase(input: Pick<Purchase, "supplierId" | "lines" | "expectedAt" | "invoiceRef" | "notes"> & { id?: string }) {
  const store = read();
  const existing = input.id ? store.purchases.find((p) => p.id === input.id) : undefined;
  if (existing?.status === "received") throw new Error("Esta compra ya está recibida: no se puede modificar.");
  const totalCents = input.lines.reduce((a, l) => a + Math.round(l.qty * l.unitCostCents), 0);
  const purchase: Purchase = {
    ...input,
    id: existing?.id ?? newId(),
    number: existing?.number ?? nextNumber(store, "PC"),
    status: existing?.status ?? "ordered",
    paid: existing?.paid ?? false,
    totalCents,
    createdAt: existing?.createdAt ?? now(),
  };
  store.purchases = existing ? store.purchases.map((p) => (p.id === purchase.id ? purchase : p)) : [purchase, ...store.purchases];
  write(store);
  return purchase;
}

/** Receiving a purchase adds its lines to stock and updates each product's cost to the latest price paid. */
export function receivePurchase(id: string) {
  const store = read();
  const purchase = store.purchases.find((p) => p.id === id);
  if (!purchase) throw new Error("Compra no encontrada.");
  if (purchase.status === "received") return purchase;
  for (const line of purchase.lines) {
    if (!line.productId) continue;
    const entry = store.stock[line.productId] ?? defaultEntry(line.productId);
    store.stock[line.productId] = { ...entry, tracked: true, costCents: line.unitCostCents, supplierId: purchase.supplierId };
    applyMovement(store, line.productId, line.qty, "purchase", `Compra ${purchase.number}`, purchase.id);
  }
  purchase.status = "received";
  purchase.receivedAt = now();
  write(store);
  return purchase;
}

export function updatePurchaseFlags(id: string, patch: Partial<Pick<Purchase, "paid" | "status">>) {
  const store = read();
  const purchase = store.purchases.find((p) => p.id === id);
  if (!purchase) throw new Error("Compra no encontrada.");
  if (patch.status && purchase.status === "received") throw new Error("Una compra recibida no cambia de estado.");
  Object.assign(purchase, patch);
  write(store);
  return purchase;
}

/* ------------------------------------------------------------------ leads */

export const listLeads = () => read().leads;

export function saveLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const store = read();
  const existing = input.id ? store.leads.find((l) => l.id === input.id) : undefined;
  const lead: Lead = { ...input, id: existing?.id ?? newId(), createdAt: existing?.createdAt ?? now(), updatedAt: now() };
  store.leads = existing ? store.leads.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...store.leads];
  write(store);
  return lead;
}

export function deleteLead(id: string) {
  const store = read();
  store.leads = store.leads.filter((l) => l.id !== id);
  write(store);
}

/* ------------------------------------------------------------------ quotes */

export const listQuotes = () => read().quotes;

export function saveQuote(input: Pick<Quote, "customerName" | "phone" | "email" | "taxId" | "address" | "lines" | "status" | "validUntil" | "notes" | "leadId"> & { id?: string }) {
  const store = read();
  const existing = input.id ? store.quotes.find((q) => q.id === input.id) : undefined;
  const quote: Quote = {
    ...input,
    id: existing?.id ?? newId(),
    number: existing?.number ?? nextNumber(store, "PR"),
    totalCents: documentTotals(input.lines).totalCents,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  store.quotes = existing ? store.quotes.map((q) => (q.id === quote.id ? quote : q)) : [quote, ...store.quotes];
  if (quote.leadId) {
    const lead = store.leads.find((l) => l.id === quote.leadId);
    if (lead && (lead.stage === "new" || lead.stage === "contacted")) {
      lead.stage = "quoted";
      lead.valueCents = quote.totalCents;
      lead.updatedAt = now();
    }
  }
  write(store);
  return quote;
}

export function deleteQuote(id: string) {
  const store = read();
  store.quotes = store.quotes.filter((q) => q.id !== id);
  write(store);
}

/* ------------------------------------------------------------------ invoices */

export const listInvoices = () => read().invoices;

export function createInvoice(input: Pick<Invoice, "customerName" | "taxId" | "address" | "email" | "lines" | "method" | "notes" | "orderId" | "quoteId">) {
  const store = read();
  const invoice: Invoice = {
    ...input,
    id: newId(),
    number: nextNumber(store, "F"),
    issuedAt: now(),
    status: "issued",
    ...documentTotals(input.lines),
  };
  store.invoices.unshift(invoice);
  if (input.quoteId) {
    const quote = store.quotes.find((q) => q.id === input.quoteId);
    if (quote) quote.status = "accepted";
  }
  write(store);
  return invoice;
}

export function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const store = read();
  const invoice = store.invoices.find((i) => i.id === id);
  if (!invoice) throw new Error("Factura no encontrada.");
  invoice.status = status;
  invoice.paidAt = status === "paid" ? now() : undefined;
  write(store);
  return invoice;
}

/* ------------------------------------------------------------------ expenses */

export const listExpenses = () => read().expenses;

export function saveExpense(input: Pick<Expense, "date" | "category" | "description" | "amountCents" | "paid"> & { id?: string }) {
  const store = read();
  const existing = input.id ? store.expenses.find((e) => e.id === input.id) : undefined;
  const expense: Expense = { ...input, id: existing?.id ?? newId(), createdAt: existing?.createdAt ?? now() };
  store.expenses = existing ? store.expenses.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...store.expenses];
  write(store);
  return expense;
}

export function deleteExpense(id: string) {
  const store = read();
  store.expenses = store.expenses.filter((e) => e.id !== id);
  write(store);
}

export function setMonthlyGoal(cents: number) {
  const store = read();
  store.monthlyGoalCents = cents;
  write(store);
}

/* ------------------------------------------------------------------ direction overview */

const monthKey = (iso: string) => iso.slice(0, 7);

export async function getBusinessOverview() {
  const store = read();
  const nowDate = new Date();
  const thisMonth = monthKey(nowDate.toISOString());
  const lastMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 15);
  const lastMonth = monthKey(lastMonthDate.toISOString());
  const today = nowDate.toISOString().slice(0, 10);
  const orders = listAllValidatedOrders();
  const stock = await listStock();

  // Invoices tied to an order are already in the ledger as that order's sale.
  const manualInvoices = store.invoices.filter((i) => i.status !== "void" && !i.orderId);
  const revenueOf = (month: string) =>
    store.sales.filter((s) => monthKey(s.at) === month).reduce((a, s) => a + s.totalCents, 0) +
    manualInvoices.filter((i) => monthKey(i.issuedAt) === month).reduce((a, i) => a + i.totalCents, 0);
  const expensesOf = (month: string) => store.expenses.filter((e) => monthKey(e.date) === month).reduce((a, e) => a + e.amountCents, 0);
  const purchasesOf = (month: string) => store.purchases.filter((p) => p.status === "received" && monthKey(p.receivedAt ?? p.createdAt) === month).reduce((a, p) => a + p.totalCents, 0);

  const revenueCents = revenueOf(thisMonth);
  const revenueLastCents = revenueOf(lastMonth);
  const dayOfMonth = nowDate.getDate();
  const daysInMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();
  const forecastCents = Math.round((revenueCents / Math.max(1, dayOfMonth)) * daysInMonth);

  // Gross margin only over the lines with a known cost, and it says how much of the sales that covers.
  let coveredRevenue = 0;
  let coveredCost = 0;
  let monthItemsRevenue = 0;
  for (const sale of store.sales.filter((s) => monthKey(s.at) === thisMonth)) {
    for (const item of sale.items) {
      monthItemsRevenue += Math.round(item.cents / FOOD_VAT);
      if (item.costCents !== null) {
        coveredRevenue += Math.round(item.cents / FOOD_VAT);
        coveredCost += item.costCents;
      }
    }
  }
  const grossMarginCents = coveredRevenue - coveredCost;

  const firstSeen = new Map<string, string>();
  for (const s of [...store.sales].reverse()) if (!firstSeen.has(s.customerKey)) firstSeen.set(s.customerKey, s.at);
  const newClients = [...firstSeen.values()].filter((at) => monthKey(at) === thisMonth).length;

  const tracked = stock.filter((s) => s.tracked);
  const logistics = listLogistics();

  const series12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - 11 + i, 15);
    const m = monthKey(d.toISOString());
    return { month: m, revenueCents: revenueOf(m), expensesCents: expensesOf(m) + purchasesOf(m) };
  });
  const daily = Array.from({ length: dayOfMonth }, (_, i) => {
    const date = `${thisMonth}-${String(i + 1).padStart(2, "0")}`;
    return {
      date,
      revenueCents:
        store.sales.filter((s) => s.at.startsWith(date)).reduce((a, s) => a + s.totalCents, 0) +
        manualInvoices.filter((inv) => inv.issuedAt.startsWith(date)).reduce((a, inv) => a + inv.totalCents, 0),
      orders: orders.filter((o) => o.createdAt.startsWith(date)).length,
    };
  });

  const productTotals = new Map<string, { name: string; qty: number; cents: number; costCents: number; costed: boolean }>();
  for (const sale of store.sales) {
    for (const item of sale.items) {
      const t = productTotals.get(item.productId) ?? { name: item.name, qty: 0, cents: 0, costCents: 0, costed: true };
      t.qty += item.qty;
      t.cents += item.cents;
      if (item.costCents === null) t.costed = false;
      else t.costCents += item.costCents;
      productTotals.set(item.productId, t);
    }
  }

  const stageCount = (stage: LeadStage) => store.leads.filter((l) => l.stage === stage).length;
  const openLeads = store.leads.filter((l) => l.stage !== "won" && l.stage !== "lost");

  return {
    updatedAt: nowDate.toISOString(),
    revenueCents,
    revenueLastCents,
    growthPct: revenueLastCents > 0 ? Math.round(((revenueCents - revenueLastCents) / revenueLastCents) * 100) : null,
    forecastCents,
    goalCents: store.monthlyGoalCents,
    grossMarginCents,
    grossMarginPct: coveredRevenue > 0 ? Math.round((grossMarginCents / coveredRevenue) * 100) : null,
    marginCoveragePct: monthItemsRevenue > 0 ? Math.round((coveredRevenue / monthItemsRevenue) * 100) : null,
    newClients,
    clientsTotal: firstSeen.size,
    expensesMonthCents: expensesOf(thisMonth),
    purchasesMonthCents: purchasesOf(thisMonth),
    resultCents: revenueCents - expensesOf(thisMonth) - purchasesOf(thisMonth),
    ordersToday: orders.filter((o) => o.createdAt.startsWith(today)).length,
    ordersTodayCents: orders.filter((o) => o.createdAt.startsWith(today) && o.status !== "cancelled").reduce((a, o) => a + o.totalAmountCents, 0),
    ordersPending: orders.filter((o) => o.status === "pending_whatsapp_confirmation").length,
    ordersPreparing: orders.filter((o) => o.status === "preparing" || o.status === "confirmed").length,
    shipmentsInTransit: logistics.filter((l) => l.status === "in_transit").length,
    shipmentsIncidents: logistics.filter((l) => l.status === "incident").length,
    activeReferences: stock.filter((s) => s.active).length,
    trackedReferences: tracked.length,
    inventoryValueCents: tracked.reduce((a, s) => a + s.valueCents, 0),
    stockouts: tracked.filter((s) => s.status === "out" && s.active).map((s) => ({ id: s.productId, name: s.name })),
    lowStock: tracked.filter((s) => s.status === "low" && s.active).map((s) => ({ id: s.productId, name: s.name, qty: s.qty, unit: s.unit })),
    receivableCents: store.invoices.filter((i) => i.status === "issued").reduce((a, i) => a + i.totalCents, 0),
    payableCents:
      store.purchases.filter((p) => p.status === "received" && !p.paid).reduce((a, p) => a + p.totalCents, 0) +
      store.expenses.filter((e) => !e.paid).reduce((a, e) => a + e.amountCents, 0),
    quotesOpen: store.quotes.filter((q) => q.status === "draft" || q.status === "sent").length,
    quotesOpenCents: store.quotes.filter((q) => q.status === "draft" || q.status === "sent").reduce((a, q) => a + q.totalCents, 0),
    leads: { new: stageCount("new"), contacted: stageCount("contacted"), quoted: stageCount("quoted"), won: stageCount("won"), lost: stageCount("lost"), pipelineCents: openLeads.reduce((a, l) => a + l.valueCents, 0) },
    leadsDue: openLeads.filter((l) => l.nextActionAt && l.nextActionAt.slice(0, 10) <= today).map((l) => ({ id: l.id, name: l.name, interest: l.interest, nextActionAt: l.nextActionAt })),
    series12,
    daily,
    topProducts: [...productTotals.entries()]
      .map(([id, t]) => ({ id, ...t, marginCents: t.costed ? Math.round(t.cents / FOOD_VAT) - t.costCents : null }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 12),
    recentMovements: store.movements.slice(0, 8),
  };
}
