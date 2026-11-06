import { TRPCError } from "@trpc/server";
import fs from "./_core/dataFs";
import path from "path";
import { z } from "zod";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  imageUploadSchema,
  productUpsertSchema,
  type AllowedMediaMimeType,
} from "../shared/catalogAdminSchema";
import { siteSettingsSchema } from "../shared/siteSettingsSchema";
import {
  ADMIN_COOKIE_NAME,
  changeOwnerPassword,
  checkLoginRateLimit,
  clearFailedLoginAttempts,
  getAdminAuthConfigStatus,
  hashClientIp,
  isWebAdminSetupAllowed,
  isOwnerPasswordInitial,
  recordFailedLoginAttempt,
  setupInitialOwnerPassword,
  signAdminSessionToken,
  verifyAdminAccessToken,
} from "./adminAuth";
import { forgetOrder, syncOrderStatus } from "./businessRepository";
import {
  deleteValidatedOrder,
  getAnalyticsDashboardData,
  listAllValidatedOrders,
  listCustomersFromOrders,
  updateValidatedOrderNote,
  updateValidatedOrderStatus,
} from "./analyticsRepository";
import {
  createCatalogBackupSnapshot,
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogStorageDiagnostics,
  listAdminAuditLogs,
  listCatalogProducts,
  recordAuditAction,
  restoreCatalogFromBackupFile,
  restoreCatalogToCanonicalDefault,
  toggleCatalogProductActive,
  updateCatalogProduct,
} from "./catalogRepository";
import {
  getSiteSettings,
  listSiteSettingsHistory,
  resetSiteSettingsToDefault,
  restoreSiteSettingsVersion,
  updateSiteSettings,
} from "./siteSettingsRepository";
import { getSessionCookieOptions } from "./_core/cookies";
import { DIST_PUBLIC_DIR, PUBLIC_UPLOADS_DIR } from "./_core/paths";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const DEFAULT_UPLOAD_DIR = PUBLIC_UPLOADS_DIR;

let activeUploadDirPath = DEFAULT_UPLOAD_DIR;

export function setAdminUploadDirForTests(dir?: string) {
  activeUploadDirPath = dir ?? DEFAULT_UPLOAD_DIR;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB for photos
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB for MP4 / WebM videos

function verifyMagicBytes(
  buffer: Buffer,
  expectedMime: AllowedMediaMimeType
): boolean {
  if (buffer.length < 12) return false;

  if (expectedMime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (expectedMime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (expectedMime === "image/webp") {
    const riff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const webp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return riff && webp;
  }

  if (expectedMime === "video/mp4") {
    // ISO Base Media file format (MP4) contains 'ftyp' box at offset 4..7
    return (
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    );
  }

  if (expectedMime === "video/webm") {
    // Matroska / WebM EBML header magic bytes: 1A 45 DF A3
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return false;
}

export const adminRouter = router({
  authStatus: publicProcedure.query(async ({ ctx }) => {
    const authConfig = getAdminAuthConfigStatus();
    const storage = await getCatalogStorageDiagnostics();
    return {
      authenticated: Boolean(ctx.user),
      isAdmin: Boolean(ctx.user && ctx.user.role === "admin"),
      user: ctx.user
        ? {
            id: ctx.user.id,
            openId: ctx.user.openId,
            name: ctx.user.name,
            role: ctx.user.role,
            loginMethod: ctx.user.loginMethod,
          }
        : null,
      authConfig: { ...authConfig, webSetupAllowed: isWebAdminSetupAllowed() },
      // Only told to the signed-in owner: reminds them to replace the initial password.
      ownerPasswordIsInitial: Boolean(ctx.user && ctx.user.role === "admin") && isOwnerPasswordInitial(),
      storage,
    };
  }),

  setupFirstAdmin: publicProcedure
    .input(
      z.object({
        token: z
          .string()
          .trim()
          .min(12, "La clave de administrador debe tener al menos 12 caracteres")
          .max(128, "La clave de administrador no puede superar 128 caracteres"),
        actorName: z
          .string()
          .trim()
          .max(80)
          .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
          .optional()
          .default("Propietario Corredera"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!isWebAdminSetupAllowed()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "La configuración del administrador desde la web está desactivada. El propietario fija su clave en el servidor con «pnpm admin:password».",
        });
      }
      const clientIp = ctx.req?.ip ? String(ctx.req.ip) : "local";
      const rateLimit = checkLoginRateLimit(clientIp);
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Demasiados intentos. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`,
        });
      }

      try {
        const created = setupInitialOwnerPassword(input.token, input.actorName);
        const signedJwt = await signAdminSessionToken(created.ownerName);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE_NAME, signedJwt, {
          ...cookieOptions,
          maxAge: 12 * 60 * 60 * 1000, // 12 hours
        });

        await recordAuditAction(
          "owner-admin",
          "ADMIN_INITIAL_SETUP",
          null,
          { ownerName: created.ownerName }
        );

        return {
          success: true as const,
          role: "admin" as const,
          sessionToken: signedJwt,
        };
      } catch (err) {
        recordFailedLoginAttempt(clientIp);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo completar la configuración inicial del administrador.",
        });
      }
    }),

  loginWithToken: publicProcedure
    .input(
      z.object({
        token: z
          .string()
          .min(1, "Introduce la clave de acceso de administrador")
          .max(128, "Clave demasiado larga"),
        actorName: z
          .string()
          .trim()
          .max(80)
          .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
          .optional()
          .default("Propietario Corredera"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clientIp = ctx.req?.ip ? String(ctx.req.ip) : "local";
      const rateLimit = checkLoginRateLimit(clientIp);
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Demasiados intentos fallidos. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`,
        });
      }

      const configStatus = getAdminAuthConfigStatus();
      if (!configStatus.adminTokenConfigured) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "El acceso por token no está activo porque la variable de entorno ADMIN_ACCESS_TOKEN (mínimo 12 caracteres) no está configurada en el servidor.",
        });
      }

      const isValid = verifyAdminAccessToken(input.token);
      if (!isValid) {
        recordFailedLoginAttempt(clientIp);
        await recordAuditAction("anonymous", "ADMIN_LOGIN_FAILED", null, {
          ipHash: hashClientIp(clientIp),
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credencial de administrador inválida.",
        });
      }

      clearFailedLoginAttempts(clientIp);
      const signedJwt = await signAdminSessionToken(
        input.actorName || "Propietario Corredera"
      );

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(ADMIN_COOKIE_NAME, signedJwt, {
        ...cookieOptions,
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      await recordAuditAction(
        "owner-admin",
        "ADMIN_LOGIN_SUCCESS",
        null,
        { actorName: input.actorName || "Propietario Corredera" }
      );

      return {
        success: true as const,
        role: "admin" as const,
        sessionToken: signedJwt,
      };
    }),

  changePassword: adminProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Introduce tu clave actual"),
        newPassword: z
          .string()
          .trim()
          .min(12, "La nueva clave debe tener al menos 12 caracteres")
          .max(128, "La nueva clave no puede superar 128 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updated = changeOwnerPassword(
          input.currentPassword,
          input.newPassword,
          ctx.user.name || "Propietario Corredera"
        );
        const signedJwt = await signAdminSessionToken(updated.ownerName);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE_NAME, signedJwt, {
          ...cookieOptions,
          maxAge: 12 * 60 * 60 * 1000,
        });

        await recordAuditAction(
          ctx.user.openId,
          "ADMIN_PASSWORD_CHANGED",
          null,
          { updatedAt: updated.updatedAt }
        );

        return {
          success: true as const,
          sessionToken: signedJwt,
        };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo actualizar la clave de administrador.",
        });
      }
    }),

  logoutAdmin: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true as const };
  }),

  listAllProducts: adminProcedure.query(async () => {
    return listCatalogProducts({ includeInactive: true });
  }),

  createProduct: adminProcedure
    .input(productUpsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await createCatalogProduct(input, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo crear el producto.",
        });
      }
    }),

  updateProduct: adminProcedure
    .input(productUpsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateCatalogProduct(input, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo actualizar el producto.",
        });
      }
    }),

  toggleProductActive: adminProcedure
    .input(
      z.object({
        id: z.string().trim().min(1).max(64),
        active: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await toggleCatalogProductActive(
          input.id,
          input.active,
          ctx.user.openId
        );
      } catch (err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            err instanceof Error
              ? err.message
              : "Producto no encontrado.",
        });
      }
    }),

  deleteProduct: adminProcedure
    .input(
      z.object({
        id: z.string().trim().min(1).max(64),
        confirmId: z.string().trim().min(1).max(64),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.id !== input.confirmId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "El ID de confirmación no coincide con el producto que deseas eliminar.",
        });
      }
      try {
        return await deleteCatalogProduct(input.id, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo eliminar el producto.",
        });
      }
    }),

  uploadProductImage: adminProcedure
    .input(imageUploadSchema)
    .mutation(async ({ input, ctx }) => {
      const cleanBase64 = input.base64Data.replace(
        /^data:(?:image|video)\/[a-zA-Z0-9.+-]+;base64,/,
        ""
      );

      if (!/^[A-Za-z0-9+/=\r\n]+$/.test(cleanBase64)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La codificación Base64 del archivo no es válida.",
        });
      }

      const buffer = Buffer.from(cleanBase64, "base64");
      if (buffer.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El archivo está vacío.",
        });
      }

      const isVideo =
        input.mimeType === "video/mp4" || input.mimeType === "video/webm";
      const maxAllowedBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

      if (buffer.length > maxAllowedBytes) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: isVideo
            ? "El vídeo supera el tamaño máximo permitido de 15 MB."
            : "La imagen supera el tamaño máximo permitido de 5 MB.",
        });
      }

      if (!verifyMagicBytes(buffer, input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "La firma binaria del archivo no coincide con un formato válido (JPEG, PNG, WebP, MP4 o WebM).",
        });
      }

      const extMap: Record<AllowedMediaMimeType, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
      };
      const ext = extMap[input.mimeType];
      const baseSlug =
        path
          .basename(input.fileName, path.extname(input.fileName))
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40) || "media";

      const uniqueFileName = `${baseSlug}-${Date.now()}${ext}`;
      const resolvedUploadRoot = path.resolve(activeUploadDirPath);
      fs.mkdirSync(resolvedUploadRoot, { recursive: true });
      const targetPath = path.resolve(resolvedUploadRoot, uniqueFileName);

      if (!targetPath.startsWith(resolvedUploadRoot + path.sep)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ruta de destino de archivo inválida.",
        });
      }

      fs.writeFileSync(targetPath, buffer, { mode: 0o644 });

      // If production build folder dist/public exists and we are writing to the default upload directory,
      // mirror the uploaded asset to dist/public/assets/uploads for zero-latency static serving
      if (
        resolvedUploadRoot === path.resolve(PUBLIC_UPLOADS_DIR) &&
        fs.existsSync(DIST_PUBLIC_DIR)
      ) {
        try {
          const distUploadDir = path.join(DIST_PUBLIC_DIR, "assets", "uploads");
          fs.mkdirSync(distUploadDir, { recursive: true });
          fs.writeFileSync(path.join(distUploadDir, uniqueFileName), buffer, {
            mode: 0o644,
          });
        } catch {
          // non-fatal if dist is read-only
        }
      }

      const publicUrl = `/assets/uploads/${uniqueFileName}`;
      await recordAuditAction(
        ctx.user.openId,
        isVideo ? "UPLOAD_PRODUCT_VIDEO" : "UPLOAD_PRODUCT_IMAGE",
        null,
        {
          fileName: uniqueFileName,
          mimeType: input.mimeType,
          sizeBytes: buffer.length,
        }
      );

      return {
        imageUrl: publicUrl,
        fileName: uniqueFileName,
        sizeBytes: buffer.length,
        mimeType: input.mimeType,
        mediaType: isVideo ? ("video" as const) : ("image" as const),
      };
    }),

  getSiteSettings: adminProcedure.query(async () => {
    return getSiteSettings();
  }),

  listSiteSettingsHistory: adminProcedure.query(async () => {
    return listSiteSettingsHistory();
  }),

  updateSiteSettings: adminProcedure
    .input(siteSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateSiteSettings(input, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo actualizar la configuración de la web.",
        });
      }
    }),

  restoreSiteSettingsVersion: adminProcedure
    .input(
      z.object({
        version: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await restoreSiteSettingsVersion(input.version, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo restaurar la versión seleccionada.",
        });
      }
    }),

  resetSiteSettings: adminProcedure
    .input(
      z.object({
        confirmPhrase: z.literal("RESTAURAR_WEB"),
      })
    )
    .mutation(async ({ ctx }) => {
      return resetSiteSettingsToDefault(ctx.user.openId);
    }),

  createBackup: adminProcedure
    .input(
      z
        .object({
          label: z.string().trim().max(32).optional(),
        })
        .optional()
    )
    .mutation(async ({ input, ctx }) => {
      return createCatalogBackupSnapshot(
        ctx.user.openId,
        input?.label || "manual"
      );
    }),

  restoreCatalogBackup: adminProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1).max(200),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await restoreCatalogFromBackupFile(
          input.fileName,
          ctx.user.openId
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo restaurar la copia de seguridad seleccionada.",
        });
      }
    }),

  restoreCanonicalDefaults: adminProcedure
    .input(
      z.object({
        confirmPhrase: z.literal("RESTAURAR_102"),
      })
    )
    .mutation(async ({ ctx }) => {
      return restoreCatalogToCanonicalDefault(ctx.user.openId);
    }),

  getAnalyticsDashboard: adminProcedure.query(async () => {
    return getAnalyticsDashboardData();
  }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string().trim().min(1).max(64),
        status: z.enum([
          "pending_whatsapp_confirmation",
          "contacted",
          "confirmed",
          "preparing",
          "completed",
          "cancelled",
        ] as const),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const order = await updateValidatedOrderStatus(
          input.orderId,
          input.status,
          ctx.user.openId
        );
        syncOrderStatus(order, input.status);
        return order;
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo actualizar el estado del pedido.",
        });
      }
    }),

  listOrders: adminProcedure.query(async () => {
    return listAllValidatedOrders();
  }),

  listCustomers: adminProcedure.query(async () => {
    return listCustomersFromOrders();
  }),

  updateOrderNote: adminProcedure
    .input(
      z.object({
        orderId: z.string().trim().min(1).max(64),
        note: z
          .string()
          .trim()
          .max(1000)
          .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateValidatedOrderNote(input.orderId, input.note, ctx.user.openId);
      } catch (err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: err instanceof Error ? err.message : "No se pudo guardar la nota.",
        });
      }
    }),

  deleteOrder: adminProcedure
    .input(z.object({ orderId: z.string().trim().min(1).max(64) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const deleted = await deleteValidatedOrder(input.orderId, ctx.user.openId);
        forgetOrder(input.orderId);
        return deleted;
      } catch (err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: err instanceof Error ? err.message : "No se pudo eliminar el pedido.",
        });
      }
    }),

  listAuditLogs: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return listAdminAuditLogs(input?.limit ?? 50);
    }),
});
