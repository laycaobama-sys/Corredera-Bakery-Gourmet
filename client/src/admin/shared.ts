import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SiteSettings } from "../../../shared/siteSettingsSchema";
import { errorMessage } from "./ui";

export type OrderStatus =
  | "pending_whatsapp_confirmation"
  | "contacted"
  | "confirmed"
  | "preparing"
  | "completed"
  | "cancelled";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "warning" | "info" | "accent" | "violet" | "success" | "neutral" }> = {
  pending_whatsapp_confirmation: { label: "Pendiente", tone: "warning" },
  contacted: { label: "Contactado", tone: "info" },
  confirmed: { label: "Confirmado", tone: "accent" },
  preparing: { label: "En preparación", tone: "violet" },
  completed: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "neutral" },
};

export const ORDER_STATUS_ORDER = Object.keys(ORDER_STATUS) as OrderStatus[];

export const MODALITY_LABEL: Record<string, string> = {
  pickup: "Recogida en tienda",
  delivery: "Envío a domicilio",
  reservation: "Reserva",
  event: "Evento / empresa",
};

export function waLink(phone: string | undefined, text = "") {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 6) return null;
  const full = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Strips the management metadata the API adds to the stored settings. */
function pureSettings(s: SiteSettings & { version?: number; updatedAt?: string; updatedBy?: string }): SiteSettings {
  const { version: _v, updatedAt: _u, updatedBy: _b, ...rest } = s;
  return rest as SiteSettings;
}

/**
 * Loads the CMS settings into an editable draft. Every section edits its part of the draft
 * and saves the whole document, which the server validates and versions.
 */
export function useSettingsDraft() {
  const utils = trpc.useUtils();
  const query = trpc.admin.getSiteSettings.useQuery(undefined, { refetchOnWindowFocus: false });
  const save = trpc.admin.updateSiteSettings.useMutation();
  const [draft, setDraft] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (query.data && !draft) setDraft(pureSettings(query.data));
  }, [query.data, draft]);

  const original = useMemo(() => (query.data ? JSON.stringify(pureSettings(query.data)) : ""), [query.data]);
  const dirty = Boolean(draft) && JSON.stringify(draft) !== original;

  const update = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }, []);

  const patch = useCallback(<K extends keyof SiteSettings>(key: K, partial: Partial<SiteSettings[K]>) => {
    setDraft((d) => (d ? { ...d, [key]: { ...(d[key] as object), ...partial } as SiteSettings[K] } : d));
  }, []);

  const commit = useCallback(async () => {
    if (!draft) return;
    try {
      const saved = await save.mutateAsync(draft);
      setDraft(pureSettings(saved as SiteSettings));
      await Promise.all([
        utils.admin.getSiteSettings.invalidate(),
        utils.catalog.siteSettings.invalidate(),
        utils.admin.listSiteSettingsHistory.invalidate(),
      ]);
      toast.success("Cambios publicados en la web");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [draft, save, utils]);

  const discard = useCallback(() => {
    if (query.data) setDraft(pureSettings(query.data));
  }, [query.data]);

  return { draft, update, patch, dirty, commit, discard, saving: save.isPending, loading: query.isLoading };
}
