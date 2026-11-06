import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { listAllValidatedOrders } from "./analyticsRepository";
import * as biz from "./businessRepository";
import { adminProcedure, router } from "./_core/trpc";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML");
const cents = z.number().int().min(0).max(100_000_000);
const quantity = z.number().min(0.001).max(100_000);
const id = z.string().trim().min(1).max(64);
const dateText = z.string().trim().max(40);

const docLines = z
  .array(
    z.object({
      description: text(240).min(1, "Escribe la descripción de cada línea"),
      qty: quantity,
      unitCents: cents,
      vatPct: z.number().refine((v) => [0, 4, 5, 10, 21].includes(v), "Tipo de IVA no válido"),
    }),
  )
  .min(1, "Añade al menos una línea")
  .max(200);

/** Business rules throw plain errors with a message for the owner. */
function guarded<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw new TRPCError({ code: "BAD_REQUEST", message: err instanceof Error ? err.message : "No se pudo completar la operación." });
  }
}

export const businessRouter = router({
  overview: adminProcedure.query(() => biz.getBusinessOverview()),
  setMonthlyGoal: adminProcedure.input(z.object({ cents })).mutation(({ input }) => biz.setMonthlyGoal(input.cents)),

  listStock: adminProcedure.query(() => biz.listStock()),
  updateStock: adminProcedure
    .input(z.object({ productId: id, tracked: z.boolean().optional(), unit: z.enum(["ud", "kg"]).optional(), minQty: z.number().min(0).max(100_000).optional(), costCents: cents.optional(), supplierId: id.optional() }))
    .mutation(({ input: { productId, ...patch } }) => biz.updateStock(productId, patch)),
  moveStock: adminProcedure
    .input(z.object({ productId: id, qty: z.number().min(-100_000).max(100_000).refine((v) => v !== 0, "Indica una cantidad"), type: z.enum(["purchase", "adjustment", "waste", "return"]), note: text(200) }))
    .mutation(({ input }) => biz.moveStock(input.productId, input.qty, input.type, input.note)),
  listMovements: adminProcedure.input(z.object({ productId: id.optional() }).optional()).query(({ input }) => biz.listMovements(input?.productId)),

  listLogistics: adminProcedure.query(() => biz.listLogistics()),
  updateShipment: adminProcedure
    .input(z.object({ orderId: id, status: z.enum(["pending", "preparing", "in_transit", "delivered", "incident"]).optional(), carrier: text(80).optional(), tracking: text(120).optional(), notes: text(400).optional() }))
    .mutation(({ input: { orderId, ...patch } }) => biz.updateShipment(orderId, patch)),
  setFinalAmount: adminProcedure.input(z.object({ orderId: id, cents })).mutation(({ input }) =>
    guarded(() => {
      const order = listAllValidatedOrders().find((o) => o.id === input.orderId);
      if (!order) throw new Error("Pedido no encontrado.");
      biz.setFinalAmount(order, input.cents);
    }),
  ),

  listSuppliers: adminProcedure.query(() => biz.listSuppliers()),
  saveSupplier: adminProcedure
    .input(z.object({ id: id.optional(), name: text(120).min(2, "Escribe el nombre del proveedor"), contact: text(120), phone: text(40), email: text(160), taxId: text(30), notes: text(600) }))
    .mutation(({ input }) => biz.saveSupplier(input)),
  deleteSupplier: adminProcedure.input(z.object({ id })).mutation(({ input }) => guarded(() => biz.deleteSupplier(input.id))),

  listPurchases: adminProcedure.query(() => biz.listPurchases()),
  savePurchase: adminProcedure
    .input(
      z.object({
        id: id.optional(),
        supplierId: id,
        lines: z.array(z.object({ productId: id.optional(), description: text(240).min(1), qty: quantity, unitCostCents: cents })).min(1, "Añade al menos una línea").max(200),
        expectedAt: dateText,
        invoiceRef: text(60),
        notes: text(600),
      }),
    )
    .mutation(({ input }) => guarded(() => biz.savePurchase(input))),
  receivePurchase: adminProcedure.input(z.object({ id })).mutation(({ input }) => guarded(() => biz.receivePurchase(input.id))),
  updatePurchase: adminProcedure
    .input(z.object({ id, paid: z.boolean().optional(), status: z.enum(["draft", "ordered", "cancelled"]).optional() }))
    .mutation(({ input: { id: purchaseId, ...patch } }) => guarded(() => biz.updatePurchaseFlags(purchaseId, patch))),

  listLeads: adminProcedure.query(() => biz.listLeads()),
  saveLead: adminProcedure
    .input(
      z.object({
        id: id.optional(),
        name: text(120).min(2, "Escribe el nombre"),
        phone: text(40),
        email: text(160),
        source: text(60),
        interest: text(200),
        stage: z.enum(["new", "contacted", "quoted", "won", "lost"]),
        valueCents: cents,
        notes: text(1000),
        nextActionAt: dateText,
      }),
    )
    .mutation(({ input }) => biz.saveLead(input)),
  deleteLead: adminProcedure.input(z.object({ id })).mutation(({ input }) => biz.deleteLead(input.id)),

  listQuotes: adminProcedure.query(() => biz.listQuotes()),
  saveQuote: adminProcedure
    .input(
      z.object({
        id: id.optional(),
        customerName: text(160).min(2, "Escribe el cliente"),
        phone: text(40),
        email: text(160),
        taxId: text(30),
        address: text(240),
        lines: docLines,
        status: z.enum(["draft", "sent", "accepted", "rejected"]),
        validUntil: dateText,
        notes: text(800),
        leadId: id.optional(),
      }),
    )
    .mutation(({ input }) => biz.saveQuote(input)),
  deleteQuote: adminProcedure.input(z.object({ id })).mutation(({ input }) => biz.deleteQuote(input.id)),

  listInvoices: adminProcedure.query(() => biz.listInvoices()),
  createInvoice: adminProcedure
    .input(
      z.object({
        customerName: text(160).min(2, "Escribe el cliente"),
        taxId: text(30),
        address: text(240),
        email: text(160),
        lines: docLines,
        method: text(40),
        notes: text(800),
        orderId: id.optional(),
        quoteId: id.optional(),
      }),
    )
    .mutation(({ input }) => biz.createInvoice(input)),
  setInvoiceStatus: adminProcedure.input(z.object({ id, status: z.enum(["issued", "paid", "void"]) })).mutation(({ input }) => guarded(() => biz.setInvoiceStatus(input.id, input.status))),

  listExpenses: adminProcedure.query(() => biz.listExpenses()),
  saveExpense: adminProcedure
    .input(z.object({ id: id.optional(), date: dateText.min(8, "Indica la fecha"), category: text(60).min(2), description: text(200).min(2, "Describe el gasto"), amountCents: cents, paid: z.boolean() }))
    .mutation(({ input }) => biz.saveExpense(input)),
  deleteExpense: adminProcedure.input(z.object({ id })).mutation(({ input }) => biz.deleteExpense(input.id)),
});
