import {
  ALL_AVAILABLE_ITEMS,
  menuItems,
  parsePriceEuros,
  type MenuItem,
} from "../../../shared/catalog";

export const CART_STORAGE_KEY = "cbg-cart-v2";
export const LANG_STORAGE_KEY = "cbg-lang";
export const HAM_PREF_STORAGE_KEY = "cbg-ham-pref";

/**
 * Restores a persisted cart defensively: corrupted JSON, unknown IDs and
 * non-positive quantities are dropped and quantities are clamped to 99.
 */
export function sanitizeStoredCart(
  raw: unknown,
  validIds: Set<string> = new Set(menuItems.map((m) => m.id)),
): Record<string, number> {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, number> = {};
    for (const [id, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (!validIds.has(id)) continue;
      const num = typeof val === "number" ? Math.floor(val) : Number.parseInt(String(val), 10);
      if (!Number.isFinite(num) || num <= 0) continue;
      clean[id] = Math.min(99, num);
    }
    return clean;
  } catch {
    return {};
  }
}

export function readStoredCart(): Record<string, number> {
  try {
    return sanitizeStoredCart(
      window.localStorage.getItem(CART_STORAGE_KEY),
      new Set(ALL_AVAILABLE_ITEMS.map((m) => m.id)),
    );
  } catch {
    return {};
  }
}

export function writeStoredCart(cart: Record<string, number>) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable (private mode) */
  }
}

/** Items sold by weight or "Consultar" are confirmed by the shop, so they don't add to the fixed subtotal. */
export function isVariablePrice(item: MenuItem): boolean {
  return parsePriceEuros(item.price) === null || item.price.includes("/ kg");
}

export function cartTotals(lines: { item: MenuItem; qty: number }[]) {
  let fixed = 0;
  let hasVariable = false;
  let count = 0;
  for (const { item, qty } of lines) {
    count += qty;
    if (isVariablePrice(item)) {
      hasVariable = true;
      continue;
    }
    fixed += (parsePriceEuros(item.price) ?? 0) * qty;
  }
  return { fixed, hasVariable, count };
}
