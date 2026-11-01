/**
 * Sets or resets the single owner password for /admin (server/data/admin-owner-lock.json).
 * Every existing admin session is closed when the password changes.
 *
 *   pnpm admin:password                 generates a strong password and prints it once
 *   pnpm admin:password "MiClave-Segura-2026"
 */
import crypto from "node:crypto";
import { forceSetOwnerPassword } from "../server/adminAuth";

function generatePassword(): string {
  // Unambiguous characters, grouped for easy typing: xxxx-xxxx-xxxx-xxxx
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(16);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

const provided = process.argv[2];
const password = provided?.trim() || generatePassword();

try {
  const result = forceSetOwnerPassword(password);
  console.log("Clave del panel /admin actualizada.");
  console.log(`Propietario: ${result.ownerName}`);
  if (!provided) console.log(`Nueva clave: ${password}`);
  console.log("Todas las sesiones anteriores del panel se han cerrado.");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
