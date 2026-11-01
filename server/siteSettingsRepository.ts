import fs from "fs";
import path from "path";
import {
  DEFAULT_SITE_SETTINGS,
  siteSettingsSchema,
  type ManagedSiteSettings,
  type SiteSettings,
} from "../shared/siteSettingsSchema";
import { recordAuditAction } from "./catalogRepository";
import { SERVER_DATA_DIR } from "./_core/paths";

const DEFAULT_DATA_DIR = SERVER_DATA_DIR;
const DEFAULT_SETTINGS_FILE = path.join(DEFAULT_DATA_DIR, "site-settings.json");
const DEFAULT_HISTORY_FILE = path.join(DEFAULT_DATA_DIR, "site-settings-history.json");
const MAX_HISTORY_SNAPSHOTS = 35;

export interface SiteSettingsHistoryEntry {
  version: number;
  updatedAt: string;
  updatedBy: string;
  label: string;
  settings: ManagedSiteSettings;
}

let activeSettingsFilePath = DEFAULT_SETTINGS_FILE;
let activeHistoryFilePath = DEFAULT_HISTORY_FILE;

export function setSiteSettingsFilePathForTests(customPath?: string, customHistoryPath?: string) {
  activeSettingsFilePath = customPath ?? DEFAULT_SETTINGS_FILE;
  activeHistoryFilePath =
    customHistoryPath ??
    (customPath
      ? `${customPath}.history.json`
      : DEFAULT_HISTORY_FILE);
}

function ensureSettingsDir() {
  fs.mkdirSync(path.dirname(activeSettingsFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(activeHistoryFilePath), { recursive: true });
}

function buildDefaultManagedSettings(): ManagedSiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system-default",
  };
}

function writeSettingsAtomic(state: ManagedSiteSettings): void {
  ensureSettingsDir();
  const tempPath = `${activeSettingsFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeSettingsFilePath);
}

function readSettingsHistory(): SiteSettingsHistoryEntry[] {
  ensureSettingsDir();
  if (!fs.existsSync(activeHistoryFilePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(activeHistoryFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendSettingsHistorySnapshot(state: ManagedSiteSettings, label: string): void {
  ensureSettingsDir();
  const history = readSettingsHistory();
  // Avoid duplicating the exact same version number at the top
  const filtered = history.filter((entry) => entry.version !== state.version);
  const nextEntry: SiteSettingsHistoryEntry = {
    version: state.version,
    updatedAt: state.updatedAt,
    updatedBy: state.updatedBy,
    label,
    settings: state,
  };
  const updated = [nextEntry, ...filtered].slice(0, MAX_HISTORY_SNAPSHOTS);
  const tempPath = `${activeHistoryFilePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(updated, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeHistoryFilePath);
}

export function listSiteSettingsHistory(): Array<{
  version: number;
  updatedAt: string;
  updatedBy: string;
  label: string;
  seasonalTitle: string;
  starsCount: number;
  familiesCount: number;
}> {
  const history = readSettingsHistory();
  return history.map((entry) => ({
    version: entry.version,
    updatedAt: entry.updatedAt,
    updatedBy: entry.updatedBy,
    label: entry.label,
    seasonalTitle: entry.settings?.seasonalCampaign?.titleEs ?? "Campaña",
    starsCount: entry.settings?.starsSection?.items?.length ?? 0,
    familiesCount: entry.settings?.familiesSection?.families?.length ?? 0,
  }));
}

export function getSiteSettings(): ManagedSiteSettings {
  ensureSettingsDir();
  if (!fs.existsSync(activeSettingsFilePath)) {
    const initial = buildDefaultManagedSettings();
    writeSettingsAtomic(initial);
    appendSettingsHistorySnapshot(initial, "Versión inicial por defecto");
    return initial;
  }

  try {
    const raw = fs.readFileSync(activeSettingsFilePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ManagedSiteSettings>;
    const validated = siteSettingsSchema.safeParse({
      seasonalCampaign: {
        ...DEFAULT_SITE_SETTINGS.seasonalCampaign,
        ...(parsed.seasonalCampaign ?? {}),
      },
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        ...(parsed.hero ?? {}),
      },
      contact: {
        ...DEFAULT_SITE_SETTINGS.contact,
        ...(parsed.contact ?? {}),
      },
      schedule: {
        ...DEFAULT_SITE_SETTINGS.schedule,
        ...(parsed.schedule ?? {}),
      },
      sections: {
        ...DEFAULT_SITE_SETTINGS.sections,
        ...(parsed.sections ?? {}),
      },
      legal: {
        ...DEFAULT_SITE_SETTINGS.legal,
        ...(parsed.legal ?? {}),
      },
      starsSection: {
        ...DEFAULT_SITE_SETTINGS.starsSection,
        ...(parsed.starsSection ?? {}),
        items:
          Array.isArray(parsed.starsSection?.items) && parsed.starsSection.items.length > 0
            ? parsed.starsSection.items
            : DEFAULT_SITE_SETTINGS.starsSection.items,
      },
      familiesSection: {
        ...DEFAULT_SITE_SETTINGS.familiesSection,
        ...(parsed.familiesSection ?? {}),
        families:
          Array.isArray(parsed.familiesSection?.families) && parsed.familiesSection.families.length > 0
            ? parsed.familiesSection.families
            : DEFAULT_SITE_SETTINGS.familiesSection.families,
        services:
          Array.isArray(parsed.familiesSection?.services) && parsed.familiesSection.services.length > 0
            ? parsed.familiesSection.services
            : DEFAULT_SITE_SETTINGS.familiesSection.services,
      },
      marketDepartments: {
        ...DEFAULT_SITE_SETTINGS.marketDepartments,
        ...(parsed.marketDepartments ?? {}),
      },
      sectionVisibility: {
        ...DEFAULT_SITE_SETTINGS.sectionVisibility,
        ...(parsed.sectionVisibility ?? {}),
      },
      storefront: parsed.storefront ?? DEFAULT_SITE_SETTINGS.storefront,
    });

    if (!validated.success) {
      const fallback = buildDefaultManagedSettings();
      writeSettingsAtomic(fallback);
      return fallback;
    }

    return {
      ...validated.data,
      version: typeof parsed.version === "number" ? parsed.version : 1,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
      updatedBy:
        typeof parsed.updatedBy === "string"
          ? parsed.updatedBy
          : "system-default",
    };
  } catch {
    const fallback = buildDefaultManagedSettings();
    writeSettingsAtomic(fallback);
    return fallback;
  }
}

export async function updateSiteSettings(
  input: SiteSettings,
  actorOpenId: string,
  label = "Guardado en panel CMS"
): Promise<ManagedSiteSettings> {
  const validated = siteSettingsSchema.parse(input);
  const current = getSiteSettings();
  // Always snapshot the previous state before overwriting
  appendSettingsHistorySnapshot(current, `Estado previo a v${current.version + 1}`);

  const nextState: ManagedSiteSettings = {
    ...validated,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actorOpenId,
  };

  writeSettingsAtomic(nextState);
  appendSettingsHistorySnapshot(nextState, label);

  await recordAuditAction(actorOpenId, "UPDATE_SITE_SETTINGS", null, {
    version: nextState.version,
    label,
    seasonalEnabled: nextState.seasonalCampaign.enabled,
    seasonalTitle: nextState.seasonalCampaign.titleEs,
    whatsappDisplay: nextState.contact.whatsappDisplay,
  });

  return nextState;
}

export async function restoreSiteSettingsVersion(
  targetVersion: number,
  actorOpenId: string
): Promise<ManagedSiteSettings> {
  const history = readSettingsHistory();
  const found = history.find((entry) => entry.version === targetVersion);
  if (!found) {
    throw new Error(`No se encontró la versión v${targetVersion} en el historial.`);
  }

  const current = getSiteSettings();
  appendSettingsHistorySnapshot(current, `Snapshot automático antes de restaurar v${targetVersion}`);

  const { version: _oldVer, updatedAt: _oldDate, updatedBy: _oldActor, ...pureSettings } = found.settings;
  const validated = siteSettingsSchema.parse(pureSettings);

  const nextState: ManagedSiteSettings = {
    ...validated,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actorOpenId,
  };

  writeSettingsAtomic(nextState);
  appendSettingsHistorySnapshot(nextState, `Restaurado desde versión v${targetVersion}`);

  await recordAuditAction(actorOpenId, "RESTORE_SITE_SETTINGS_VERSION", null, {
    restoredFromVersion: targetVersion,
    newVersion: nextState.version,
  });

  return nextState;
}

export async function resetSiteSettingsToDefault(
  actorOpenId: string
): Promise<ManagedSiteSettings> {
  const current = getSiteSettings();
  appendSettingsHistorySnapshot(current, `Snapshot previo a restauración de fábrica`);

  const nextState: ManagedSiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actorOpenId,
  };

  writeSettingsAtomic(nextState);
  appendSettingsHistorySnapshot(nextState, "Restauración a valores originales");

  await recordAuditAction(actorOpenId, "RESET_SITE_SETTINGS", null, {
    version: nextState.version,
  });

  return nextState;
}
