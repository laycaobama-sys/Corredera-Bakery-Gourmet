import { useEffect } from "react";
import { useStore } from "./StoreContext";

/** Bilingual inline copy: t("Hola", "Hello"). */
export function useT() {
  const { lang } = useStore();
  return (es: string, en: string) => (lang === "en" ? en : es);
}

const DEFAULT_TITLE = "Corredera Gourmet | Jamones ibéricos, embutidos, quesos y aceites en Madrid";

/** Sets document title, description and canonical for client-side routes. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute("href", `https://correderagourmet.com${window.location.pathname}`);
  }, [title, description]);
}

/** Locks body scroll while an overlay (drawer, dialog) is open. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/** Closes an overlay on Escape. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}
