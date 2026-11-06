import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  formatEuros,
  formatPrice,
  menuItems,
  parsePriceEuros,
  SHIPPING_NOTICE_EN,
  SHIPPING_NOTICE_ES,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  type Lang,
  type OrderModality,
} from "../shared/catalog";
import { orders, type InsertOrder } from "../drizzle/schema";
import { checkOrderRateLimit, hashClientIp } from "./adminAuth";
import {
  classifyReferrer,
  recordAnalyticsEvent,
  recordValidatedOrderOnDisk,
} from "./analyticsRepository";
import { listCatalogProducts } from "./catalogRepository";
import { getDb } from "./db";
import { getSiteSettings } from "./siteSettingsRepository";
import { publicProcedure, router } from "./_core/trpc";

function sanitizeUserField(raw: string): string {
  return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const safeUserTextSchema = (maxLen: number, fieldName: string) =>
  z
    .string()
    .max(maxLen, `${fieldName} no puede superar ${maxLen} caracteres`)
    .transform(sanitizeUserField)
    .refine(
      (v) => !/[<>]/.test(v),
      `No se permiten etiquetas HTML (< o >) en ${fieldName}`
    )
    .optional()
    .default("");

const orderInputSchema = z.object({
  items: z
    .array(
      z.object({
        id: z
          .string()
          .trim()
          .min(1, "ID de producto requerido")
          .max(64, "ID de producto demasiado largo")
          .regex(/^[a-zA-Z0-9_-]+$/, "Formato de ID de producto inválido"),
        qty: z
          .number()
          .int()
          .min(1, "La cantidad mínima es 1")
          .max(100, "La cantidad máxima es 100"),
      })
    )
    .min(1, "El pedido debe incluir al menos un producto")
    .max(60, "El pedido no puede superar 60 líneas distintas"),
  modality: z.enum(["pickup", "delivery", "reservation", "event"] as const),
  customerName: safeUserTextSchema(100, "el nombre"),
  customerPhone: safeUserTextSchema(60, "el teléfono"),
  deliveryAddress: safeUserTextSchema(220, "la dirección de entrega"),
  hamCuttingPreference: z
    .enum(["whole_piece", "free_sliced_vacuum"] as const)
    .optional(),
  desiredTime: safeUserTextSchema(100, "la fecha/hora"),
  notes: safeUserTextSchema(500, "las notas"),
  privacyAccepted: z.boolean().optional().default(true),
  lang: z.enum(["es", "en"] as const).default("es"),
});

export const orderRouter = router({
  diagnostics: publicProcedure.query(async () => {
    const db = await getDb();
    const activeCatalog = await listCatalogProducts({ includeInactive: false });
    const settings = getSiteSettings();
    return {
      databaseConfigured: Boolean(db),
      officialWhatsAppNumber: settings.contact.whatsappDisplay || WHATSAPP_DISPLAY,
      officialWhatsAppDigits: settings.contact.whatsappNumber || WHATSAPP_NUMBER,
      whatsappOrdersEnabled: settings.contact.whatsappOrdersEnabled,
      homeDeliveryEnabled: settings.contact.homeDeliveryEnabled !== false,
      catalogItemsCount: activeCatalog.length,
      persistenceStorage: Boolean(db)
        ? "mysql_database_ready"
        : "unconfigured_database_url",
      diskPersistenceActive: true,
    };
  }),

  recordEvent: publicProcedure
    .input(
      z.object({
        eventType: z.enum([
          "pageview",
          "page_time",
          "product_view",
          "mode_bakery",
          "mode_gourmet",
          "cart_add",
          "whatsapp_click",
          "phone_click",
          "maps_click",
          "order_validated",
        ] as const),
        device: z.enum(["mobile", "tablet", "desktop"] as const).optional(),
        lang: z.enum(["es", "en"] as const).optional(),
        productId: z.string().trim().max(64).optional(),
        productName: z.string().trim().max(120).optional(),
        path: z.string().trim().max(200).optional(),
        referrer: z.string().trim().max(300).optional(),
        seconds: z.number().min(0).max(86400).optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const ipHash = hashClientIp(ctx.req?.ip ? String(ctx.req.ip) : "local");
      const ownHost = typeof ctx.req?.headers?.host === "string" ? ctx.req.headers.host.split(":")[0] : undefined;
      return recordAnalyticsEvent({
        eventType: input.eventType,
        device: input.device,
        lang: input.lang,
        productId: input.productId,
        productName: input.productName,
        clientIdentifier: ipHash,
        path: input.path,
        // Only the landing pageview carries a referrer, so each visit counts once per source.
        source: input.referrer !== undefined ? classifyReferrer(input.referrer, ownHost) : undefined,
        seconds: input.seconds,
      });
    }),

  validateAndPrepareOrder: publicProcedure
    .input(orderInputSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        items: rawItems,
        modality,
        customerName,
        customerPhone,
        deliveryAddress,
        hamCuttingPreference,
        desiredTime,
        notes,
        privacyAccepted,
        lang,
      } = input;

      if (!privacyAccepted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            lang === "es"
              ? "Debes aceptar la Política de Privacidad y las Condiciones de Encargo para enviar tu solicitud."
              : "You must accept the Privacy Policy and Order Terms before submitting your request.",
        });
      }

      const ipHash = hashClientIp(ctx.req?.ip ? String(ctx.req.ip) : "local");
      const rateLimit = checkOrderRateLimit(ipHash);
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            lang === "es"
              ? `Has enviado demasiadas solicitudes seguidas. Espera ${rateLimit.retryAfterSeconds} segundos.`
              : `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
        });
      }

      const settings = getSiteSettings();
      if (!settings.contact.whatsappOrdersEnabled) {
        const customNotice =
          lang === "es"
            ? settings.contact.pauseOrdersNoticeEs
            : settings.contact.pauseOrdersNoticeEn;
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            customNotice ||
            (lang === "es"
              ? "La recepción de encargos online está temporalmente pausada por el establecimiento."
              : "Online pre-orders are temporarily paused by the establishment."),
        });
      }

      if (modality === "delivery" && settings.contact.homeDeliveryEnabled === false) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            lang === "es"
              ? "La opción de entrega a domicilio está temporalmente desactivada. Puedes seleccionar recogida en el establecimiento."
              : "Home delivery is temporarily disabled. Please select in-store pickup.",
        });
      }

      const activeCatalog = await listCatalogProducts({ includeInactive: false });
      const fullLookupPool = activeCatalog;

      // 1. Group and deduplicate item IDs
      const groupedQty = new Map<string, number>();
      for (const item of rawItems) {
        groupedQty.set(item.id, (groupedQty.get(item.id) || 0) + item.qty);
      }

      // 2. Validate all products against the official active catalog
      const validatedItems: { item: (typeof menuItems)[number]; qty: number }[] = [];
      let authoritativeNumericTotal = 0;
      let hasVariableOrConsultItems = false;
      let hasWholeHam = false;

      for (const [id, qty] of groupedQty.entries()) {
        const found = fullLookupPool.find((m) => m.id === id);
        if (!found) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              lang === "es"
                ? `El artículo con referencia «${id}» no existe en la carta de Corredera o no está disponible.`
                : `Item with reference '${id}' does not exist in Corredera's menu or is unavailable.`,
          });
        }

        if (found.freeCuttingService) {
          hasWholeHam = true;
        }

        const unit = parsePriceEuros(found.price);
        if (unit !== null && !found.price.includes("/ kg")) {
          authoritativeNumericTotal += unit * qty;
        } else {
          hasVariableOrConsultItems = true;
        }

        validatedItems.push({ item: found, qty });
      }

      const modalityLabels: Record<OrderModality, { es: string; en: string }> = {
        pickup: {
          es: "Recogida en local (Calle de la Puebla, 15)",
          en: "In-store pickup (Calle de la Puebla, 15)",
        },
        delivery: {
          es: "Entrega a domicilio (gastos de envío aparte, a confirmar por el establecimiento)",
          en: "Home delivery (shipping fee calculated and confirmed separately)",
        },
        reservation: {
          es: "Reserva de mesa / barra de degustación",
          en: "Table / tasting bar reservation",
        },
        event: {
          es: "Encargo para evento / empresa / regalo",
          en: "Corporate / event / gift order",
        },
      };

      // 3. Build verified, authoritative WhatsApp message
      const lines = validatedItems.map(({ item, qty }) => {
        const unit = parsePriceEuros(item.price);
        const title = lang === "es" ? item.name : item.nameEn;
        if (unit !== null && !item.price.includes("/ kg")) {
          return `• ${qty}x ${title} (${formatPrice(item.price, lang)}) = ${formatEuros(unit * qty, lang)}`;
        }
        return `• ${qty}x ${title} (${formatPrice(item.price, lang)})`;
      });

      const header =
        lang === "es"
          ? "Hola Corredera Bakery & Gourmet, quiero realizar el siguiente pedido/reserva:"
          : "Hello Corredera Bakery & Gourmet, I would like to place the following order/reservation:";

      const orderCode = `CORR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const cuttingPreferenceLine =
        hasWholeHam && hamCuttingPreference
          ? hamCuttingPreference === "free_sliced_vacuum"
            ? lang === "es"
              ? "Servicio pieza de jamón: Cortado y envasado al vacío gratuito"
              : "Whole ham service: Complimentary hand-slicing & vacuum packing"
            : lang === "es"
              ? "Servicio pieza de jamón: Pieza entera sin empezar"
              : "Whole ham service: Whole uncut piece"
          : "";

      const shippingNoticeLine =
        modality === "delivery"
          ? lang === "es"
            ? `🚚 Envío a domicilio: ${settings.contact.shippingNoticeEs || SHIPPING_NOTICE_ES}`
            : `🚚 Home delivery: ${settings.contact.shippingNoticeEn || SHIPPING_NOTICE_EN}`
          : "";

      const messageParts = [
        header,
        `Ref. Web: ${orderCode}`,
        "",
        ...lines,
        "",
        authoritativeNumericTotal > 0
          ? lang === "es"
            ? `Importe estimado (carta): ${formatEuros(authoritativeNumericTotal, lang)}${hasVariableOrConsultItems ? " (+ artículos al peso/consultar)" : ""}`
            : `Estimated subtotal (menu): ${formatEuros(authoritativeNumericTotal, lang)}${hasVariableOrConsultItems ? " (+ by-weight/inquire items)" : ""}`
          : hasVariableOrConsultItems
            ? lang === "es"
              ? "Importe: Pendiente de confirmar peso / artículos al corte por WhatsApp"
              : "Subtotal: Pending weight confirmation via WhatsApp"
            : "",
        `${lang === "es" ? "Modalidad" : "Service"}: ${modalityLabels[modality][lang]}`,
        cuttingPreferenceLine,
        customerName ? `${lang === "es" ? "Nombre" : "Name"}: ${customerName}` : "",
        customerPhone ? `${lang === "es" ? "Teléfono" : "Phone"}: ${customerPhone}` : "",
        deliveryAddress
          ? `${lang === "es" ? "Dirección de entrega" : "Delivery address"}: ${deliveryAddress}`
          : "",
        desiredTime ? `${lang === "es" ? "Fecha / Hora" : "Date / Time"}: ${desiredTime}` : "",
        notes ? `${lang === "es" ? "Notas" : "Notes"}: ${notes}` : "",
        shippingNoticeLine,
        "",
        lang === "es"
          ? "Pedido pendiente de confirmación oficial por el establecimiento."
          : "Order pending official confirmation by the establishment.",
      ].filter(Boolean);

      const formattedMessage = messageParts.join("\n");
      const activeWaDigits = settings.contact.whatsappNumber || WHATSAPP_NUMBER;
      const activeWaDisplay = settings.contact.whatsappDisplay || WHATSAPP_DISPLAY;
      const targetWhatsappUrl = `https://wa.me/${activeWaDigits}?text=${encodeURIComponent(formattedMessage)}`;

      // 4. Persistence Handling (MySQL + Durable Disk Store replica)
      let isPersisted = false;
      let persistenceNote = "DATABASE_URL_NOT_CONFIGURED";
      let diskOrderId: string | null = null;

      try {
        const savedDisk = recordValidatedOrderOnDisk({
          customerName: customerName || "Cliente Web",
          customerPhone: customerPhone || "",
          modality,
          deliveryAddress: deliveryAddress || null,
          desiredTime: desiredTime || null,
          customerNotes: notes || null,
          hasVariableItems: hasVariableOrConsultItems,
          hamCuttingPreference: hasWholeHam ? (hamCuttingPreference ?? null) : null,
          deliveryNotes: [
            modality === "delivery" && deliveryAddress ? `Entrega: ${deliveryAddress}` : "",
            cuttingPreferenceLine,
            desiredTime ? `Fecha/Hora: ${desiredTime}` : "",
            notes || "",
          ]
            .filter(Boolean)
            .join(" · ") || null,
          items: validatedItems.map(({ item, qty }) => {
            const unit = parsePriceEuros(item.price);
            const subtotalCents =
              unit !== null && !item.price.includes("/ kg")
                ? Math.round(unit * qty * 100)
                : 0;
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: qty,
              subtotalCents,
            };
          }),
          totalItemsCount: validatedItems.reduce((acc, v) => acc + v.qty, 0),
          totalAmountCents: Math.round(authoritativeNumericTotal * 100),
          totalFormatted:
            authoritativeNumericTotal > 0
              ? formatEuros(authoritativeNumericTotal, "es")
              : "Al peso / Consultar",
          clientIpHash: ipHash,
        });
        diskOrderId = savedDisk.id;
      } catch (diskErr) {
        console.warn("[Orders] Could not persist order to disk store:", diskErr);
      }

      try {
        const db = await getDb();
        if (db) {
          const insertPayload: InsertOrder = {
            orderCode,
            status: "pending_whatsapp_confirmation",
            modality,
            customerName: customerName || null,
            desiredTime: desiredTime || null,
            notes:
              [
                customerPhone ? `Tel: ${customerPhone}` : "",
                deliveryAddress ? `Dirección: ${deliveryAddress}` : "",
                cuttingPreferenceLine,
                notes || "",
              ]
                .filter(Boolean)
                .join(" | ") || null,
            itemsCount: validatedItems.reduce((acc, v) => acc + v.qty, 0),
            itemsJson: JSON.stringify(
              validatedItems.map(({ item, qty }) => ({
                id: item.id,
                name: item.name,
                nameEn: item.nameEn,
                qty,
                price: item.price,
                mode: item.mode,
                category: item.category,
              }))
            ),
            estimatedTotal:
              authoritativeNumericTotal > 0
                ? formatEuros(authoritativeNumericTotal, "es")
                : "Al peso / Consultar",
            hasVariableItems: hasVariableOrConsultItems ? 1 : 0,
            whatsappMessage: formattedMessage,
            clientIpHash: ipHash,
          };

          await db.insert(orders).values(insertPayload);
          isPersisted = true;
          persistenceNote = "STORED_IN_MYSQL_DATABASE";
        }
      } catch (dbError) {
        console.warn("[Orders] Could not persist to database:", dbError);
        persistenceNote = "DATABASE_WRITE_ERROR";
      }

      return {
        success: true,
        orderCode,
        modality,
        persisted: isPersisted,
        persistenceStatus: persistenceNote,
        diskPersisted: Boolean(diskOrderId),
        diskOrderId,
        itemCount: validatedItems.reduce((acc, v) => acc + v.qty, 0),
        distinctItemsCount: validatedItems.length,
        authoritativeNumericTotal,
        authoritativeTotalFormatted: formatEuros(authoritativeNumericTotal, lang),
        hasVariableOrConsultItems,
        shippingNotice:
          modality === "delivery"
            ? lang === "es"
              ? settings.contact.shippingNoticeEs || SHIPPING_NOTICE_ES
              : settings.contact.shippingNoticeEn || SHIPPING_NOTICE_EN
            : null,
        whatsappMessage: formattedMessage,
        whatsappUrl: targetWhatsappUrl,
        whatsappDisplay: activeWaDisplay,
        disclaimer:
          modality === "delivery"
            ? lang === "es"
              ? "Solicitud verificada. Recuerda que el coste del envío a domicilio se calcula aparte y se confirma por WhatsApp antes de finalizar el pedido."
              : "Request verified. Home delivery shipping costs are calculated separately and confirmed via WhatsApp before finalizing."
            : lang === "es"
              ? "Tu selección ha sido verificada contra la carta oficial. Para confirmar la preparación y recogida, pulsa para abrir WhatsApp."
              : "Your selection has been verified against our official menu. Tap to open WhatsApp and confirm preparation and pickup.",
      };
    }),
});
