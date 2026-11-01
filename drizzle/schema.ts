import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Orders and bookings table.
 * Tracks customer pre-orders and reservations channeled through WhatsApp confirmation.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderCode: varchar("orderCode", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", [
    "pending_whatsapp_confirmation",
    "contacted",
    "confirmed",
    "preparing",
    "confirmed_by_store",
    "in_preparation",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ]).default("pending_whatsapp_confirmation").notNull(),
  modality: mysqlEnum("modality", ["pickup", "delivery", "reservation", "event"]).notNull(),
  customerName: varchar("customerName", { length: 128 }),
  desiredTime: varchar("desiredTime", { length: 128 }),
  notes: text("notes"),
  itemsCount: int("itemsCount").notNull(),
  itemsJson: text("itemsJson").notNull(),
  estimatedTotal: varchar("estimatedTotal", { length: 32 }).notNull(),
  hasVariableItems: int("hasVariableItems").default(0).notNull(),
  whatsappMessage: text("whatsappMessage").notNull(),
  clientIpHash: varchar("clientIpHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Catalog products table for Corredera Bakery & Gourmet (102 canonical references + custom items).
 * Supports bilingual ES/EN copy, Bakery/Gourmet mode, category, price, image URL, and active toggle.
 */
export const catalogProducts = mysqlTable("catalog_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  mode: mysqlEnum("mode", ["bakery", "gourmet"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }).notNull(),
  desc: text("desc").notNull(),
  descEn: text("descEn").notNull(),
  price: varchar("price", { length: 64 }).notNull(),
  badge: varchar("badge", { length: 80 }),
  badgeEn: varchar("badgeEn", { length: 80 }),
  icon: mysqlEnum("icon", [
    "coffee",
    "cake",
    "bag",
    "ham",
    "cheese",
    "wine",
    "sandwich",
  ]).default("coffee").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(),
  active: int("active").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  updatedBy: varchar("updatedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CatalogProductRow = typeof catalogProducts.$inferSelect;
export type InsertCatalogProductRow = typeof catalogProducts.$inferInsert;

/**
 * Admin audit log table to record every administrative catalog mutation.
 */
export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetProductId: varchar("targetProductId", { length: 64 }),
  detailsJson: text("detailsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;