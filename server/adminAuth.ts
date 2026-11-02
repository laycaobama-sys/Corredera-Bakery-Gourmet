import { parse as parseCookieHeader } from "cookie";
import crypto from "crypto";
import type { Request } from "express";
import fs from "./_core/dataFs";
import { jwtVerify, SignJWT } from "jose";
import path from "path";
import type { User } from "../drizzle/schema";
import { SERVER_DATA_DIR } from "./_core/paths";

export const ADMIN_COOKIE_NAME = "corredera_admin_session";
export const ADMIN_STORAGE_HEADER = "x-admin-session";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface FailedAttemptRecord {
  count: number;
  firstFailedAt: number;
}

interface OwnerLockRecord {
  version: number;
  ownerName: string;
  salt: string;
  passwordHash: string;
  jwtSigningSecret: string;
  createdAt: string;
  /** "seed" while the owner still uses the initial password delivered with the code. */
  source?: "seed";
}

const DEFAULT_OWNER_LOCK_PATH = path.join(
  SERVER_DATA_DIR,
  "admin-owner-lock.json"
);

let activeOwnerLockPath = DEFAULT_OWNER_LOCK_PATH;

export function setAdminOwnerLockPathForTests(customPath?: string) {
  activeOwnerLockPath = customPath ?? DEFAULT_OWNER_LOCK_PATH;
}

const failedAttemptsByIp = new Map<string, FailedAttemptRecord>();
const orderSubmissionsByIp = new Map<string, { count: number; windowStart: number }>();
const ORDER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ORDERS_PER_WINDOW = 15;

export function clearRateLimitForTests() {
  failedAttemptsByIp.clear();
  orderSubmissionsByIp.clear();
}

/**
 * Computes an irreversible, truncated SHA-256 pseudonym for client IPs
 * so raw IP addresses (personal data under GDPR/RGPD) are never persisted in logs or DB.
 */
export function hashClientIp(rawIp: string | undefined | null): string {
  const normalized = (rawIp ?? "local").trim() || "local";
  const secretSalt =
    (process.env.MANUS_JWT_SECRET ?? "").trim() || "corredera-rgpd-ip-salt-v1";
  return crypto
    .createHash("sha256")
    .update(`${secretSalt}:${normalized}`)
    .digest("hex")
    .slice(0, 16);
}

export function checkOrderRateLimit(ipHash: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = orderSubmissionsByIp.get(ipHash);
  if (!existing || now - existing.windowStart > ORDER_WINDOW_MS) {
    orderSubmissionsByIp.set(ipHash, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= MAX_ORDERS_PER_WINDOW) {
    const remainingMs = ORDER_WINDOW_MS - (now - existing.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function readOwnerLockFile(): OwnerLockRecord | null {
  if (!fs.existsSync(activeOwnerLockPath)) return null;
  try {
    const raw = fs.readFileSync(activeOwnerLockPath, "utf-8");
    const parsed = JSON.parse(raw) as OwnerLockRecord;
    if (
      parsed &&
      typeof parsed.salt === "string" &&
      typeof parsed.passwordHash === "string" &&
      typeof parsed.jwtSigningSecret === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminAuthConfigStatus() {
  const token = (process.env.ADMIN_ACCESS_TOKEN ?? "").trim();
  const envTokenConfigured = token.length >= 12;
  const ownerLock = readOwnerLockFile();
  const ownerLockConfigured = Boolean(ownerLock);
  const oauthConfigured = Boolean(
    process.env.MANUS_OAUTH_API_URL &&
      process.env.MANUS_PROJECT_ID &&
      process.env.MANUS_JWT_SECRET
  );
  const ownerOpenIdConfigured = Boolean((process.env.OWNER_OPEN_ID ?? "").trim());

  const adminTokenConfigured = envTokenConfigured || ownerLockConfigured;
  const readyForAdminLogin =
    adminTokenConfigured || (oauthConfigured && ownerOpenIdConfigured);

  return {
    adminTokenConfigured,
    envTokenConfigured,
    ownerLockConfigured,
    needsInitialSetup: !readyForAdminLogin,
    adminTokenTooShort: token.length > 0 && token.length < 12,
    oauthConfigured,
    ownerOpenIdConfigured,
    readyForAdminLogin,
  };
}

/**
 * Safely initializes the first administrator password when neither ADMIN_ACCESS_TOKEN
 * nor an existing owner lock file is present. Stores only an scrypt cryptographic hash
 * with a random 32-byte salt on disk (mode 0600).
 */
export function setupInitialOwnerPassword(
  rawPassword: string,
  ownerName = "Propietario Corredera"
): { ownerName: string; createdAt: string } {
  const status = getAdminAuthConfigStatus();
  if (status.adminTokenConfigured) {
    throw new Error(
      "El administrador ya está configurado. Inicia sesión con tu clave actual."
    );
  }

  const cleanPassword = rawPassword.trim();
  if (cleanPassword.length < 12) {
    throw new Error(
      "La clave de administrador debe tener al menos 12 caracteres por seguridad."
    );
  }

  const salt = crypto.randomBytes(32).toString("hex");
  const jwtSigningSecret = crypto.randomBytes(32).toString("hex");
  const derivedKey = crypto.scryptSync(cleanPassword, salt, 64).toString("hex");
  const createdAt = new Date().toISOString();

  const record: OwnerLockRecord = {
    version: 1,
    ownerName: ownerName.trim() || "Propietario Corredera",
    salt,
    passwordHash: derivedKey,
    jwtSigningSecret,
    createdAt,
  };

  fs.mkdirSync(path.dirname(activeOwnerLockPath), { recursive: true });
  const tempPath = `${activeOwnerLockPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeOwnerLockPath);

  return { ownerName: record.ownerName, createdAt };
}

/**
 * Web-based first setup is disabled by default so nobody but the owner can create the
 * admin password. The owner sets it from the server with `pnpm admin:password`.
 */
export function isWebAdminSetupAllowed(): boolean {
  return process.env.NODE_ENV === "test" || process.env.ADMIN_ALLOW_WEB_SETUP === "1";
}

/**
 * Sets (or resets) the single owner password from the server console.
 * Rotating the signing secret invalidates every existing admin session.
 */
export function forceSetOwnerPassword(
  rawPassword: string,
  ownerName = "Propietario Corredera"
): { ownerName: string; updatedAt: string } {
  const cleanPassword = rawPassword.trim();
  if (cleanPassword.length < 12) {
    throw new Error("La clave de administrador debe tener al menos 12 caracteres.");
  }
  const existing = readOwnerLockFile();
  const salt = crypto.randomBytes(32).toString("hex");
  const record: OwnerLockRecord = {
    version: (existing?.version ?? 0) + 1,
    ownerName: ownerName.trim() || "Propietario Corredera",
    salt,
    passwordHash: crypto.scryptSync(cleanPassword, salt, 64).toString("hex"),
    jwtSigningSecret: crypto.randomBytes(32).toString("hex"),
    createdAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(activeOwnerLockPath), { recursive: true });
  const tempPath = `${activeOwnerLockPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tempPath, activeOwnerLockPath);
  return { ownerName: record.ownerName, updatedAt: record.createdAt };
}

/**
 * Installs an owner password delivered as a ready scrypt hash (the plain password never ships in the code).
 * A fresh signing secret is generated, so earlier sessions stop working.
 */
export function installOwnerPasswordHash(salt: string, passwordHash: string, ownerName = "Propietario Corredera") {
  if (!/^[0-9a-f]{64}$/.test(salt) || !/^[0-9a-f]{128}$/.test(passwordHash)) {
    throw new Error("Invalid owner password hash");
  }
  const existing = readOwnerLockFile();
  const record: OwnerLockRecord = {
    version: (existing?.version ?? 0) + 1,
    ownerName,
    salt,
    passwordHash,
    jwtSigningSecret: crypto.randomBytes(32).toString("hex"),
    createdAt: new Date().toISOString(),
    source: "seed",
  };
  fs.mkdirSync(path.dirname(activeOwnerLockPath), { recursive: true });
  const tempPath = `${activeOwnerLockPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tempPath, activeOwnerLockPath);
}

/** True while the owner has not yet replaced the initial password delivered with the code. */
export function isOwnerPasswordInitial(): boolean {
  return readOwnerLockFile()?.source === "seed";
}

/**
 * Allows the authenticated administrator to rotate their password.
 * Verifies the current password in constant time and generates a new scrypt salt,
 * hash, and JWT signing secret (invalidating previous sessions).
 */
export function changeOwnerPassword(
  currentPassword: string,
  newPassword: string,
  ownerName = "Propietario Corredera"
): { ownerName: string; updatedAt: string } {
  const envToken = (process.env.ADMIN_ACCESS_TOKEN ?? "").trim();
  if (envToken.length >= 12) {
    throw new Error(
      "La clave actual está definida por la variable de entorno ADMIN_ACCESS_TOKEN en el servidor. Modifícala en la configuración del entorno."
    );
  }

  if (!verifyAdminAccessToken(currentPassword)) {
    throw new Error("La clave actual introducida no es correcta.");
  }

  const cleanNew = newPassword.trim();
  if (cleanNew.length < 12) {
    throw new Error("La nueva clave debe tener al menos 12 caracteres.");
  }

  const existing = readOwnerLockFile();
  const salt = crypto.randomBytes(32).toString("hex");
  const jwtSigningSecret = crypto.randomBytes(32).toString("hex");
  const derivedKey = crypto.scryptSync(cleanNew, salt, 64).toString("hex");
  const updatedAt = new Date().toISOString();

  const record: OwnerLockRecord = {
    version: (existing?.version ?? 1) + 1,
    ownerName: ownerName.trim() || existing?.ownerName || "Propietario Corredera",
    salt,
    passwordHash: derivedKey,
    jwtSigningSecret,
    createdAt: updatedAt,
  };

  fs.mkdirSync(path.dirname(activeOwnerLockPath), { recursive: true });
  const tempPath = `${activeOwnerLockPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, activeOwnerLockPath);

  return { ownerName: record.ownerName, updatedAt };
}

function getAdminSigningKey(): Uint8Array | null {
  const jwtSecret = (process.env.MANUS_JWT_SECRET ?? "").trim();
  const adminToken = (process.env.ADMIN_ACCESS_TOKEN ?? "").trim();
  const ownerLock = readOwnerLockFile();
  const rawMaterial =
    jwtSecret ||
    (adminToken.length >= 12 ? adminToken : "") ||
    (ownerLock?.jwtSigningSecret ?? "");
  if (!rawMaterial) return null;
  return new Uint8Array(
    crypto.createHash("sha256").update(`corredera-admin:${rawMaterial}`).digest()
  );
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = failedAttemptsByIp.get(ip);
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (now - record.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsByIp.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const remainingMs = LOCKOUT_WINDOW_MS - (now - record.firstFailedAt);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const existing = failedAttemptsByIp.get(ip);
  if (!existing || now - existing.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsByIp.set(ip, { count: 1, firstFailedAt: now });
  } else {
    existing.count += 1;
  }
}

export function clearFailedLoginAttempts(ip: string): void {
  failedAttemptsByIp.delete(ip);
}

/**
 * Constant-time comparison against process.env.ADMIN_ACCESS_TOKEN (if set)
 * or against the scrypt hash in server/data/admin-owner-lock.json.
 */
export function verifyAdminAccessToken(candidate: string): boolean {
  const cleanCandidate = candidate.trim();
  if (!cleanCandidate) return false;

  const configuredEnv = (process.env.ADMIN_ACCESS_TOKEN ?? "").trim();
  if (configuredEnv.length >= 12) {
    const hashA = crypto.createHash("sha256").update(configuredEnv).digest();
    const hashB = crypto.createHash("sha256").update(cleanCandidate).digest();
    const hashesMatch = crypto.timingSafeEqual(hashA, hashB);
    return hashesMatch && configuredEnv.length === cleanCandidate.length;
  }

  const ownerLock = readOwnerLockFile();
  if (ownerLock) {
    try {
      const candidateDerived = crypto.scryptSync(
        cleanCandidate,
        ownerLock.salt,
        64
      );
      const storedDerived = Buffer.from(ownerLock.passwordHash, "hex");
      if (candidateDerived.length !== storedDerived.length) return false;
      return crypto.timingSafeEqual(candidateDerived, storedDerived);
    } catch {
      return false;
    }
  }

  return false;
}

export async function signAdminSessionToken(
  actorName = "Administrador Corredera"
): Promise<string> {
  const key = getAdminSigningKey();
  if (!key) {
    throw new Error(
      "No hay clave de firma configurada (ADMIN_ACCESS_TOKEN o configuración inicial de propietario)"
    );
  }

  const expirationSeconds = Math.floor(
    (Date.now() + ADMIN_SESSION_TTL_MS) / 1000
  );
  return new SignJWT({
    sub: "owner-admin",
    role: "admin",
    name: actorName,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(key);
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<User | null> {
  if (!token) return null;
  const key = getAdminSigningKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return null;
    }

    const now = new Date();
    return {
      id: 1,
      openId: payload.sub,
      name:
        typeof payload.name === "string"
          ? payload.name
          : "Administrador Corredera",
      email: null,
      loginMethod: "admin_token",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
  } catch {
    return null;
  }
}

export async function authenticateAdminFromRequest(
  req: Request
): Promise<User | null> {
  let token: string | undefined;

  if (req.headers.cookie) {
    const parsed = parseCookieHeader(req.headers.cookie);
    token = parsed[ADMIN_COOKIE_NAME];
  }

  if (!token && typeof req.headers[ADMIN_STORAGE_HEADER] === "string") {
    token = req.headers[ADMIN_STORAGE_HEADER];
  }

  return verifyAdminSessionToken(token);
}
