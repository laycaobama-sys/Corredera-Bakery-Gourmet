import { z } from "zod";
import { categories, type Category, type MenuItem, type Mode } from "./catalog";

export const VALID_BAKERY_CATEGORIES = new Set<Exclude<Category, "todos">>([
  "desayunos",
  "packs",
  "bocadillos",
  "bolleria",
  "tartas",
  "cafeteria",
  "fruteria",
]);

export const VALID_GOURMET_CATEGORIES = new Set<Exclude<Category, "todos">>([
  "jamones_enteros",
  "sobres_jamon",
  "embutidos",
  "sobres_embutidos",
  "ibericos",
  "quesos",
  "aceites",
  "carniceria",
  "fruteria",
  "vinos",
  "bocadillos",
  "raciones",
  "conservas",
  "tablas",
]);

export const ALL_PRODUCT_CATEGORIES = [
  "desayunos",
  "packs",
  "bocadillos",
  "bolleria",
  "tartas",
  "cafeteria",
  "jamones_enteros",
  "sobres_jamon",
  "embutidos",
  "sobres_embutidos",
  "ibericos",
  "quesos",
  "aceites",
  "carniceria",
  "fruteria",
  "vinos",
  "raciones",
  "conservas",
  "tablas",
] as const;

export const PRODUCT_ICONS = [
  "coffee",
  "cake",
  "bag",
  "ham",
  "cheese",
  "wine",
  "sandwich",
] as const;

export type ManagedCatalogProduct = MenuItem & {
  imageUrl: string;
  active: boolean;
  sortOrder: number;
  updatedAt?: string;
  updatedBy?: string | null;
};

export function isCategoryValidForMode(mode: Mode, category: string): boolean {
  if (mode === "bakery") {
    return VALID_BAKERY_CATEGORIES.has(category as Exclude<Category, "todos">);
  }
  return VALID_GOURMET_CATEGORIES.has(category as Exclude<Category, "todos">);
}

export const PRICE_FORMAT_REGEX =
  /^(\+?\d+(?:[.,]\d{1,2})?\s*€(?:\s*\/\s*(?:kg|unidad))?|Consultar)$/;

export const SAFE_IMAGE_URL_REGEX = /^(\/assets\/|\/manus-storage\/|https:\/\/)/;

const baseProductFields = {
  id: z
    .string()
    .trim()
    .min(1, "El ID del producto es obligatorio")
    .max(64, "El ID no puede superar 64 caracteres")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "El ID solo puede contener letras, números, guiones y guiones bajos"
    ),
  mode: z.enum(["bakery", "gourmet"] as const),
  category: z.enum(ALL_PRODUCT_CATEGORIES),
  name: z
    .string()
    .trim()
    .min(2, "El nombre en español debe tener al menos 2 caracteres")
    .max(180, "El nombre no puede superar 180 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML en el nombre"),
  nameEn: z
    .string()
    .trim()
    .min(2, "El nombre en inglés debe tener al menos 2 caracteres")
    .max(180, "El nombre en inglés no puede superar 180 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML en el nombre"),
  desc: z
    .string()
    .trim()
    .min(3, "La descripción en español debe tener al menos 3 caracteres")
    .max(600, "La descripción no puede superar 600 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML en la descripción"),
  descEn: z
    .string()
    .trim()
    .min(3, "La descripción en inglés debe tener al menos 3 caracteres")
    .max(600, "La descripción en inglés no puede superar 600 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML en la descripción"),
  price: z
    .string()
    .trim()
    .regex(
      PRICE_FORMAT_REGEX,
      "Formato de precio inválido. Usa p. ej. '3,90 €', '29,99 € / kg', '2,50 € / unidad', '+2,00 €' o 'Consultar'"
    ),
  badge: z
    .string()
    .trim()
    .max(80, "La etiqueta no puede superar 80 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional()
    .default(""),
  badgeEn: z
    .string()
    .trim()
    .max(80, "La etiqueta en inglés no puede superar 80 caracteres")
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional()
    .default(""),
  unitInfo: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional(),
  unitInfoEn: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional(),
  weightInfo: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional(),
  weightInfoEn: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional(),
  refPricePerKg: z
    .string()
    .trim()
    .max(80)
    .refine((v) => !/[<>]/.test(v), "No se permiten etiquetas HTML")
    .optional(),
  subGroup: z.enum(["por_kilo", "por_unidad"] as const).optional(),
  freeCuttingService: z.boolean().optional(),
  featured: z.boolean().optional(),
  icon: z.enum(PRODUCT_ICONS).default("coffee"),
  imageUrl: z
    .string()
    .trim()
    .min(1, "La referencia de imagen es obligatoria")
    .max(512, "La URL de imagen es demasiado larga")
    .refine(
      (v) =>
        SAFE_IMAGE_URL_REGEX.test(v) &&
        !/javascript:|data:|vbscript:/i.test(v) &&
        !v.includes(".."),
      "La imagen debe ser una ruta local segura (/assets/...) o URL HTTPS verificada"
    ),
  active: z.boolean().default(true),
};

export const productUpsertSchema = z
  .object(baseProductFields)
  .superRefine((data, ctx) => {
    if (!isCategoryValidForMode(data.mode, data.category)) {
      const allowed = categories[data.mode]
        .filter((c) => c.id !== "todos")
        .map((c) => c.id)
        .join(", ");
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: `La categoría '${data.category}' no pertenece a la sección '${data.mode}'. Categorías permitidas: ${allowed}`,
      });
    }
    if ((data.badge && !data.badgeEn) || (!data.badge && data.badgeEn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["badgeEn"],
        message: "Si defines una etiqueta destacada (badge), debes indicarla tanto en español como en inglés",
      });
    }
  });

export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export function isVideoAssetUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm)(\?.*)?$/i.test(url.trim());
}

export const imageUploadSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9._-]+$/, "Nombre de archivo inválido"),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES, {
    error:
      "Formato no permitido. Solo se aceptan imágenes (JPEG, PNG, WebP) o vídeos (MP4, WebM)",
  }),
  base64Data: z
    .string()
    .min(16, "Datos de archivo vacíos")
    .max(22_000_000, "El archivo supera el límite máximo permitido (5 MB fotos / 15 MB vídeos)"),
});
