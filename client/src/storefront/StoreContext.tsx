import { trpc } from "@/lib/trpc";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MARKET_DEPARTMENT_ITEMS,
  menuItems as fallbackMenuItems,
  type HamCuttingPreference,
  type Lang,
  type MenuItem,
} from "../../../shared/catalog";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "../../../shared/siteSettingsSchema";
import type { LegalTabId } from "../components/LegalPrivacyModal";
import {
  HAM_PREF_STORAGE_KEY,
  LANG_STORAGE_KEY,
  readStoredCart,
  writeStoredCart,
} from "./cart";

type AnalyticsEvent =
  | "pageview"
  | "product_view"
  | "cart_add"
  | "whatsapp_click"
  | "phone_click"
  | "maps_click"
  | "order_validated";

type TrackExtra = { path?: string; referrer?: string };

type StoreContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  items: MenuItem[];
  itemById: Map<string, MenuItem>;
  /** False only while the live catalog is still on its way (static build without embedded data). */
  catalogReady: boolean;
  settings: SiteSettings;
  cart: Record<string, number>;
  cartLines: { item: MenuItem; qty: number }[];
  cartCount: number;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  hamPref: HamCuttingPreference;
  setHamPref: (pref: HamCuttingPreference) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  openLegal: (tab: LegalTabId) => void;
  legalTab: LegalTabId | null;
  closeLegal: () => void;
  track: (eventType: AnalyticsEvent, item?: MenuItem, extra?: TrackExtra) => void;
  whatsappHref: (message: string) => string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

/** Live catalog and CMS settings the server embeds in the HTML (absent on the static fallback build). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- shapes are the API's own responses
const BOOT: { at: number; catalog: any; settings: any } | null = (() => {
  try {
    const el = document.getElementById("cbg-boot");
    return el?.textContent ? JSON.parse(el.textContent) : null;
  } catch {
    return null;
  }
})();

function initialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "es") return fromUrl;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* storage unavailable */
  }
  return "es";
}

function deviceClass(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 720) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [cart, setCart] = useState<Record<string, number>>(readStoredCart);
  const [hamPref, setHamPrefState] = useState<HamCuttingPreference>(() => {
    try {
      return window.localStorage.getItem(HAM_PREF_STORAGE_KEY) === "whole_piece"
        ? "whole_piece"
        : "free_sliced_vacuum";
    } catch {
      return "free_sliced_vacuum";
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTabId | null>(null);

  // The page arrives with the live catalog and settings embedded, so nothing waits on the API.
  // Changes published from the admin panel reach open pages within two minutes (and on returning to the tab).
  const liveQuery = {
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    initialDataUpdatedAt: BOOT?.at,
  } as const;
  const catalogQuery = trpc.catalog.listPublic.useQuery(undefined, { ...liveQuery, initialData: BOOT?.catalog });
  const settingsQuery = trpc.catalog.siteSettings.useQuery(undefined, { ...liveQuery, initialData: BOOT?.settings });
  const recordEvent = trpc.order.recordEvent.useMutation();

  const items = useMemo<MenuItem[]>(() => {
    const base = catalogQuery.data && catalogQuery.data.length > 0 ? catalogQuery.data : fallbackMenuItems;
    const ids = new Set(base.map((i) => i.id));
    return [...base, ...MARKET_DEPARTMENT_ITEMS.filter((i) => !ids.has(i.id))];
  }, [catalogQuery.data]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const settings = settingsQuery.data ?? DEFAULT_SITE_SETTINGS;

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  useEffect(() => {
    writeStoredCart(cart);
  }, [cart]);

  // Drop cart lines whose product was deactivated in the admin panel.
  useEffect(() => {
    if (!catalogQuery.data) return;
    setCart((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => itemById.has(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [catalogQuery.data, itemById]);

  const track = useCallback(
    (eventType: AnalyticsEvent, item?: MenuItem, extra?: TrackExtra) => {
      recordEvent.mutate(
        {
          eventType,
          device: deviceClass(),
          lang,
          productId: item?.id,
          productName: item?.name.slice(0, 120),
          path: extra?.path ?? window.location.pathname,
          referrer: extra?.referrer,
        },
        { onError: () => undefined },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  const addToCart = useCallback(
    (id: string, qty = 1) => {
      setCart((prev) => ({ ...prev, [id]: Math.min(99, (prev[id] ?? 0) + qty) }));
      const item = itemById.get(id);
      if (item) track("cart_add", item);
    },
    [itemById, track],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: Math.min(99, qty) };
    });
  }, []);

  const removeFromCart = useCallback((id: string) => setQty(id, 0), [setQty]);
  const clearCart = useCallback(() => setCart({}), []);

  const setHamPref = useCallback((pref: HamCuttingPreference) => {
    setHamPrefState(pref);
    try {
      window.localStorage.setItem(HAM_PREF_STORAGE_KEY, pref);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: itemById.get(id), qty }))
        .filter((l): l is { item: MenuItem; qty: number } => Boolean(l.item)),
    [cart, itemById],
  );
  const cartCount = cartLines.reduce((acc, l) => acc + l.qty, 0);

  const whatsappHref = useCallback(
    (message: string) =>
      `https://wa.me/${settings.contact.whatsappNumber}?text=${encodeURIComponent(message)}`,
    [settings.contact.whatsappNumber],
  );

  const value: StoreContextValue = {
    lang,
    setLang: setLangState,
    items,
    itemById,
    catalogReady: catalogQuery.isFetched || catalogQuery.isError || Boolean(BOOT),
    settings,
    cart,
    cartLines,
    cartCount,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    hamPref,
    setHamPref,
    cartOpen,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    openLegal: setLegalTab,
    legalTab,
    closeLegal: () => setLegalTab(null),
    track,
    whatsappHref,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
