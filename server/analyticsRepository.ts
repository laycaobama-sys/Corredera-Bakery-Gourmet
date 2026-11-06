import crypto from "crypto";
import fs from "./_core/dataFs";
import path from "path";
import { SERVER_DATA_DIR } from "./_core/paths";
import { recordAuditAction } from "./catalogRepository";
import { getSiteSettings } from "./siteSettingsRepository";

export type AnalyticsEventType =
  | "pageview"
  | "page_time"
  | "product_view"
  | "mode_bakery"
  | "mode_gourmet"
  | "cart_add"
  | "whatsapp_click"
  | "phone_click"
  | "maps_click"
  | "order_validated";

export type DeviceCategory = "mobile" | "tablet" | "desktop";
export type OrderStatus =
  | "pending_whatsapp_confirmation"
  | "contacted"
  | "confirmed"
  | "preparing"
  | "completed"
  | "cancelled";

type Conversions = {
  cartAdd: number;
  whatsappClick: number;
  phoneClick: number;
  mapsClick: number;
  orderValidated: number;
};

export interface DailyAnalyticsBucket {
  date: string; // YYYY-MM-DD
  pageviews: number;
  uniqueVisitors: number;
  visitorHashes: string[]; // Ephemeral daily salted hashes (truncated to 12 hex chars, max 5000 per day)
  productViews?: number;
  devices: { mobile: number; tablet: number; desktop: number };
  languages: { es: number; en: number };
  modes: { bakery: number; gourmet: number };
  conversions: Conversions;
}

type PageStat = { path: string; views: number; totalSeconds: number; timedViews: number };
type CountStat = { id: string; name: string; count: number };

export interface AnalyticsStoreState {
  version: number;
  updatedAt: string;
  totals: {
    pageviews: number;
    uniqueVisitors: number;
    devices: { mobile: number; tablet: number; desktop: number };
    languages: { es: number; en: number };
    modes: { bakery: number; gourmet: number };
    conversions: Conversions;
  };
  daily: DailyAnalyticsBucket[]; // Last 90 days
  topProductsAdded: Record<string, CountStat>;
  productViews?: Record<string, CountStat>;
  pages?: Record<string, PageStat>;
  sources?: Record<string, number>;
}

export interface StoredValidatedOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  /** Full contact phone, visible only to the owner in the admin panel to follow up the order. */
  customerPhone?: string;
  customerPhoneMasked: string;
  modality?: "pickup" | "delivery" | "reservation" | "event";
  deliveryAddress?: string | null;
  desiredTime?: string | null;
  customerNotes?: string | null;
  hamCuttingPreference?: "whole_piece" | "free_sliced_vacuum" | null;
  deliveryNotes: string | null;
  internalNote?: string | null;
  items: Array<{
    id: string;
    name: string;
    price: string;
    quantity: number;
    subtotalCents: number;
  }>;
  totalItemsCount: number;
  totalAmountCents: number;
  totalFormatted: string;
  hasVariableItems?: boolean;
  status: OrderStatus;
  clientIpHash: string;
}

const DEFAULT_ANALYTICS_FILE = path.join(SERVER_DATA_DIR, "analytics-store.json");
const DEFAULT_ORDERS_FILE = path.join(SERVER_DATA_DIR, "orders-store.json");
const MAX_DAILY_BUCKETS = 90;
const MAX_STORED_ORDERS = 2000;
const MAX_TRACKED_PAGES = 300;

let activeAnalyticsFilePath = DEFAULT_ANALYTICS_FILE;
let activeOrdersFilePath = DEFAULT_ORDERS_FILE;

export function setAnalyticsStoragePathsForTests(opts?: {
  analyticsFile?: string;
  ordersFile?: string;
}) {
  activeAnalyticsFilePath = opts?.analyticsFile ?? DEFAULT_ANALYTICS_FILE;
  activeOrdersFilePath = opts?.ordersFile ?? DEFAULT_ORDERS_FILE;
}

function ensureDirs() {
  fs.mkdirSync(path.dirname(activeAnalyticsFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(activeOrdersFilePath), { recursive: true });
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeDailyVisitorHash(rawIpOrHash: string, dateKey: string): string {
  const salt = process.env.JWT_SECRET || "corredera-privacy-first-telemetry";
  return crypto
    .createHmac("sha256", `${salt}:${dateKey}`)
    .update(rawIpOrHash || "unknown")
    .digest("hex")
    .slice(0, 12);
}

const emptyConversions = (): Conversions => ({
  cartAdd: 0,
  whatsappClick: 0,
  phoneClick: 0,
  mapsClick: 0,
  orderValidated: 0,
});

function createEmptyBucket(dateKey: string): DailyAnalyticsBucket {
  return {
    date: dateKey,
    pageviews: 0,
    uniqueVisitors: 0,
    visitorHashes: [],
    productViews: 0,
    devices: { mobile: 0, tablet: 0, desktop: 0 },
    languages: { es: 0, en: 0 },
    modes: { bakery: 0, gourmet: 0 },
    conversions: emptyConversions(),
  };
}

function createInitialAnalyticsState(): AnalyticsStoreState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    totals: {
      pageviews: 0,
      uniqueVisitors: 0,
      devices: { mobile: 0, tablet: 0, desktop: 0 },
      languages: { es: 0, en: 0 },
      modes: { bakery: 0, gourmet: 0 },
      conversions: emptyConversions(),
    },
    daily: [createEmptyBucket(todayDateKey())],
    topProductsAdded: {},
    productViews: {},
    pages: {},
    sources: {},
  };
}

function readAnalyticsStore(): AnalyticsStoreState {
  ensureDirs();
  if (!fs.existsSync(activeAnalyticsFilePath)) {
    const initial = createInitialAnalyticsState();
    writeAnalyticsStoreAtomic(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(activeAnalyticsFilePath, "utf-8");
    const parsed = JSON.parse(raw) as AnalyticsStoreState;
    if (!parsed || !parsed.totals || !Array.isArray(parsed.daily)) {
      throw new Error("Invalid analytics store");
    }
    // Stores created before page/source tracking existed.
    parsed.productViews ??= {};
    parsed.pages ??= {};
    parsed.sources ??= {};
    return parsed;
  } catch {
    const fallback = createInitialAnalyticsState();
    writeAnalyticsStoreAtomic(fallback);
    return fallback;
  }
}

function writeAnalyticsStoreAtomic(state: AnalyticsStoreState): void {
  ensureDirs();
  const tempPath = `${activeAnalyticsFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeAnalyticsFilePath);
}

function readOrdersStore(): StoredValidatedOrder[] {
  ensureDirs();
  if (!fs.existsSync(activeOrdersFilePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(activeOrdersFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Privacy policy: customer data is kept only for the retention period set in the admin panel.
    const cutoff = Date.now() - getSiteSettings().legal.orderRetentionDays * 24 * 60 * 60 * 1000;
    const kept = (parsed as StoredValidatedOrder[]).filter((o) => new Date(o.createdAt).getTime() >= cutoff);
    if (kept.length !== parsed.length) writeOrdersStoreAtomic(kept);
    return kept;
  } catch {
    return [];
  }
}

function writeOrdersStoreAtomic(orders: StoredValidatedOrder[]): void {
  ensureDirs();
  const tempPath = `${activeOrdersFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(orders.slice(0, MAX_STORED_ORDERS), null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeOrdersFilePath);
}

/** Normalizes a page path for aggregation: no query string, no trailing slash, bounded length. */
export function normalizeTrackedPath(raw: string | undefined): string | null {
  if (!raw) return null;
  const clean = raw.split(/[?#]/)[0].trim().replace(/\/+$/, "") || "/";
  if (!/^\/[a-zA-Z0-9/_.-]*$/.test(clean) || clean.length > 120) return null;
  if (clean.startsWith("/admin") || clean.startsWith("/api")) return null;
  return clean;
}

/** Groups a referrer into a traffic source label without storing the full URL. */
export function classifyReferrer(referrer: string | undefined, ownHost?: string): string {
  if (!referrer) return "Directo";
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Directo";
  }
  if (!host || (ownHost && host === ownHost.replace(/^www\./, "").toLowerCase())) return "Directo";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (/bing\.com$|duckduckgo\.com$|yahoo\./.test(host)) return "Otros buscadores";
  if (/instagram\.com$/.test(host)) return "Instagram";
  if (/facebook\.com$|fb\.com$|messenger\.com$/.test(host)) return "Facebook";
  if (/tiktok\.com$/.test(host)) return "TikTok";
  if (/whatsapp\.com$|wa\.me$/.test(host)) return "WhatsApp";
  if (/maps\.app\.goo\.gl$|goo\.gl$/.test(host)) return "Google Maps";
  return host.slice(0, 60);
}

function bump(record: Record<string, CountStat>, id: string, name: string) {
  const current = record[id] ?? { id, name, count: 0 };
  current.count += 1;
  current.name = name;
  record[id] = current;
}

export function recordAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  device?: DeviceCategory;
  lang?: "es" | "en";
  productId?: string;
  productName?: string;
  clientIdentifier?: string;
  path?: string;
  source?: string;
  seconds?: number;
}): { recorded: true; updatedAt: string } {
  const state = readAnalyticsStore();
  const dateKey = todayDateKey();

  let bucket = state.daily.find((b) => b.date === dateKey);
  if (!bucket) {
    bucket = createEmptyBucket(dateKey);
    state.daily.unshift(bucket);
    state.daily = state.daily.slice(0, MAX_DAILY_BUCKETS);
  }

  // Time-on-page beacons arrive when the visitor leaves; they must not create visitors.
  if (input.eventType !== "page_time") {
    const visitorHash = computeDailyVisitorHash(input.clientIdentifier || "anon", dateKey);
    if (!bucket.visitorHashes.includes(visitorHash)) {
      if (bucket.visitorHashes.length < 5000) {
        bucket.visitorHashes.push(visitorHash);
      }
      bucket.uniqueVisitors += 1;
      state.totals.uniqueVisitors += 1;
    }
  }

  const device: DeviceCategory = input.device ?? "mobile";
  const lang: "es" | "en" = input.lang ?? "es";
  const pagePath = normalizeTrackedPath(input.path);
  const pages = state.pages!;

  switch (input.eventType) {
    case "pageview":
      bucket.pageviews += 1;
      state.totals.pageviews += 1;
      bucket.devices[device] = (bucket.devices[device] || 0) + 1;
      state.totals.devices[device] = (state.totals.devices[device] || 0) + 1;
      bucket.languages[lang] = (bucket.languages[lang] || 0) + 1;
      state.totals.languages[lang] = (state.totals.languages[lang] || 0) + 1;
      if (pagePath && (pages[pagePath] || Object.keys(pages).length < MAX_TRACKED_PAGES)) {
        const p = pages[pagePath] ?? { path: pagePath, views: 0, totalSeconds: 0, timedViews: 0 };
        p.views += 1;
        pages[pagePath] = p;
      }
      if (input.source) {
        state.sources![input.source] = (state.sources![input.source] ?? 0) + 1;
      }
      break;
    case "page_time":
      if (pagePath && pages[pagePath] && typeof input.seconds === "number") {
        const seconds = Math.max(0, Math.min(1800, Math.round(input.seconds)));
        pages[pagePath].totalSeconds += seconds;
        pages[pagePath].timedViews += 1;
      }
      break;
    case "product_view":
      bucket.productViews = (bucket.productViews ?? 0) + 1;
      if (input.productId && input.productName) {
        bump(state.productViews!, input.productId, input.productName);
      }
      break;
    case "mode_bakery":
      bucket.modes.bakery += 1;
      state.totals.modes.bakery += 1;
      break;
    case "mode_gourmet":
      bucket.modes.gourmet += 1;
      state.totals.modes.gourmet += 1;
      break;
    case "cart_add":
      bucket.conversions.cartAdd += 1;
      state.totals.conversions.cartAdd += 1;
      if (input.productId && input.productName) {
        bump(state.topProductsAdded, input.productId, input.productName);
      }
      break;
    case "whatsapp_click":
      bucket.conversions.whatsappClick += 1;
      state.totals.conversions.whatsappClick += 1;
      break;
    case "phone_click":
      bucket.conversions.phoneClick += 1;
      state.totals.conversions.phoneClick += 1;
      break;
    case "maps_click":
      bucket.conversions.mapsClick += 1;
      state.totals.conversions.mapsClick += 1;
      break;
    case "order_validated":
      bucket.conversions.orderValidated += 1;
      state.totals.conversions.orderValidated += 1;
      break;
  }

  state.updatedAt = new Date().toISOString();
  state.version += 1;
  writeAnalyticsStoreAtomic(state);

  return { recorded: true, updatedAt: state.updatedAt };
}

function maskPhoneForStorage(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 3)} *** ${digits.slice(-3)}`;
}

export function recordValidatedOrderOnDisk(input: {
  customerName: string;
  customerPhone: string;
  modality?: "pickup" | "delivery" | "reservation" | "event";
  deliveryAddress?: string | null;
  desiredTime?: string | null;
  customerNotes?: string | null;
  hamCuttingPreference?: "whole_piece" | "free_sliced_vacuum" | null;
  deliveryNotes: string | null;
  items: Array<{
    id: string;
    name: string;
    price: string;
    quantity: number;
    subtotalCents: number;
  }>;
  totalItemsCount: number;
  totalAmountCents: number;
  totalFormatted: string;
  hasVariableItems?: boolean;
  clientIpHash: string;
}): StoredValidatedOrder {
  const orders = readOrdersStore();
  const nowIso = new Date().toISOString();
  const orderId = `ORD-${nowIso.slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const created: StoredValidatedOrder = {
    id: orderId,
    createdAt: nowIso,
    updatedAt: nowIso,
    customerName: input.customerName,
    customerPhone: input.customerPhone.trim(),
    customerPhoneMasked: maskPhoneForStorage(input.customerPhone),
    modality: input.modality ?? "pickup",
    deliveryAddress: input.deliveryAddress ?? null,
    desiredTime: input.desiredTime ?? null,
    customerNotes: input.customerNotes ?? null,
    hamCuttingPreference: input.hamCuttingPreference ?? null,
    deliveryNotes: input.deliveryNotes,
    internalNote: null,
    items: input.items,
    totalItemsCount: input.totalItemsCount,
    totalAmountCents: input.totalAmountCents,
    totalFormatted: input.totalFormatted,
    hasVariableItems: input.hasVariableItems ?? false,
    status: "pending_whatsapp_confirmation",
    clientIpHash: input.clientIpHash.slice(0, 16),
  };

  orders.unshift(created);
  writeOrdersStoreAtomic(orders);

  recordAnalyticsEvent({
    eventType: "order_validated",
    clientIdentifier: input.clientIpHash,
  });

  return created;
}

export function listRecentValidatedOrders(limit = 50): StoredValidatedOrder[] {
  return readOrdersStore().slice(0, limit);
}

export function listAllValidatedOrders(): StoredValidatedOrder[] {
  return readOrdersStore();
}

export async function updateValidatedOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorOpenId: string
): Promise<StoredValidatedOrder> {
  const orders = readOrdersStore();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    throw new Error(`No se encontró el pedido '${orderId}'.`);
  }
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeOrdersStoreAtomic(orders);

  await recordAuditAction(actorOpenId, "UPDATE_ORDER_STATUS", orderId, {
    status,
  });

  return orders[idx];
}

export async function updateValidatedOrderNote(
  orderId: string,
  internalNote: string,
  actorOpenId: string
): Promise<StoredValidatedOrder> {
  const orders = readOrdersStore();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error(`No se encontró el pedido '${orderId}'.`);
  orders[idx] = { ...orders[idx], internalNote: internalNote || null, updatedAt: new Date().toISOString() };
  writeOrdersStoreAtomic(orders);
  await recordAuditAction(actorOpenId, "UPDATE_ORDER_NOTE", orderId, {});
  return orders[idx];
}

export async function deleteValidatedOrder(orderId: string, actorOpenId: string): Promise<{ deleted: true }> {
  const orders = readOrdersStore();
  const next = orders.filter((o) => o.id !== orderId);
  if (next.length === orders.length) throw new Error(`No se encontró el pedido '${orderId}'.`);
  writeOrdersStoreAtomic(next);
  await recordAuditAction(actorOpenId, "DELETE_ORDER", orderId, {});
  return { deleted: true };
}

function phoneKey(phone: string | undefined, fallback: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-9) : `name:${fallback.trim().toLowerCase()}`;
}

/** Customers are derived from orders, grouped by phone number (or by name when no phone is available). */
export function listCustomersFromOrders() {
  const orders = readOrdersStore();
  const map = new Map<
    string,
    {
      key: string;
      name: string;
      phone: string;
      orders: number;
      activeOrders: number;
      totalCents: number;
      firstOrderAt: string;
      lastOrderAt: string;
      lastAddress: string | null;
      orderIds: string[];
    }
  >();
  for (const o of [...orders].reverse()) {
    const key = phoneKey(o.customerPhone, o.customerName);
    const current = map.get(key) ?? {
      key,
      name: o.customerName,
      phone: o.customerPhone ?? o.customerPhoneMasked,
      orders: 0,
      activeOrders: 0,
      totalCents: 0,
      firstOrderAt: o.createdAt,
      lastOrderAt: o.createdAt,
      lastAddress: null,
      orderIds: [],
    };
    current.orders += 1;
    current.name = o.customerName || current.name;
    current.lastOrderAt = o.createdAt;
    current.orderIds.unshift(o.id);
    if (o.deliveryAddress) current.lastAddress = o.deliveryAddress;
    if (o.status !== "cancelled") {
      current.activeOrders += 1;
      current.totalCents += o.totalAmountCents;
    }
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function getAnalyticsDashboardData() {
  const state = readAnalyticsStore();
  const orders = readOrdersStore();

  const topProducts = Object.values(state.topProductsAdded)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topViewedProducts = Object.values(state.productViews ?? {})
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalDeviceViews =
    state.totals.devices.mobile + state.totals.devices.tablet + state.totals.devices.desktop;

  const mobileSharePct =
    totalDeviceViews > 0 ? Math.round((state.totals.devices.mobile / totalDeviceViews) * 100) : 0;

  const totalConversions =
    state.totals.conversions.whatsappClick +
    state.totals.conversions.phoneClick +
    state.totals.conversions.mapsClick +
    state.totals.conversions.orderValidated;

  const conversionRatePct =
    state.totals.uniqueVisitors > 0
      ? Math.min(100, Number(((state.totals.conversions.orderValidated / state.totals.uniqueVisitors) * 100).toFixed(1)))
      : 0;

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalOrderRevenueCents = activeOrders.reduce((sum, o) => sum + o.totalAmountCents, 0);

  // Daily series for the last 30 days (zero-filled), joining orders and revenue by date.
  const byDate = new Map(state.daily.map((b) => [b.date, b]));
  const ordersByDate = new Map<string, { count: number; cents: number }>();
  for (const o of activeOrders) {
    const key = o.createdAt.slice(0, 10);
    const cur = ordersByDate.get(key) ?? { count: 0, cents: 0 };
    cur.count += 1;
    cur.cents += o.totalAmountCents;
    ordersByDate.set(key, cur);
  }
  const series30 = lastNDays(30).map((date) => {
    const b = byDate.get(date);
    const o = ordersByDate.get(date);
    return {
      date,
      pageviews: b?.pageviews ?? 0,
      uniqueVisitors: b?.uniqueVisitors ?? 0,
      productViews: b?.productViews ?? 0,
      cartAdds: b?.conversions.cartAdd ?? 0,
      whatsappClicks: b?.conversions.whatsappClick ?? 0,
      orders: o?.count ?? 0,
      revenueCents: o?.cents ?? 0,
    };
  });

  const sumRange = (days: number, field: "pageviews" | "uniqueVisitors" | "orders" | "revenueCents") =>
    series30.slice(-days).reduce((acc, d) => acc + d[field], 0);

  const pages = Object.values(state.pages ?? {})
    .sort((a, b) => b.views - a.views)
    .slice(0, 25)
    .map((p) => ({
      path: p.path,
      views: p.views,
      avgSeconds: p.timedViews > 0 ? Math.round(p.totalSeconds / p.timedViews) : null,
    }));

  const sources = Object.entries(state.sources ?? {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalProductViews = Object.values(state.productViews ?? {}).reduce((a, p) => a + p.count, 0);

  const ordersByStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    updatedAt: state.updatedAt,
    privacyMode: "RGPD_FIRST_PARTY_ANONYMIZED_NO_COOKIES" as const,
    totals: {
      ...state.totals,
      mobileSharePct,
      totalConversions,
      conversionRatePct,
      totalProductViews,
      totalOrdersCount: orders.length,
      activeOrdersCount: activeOrders.length,
      pendingOrdersCount: orders.filter((o) => o.status === "pending_whatsapp_confirmation").length,
      totalOrderRevenueCents,
      totalOrderRevenueFormatted: `${(totalOrderRevenueCents / 100).toFixed(2).replace(".", ",")} €`,
    },
    periods: {
      today: { visits: sumRange(1, "pageviews"), visitors: sumRange(1, "uniqueVisitors"), orders: sumRange(1, "orders"), revenueCents: sumRange(1, "revenueCents") },
      last7: { visits: sumRange(7, "pageviews"), visitors: sumRange(7, "uniqueVisitors"), orders: sumRange(7, "orders"), revenueCents: sumRange(7, "revenueCents") },
      last30: { visits: sumRange(30, "pageviews"), visitors: sumRange(30, "uniqueVisitors"), orders: sumRange(30, "orders"), revenueCents: sumRange(30, "revenueCents") },
    },
    funnel: [
      { step: "Visitantes", value: state.totals.uniqueVisitors },
      { step: "Vieron un producto", value: totalProductViews },
      { step: "Añadieron al pedido", value: state.totals.conversions.cartAdd },
      { step: "Enviaron pedido", value: state.totals.conversions.orderValidated },
    ],
    series30,
    dailySeries: state.daily.slice(0, 14).map((b) => ({
      date: b.date,
      pageviews: b.pageviews,
      uniqueVisitors: b.uniqueVisitors,
      devices: b.devices,
      conversions: b.conversions,
    })),
    pages,
    sources,
    ordersByStatus,
    topProducts,
    topViewedProducts,
    recentOrders: orders.slice(0, 30),
  };
}
