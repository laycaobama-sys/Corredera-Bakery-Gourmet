import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

export function scrollToId(id: string, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "instant" : behavior, block: "start" });
  return true;
}

/** Link to a section of the home page that works from any route. */
export function AnchorLink({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [location, navigate] = useLocation();
  return (
    <a
      href={`/#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        if (location === "/") {
          scrollToId(to);
          window.history.replaceState(null, "", `/#${to}`);
        } else {
          navigate(`/#${to}`);
        }
      }}
    >
      {children}
    </a>
  );
}

/** Internal link that accepts any CMS href: a route ("/tienda") or a home section ("/#visitanos"). */
export function SmartLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (href.startsWith("/#")) {
    return (
      <AnchorLink to={href.slice(2)} className={className}>
        {children}
      </AnchorLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Scrolls to top on route change, or to the hash target when present. */
export function ScrollManager() {
  const [location] = useLocation();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Wait for the route (possibly lazy) to render its sections, then jump without animation.
      let tries = 0;
      let timer: number | undefined;
      const tick = () => {
        if (scrollToId(hash, "instant") || tries++ > 40) return;
        timer = window.setTimeout(tick, 50);
      };
      timer = window.setTimeout(tick, 0);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}
