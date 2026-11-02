import { useEffect } from "react";
import { useLocation } from "wouter";

const SELECTOR = [
  ".cg-heading",
  ".cg-grid > .cg-card",
  ".cg-why__item",
  ".cg-why__media",
  ".cg-feature__card",
  ".cg-depts > .cg-dept",
  ".cg-howto__item",
  ".cg-story__card",
  ".cg-story__media",
  ".cg-bakery",
  ".cg-visit > *",
  ".cg-faq details",
  ".cg-trust__item",
  ".cg-editorial > *",
  ".cg-carta__group",
].join(",");

/**
 * Fades sections in as they approach the viewport. They start animating a screen-fifth before they
 * become visible, so by the time they scroll into view they are already in place and nothing looks late.
 * Content is only hidden once this script runs (the `cg-reveal-ready` class), so crawlers and no-JS
 * visitors always see everything.
 */
export function RevealOnScroll() {
  const [location] = useLocation();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("cg-reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px 20% 0px", threshold: 0 },
    );

    // The body, not <main>: pages load lazily and replace <main> after this effect runs.
    const root = document.body;
    const scan = () => {
      const fold = window.innerHeight * 1.2;
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.dataset.reveal) return;
        el.dataset.reveal = "1";
        // Already on screen: shown at once, without animating.
        if (el.getBoundingClientRect().top < fold) el.classList.add("is-visible", "is-instant");
        else io.observe(el);
      });
    };
    scan();
    // Sections that render after data arrives (catalog, settings) are picked up too.
    let frame = 0;
    const mo = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      mo.disconnect();
    };
  }, [location]);

  return null;
}
