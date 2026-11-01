import {
  getCatalogStorageDiagnostics,
  listCatalogProducts,
} from "./catalogRepository";
import { getSiteSettings } from "./siteSettingsRepository";
import { publicProcedure, router } from "./_core/trpc";

export const catalogRouter = router({
  listPublic: publicProcedure.query(async () => {
    return listCatalogProducts({ includeInactive: false });
  }),

  siteSettings: publicProcedure.query(async () => {
    return getSiteSettings();
  }),

  diagnostics: publicProcedure.query(async () => {
    return getCatalogStorageDiagnostics();
  }),
});
