import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { menuItems } from "../../shared/catalog.ts";
import { buildProductCulinarySvg } from "../../shared/productVisuals.ts";
import { ENV } from "./env.ts";
import { CLIENT_PUBLIC_DIR, DIST_PUBLIC_DIR, PUBLIC_UPLOADS_DIR } from "./paths.ts";

type IllustrationTheme = {
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  badgeColor: string;
  familyTitle: string;
  subtitle: string;
  motif: "bakery" | "ibericos" | "coffee" | "wine" | "basket" | "raciones" | "conservas" | "tablas" | "pastry" | "savory" | "juice";
};

const SPECIFIC_KEY_TO_ITEM_ID: Record<string, string> = {
  "6eZnjIDvyxoWHi3AoS9HXq/image-1": "r1",
  "6eZnjIDvyxoWHi3AoS9HXq/image-2": "t15",
  "6eZnjIDvyxoWHi3AoS9HXq/image-3": "t8",
  "6eZnjIDvyxoWHi3AoS9HXq/image-4": "bo1",
  "6eZnjIDvyxoWHi3AoS9HXq/image-5": "c11",
};

function resolveItemFromKey(safeKey: string) {
  const match = safeKey.match(/corredera-([a-zA-Z0-9]+)\.webp$/);
  if (match) {
    const id = match[1];
    return menuItems.find((item) => item.id === id) ?? null;
  }
  for (const [subKey, itemId] of Object.entries(SPECIFIC_KEY_TO_ITEM_ID)) {
    if (safeKey.includes(subKey)) {
      return menuItems.find((item) => item.id === itemId) ?? null;
    }
  }
  return null;
}

function resolveTheme(safeKey: string): IllustrationTheme {
  if (safeKey.includes("6eZnjIDvyxoWHi3AoS9HXq/image-1") || safeKey.includes("0ph7XQEFnMSHaCSLsIo0WO/image-1")) {
    return {
      bgPrimary: "#2b231d",
      bgSecondary: "#3f3229",
      accent: "#d8ad86",
      badgeColor: "#621b1c",
      familyTitle: "RACIONES FRÍAS & APERITIVO",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "raciones",
    };
  }
  if (safeKey.includes("6eZnjIDvyxoWHi3AoS9HXq/image-2") || safeKey.includes("0ph7XQEFnMSHaCSLsIo0WO/image-3")) {
    return {
      bgPrimary: "#331919",
      bgSecondary: "#4d2525",
      accent: "#e3be9b",
      badgeColor: "#621b1c",
      familyTitle: "TABLAS & QUESOS PARA COMPARTIR",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "tablas",
    };
  }
  if (safeKey.includes("6eZnjIDvyxoWHi3AoS9HXq/image-3")) {
    return {
      bgPrimary: "#2d1f1a",
      bgSecondary: "#463028",
      accent: "#e5c2a7",
      badgeColor: "#8c5332",
      familyTitle: "TARTAS & PASTELERÍA ARTESANA",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "pastry",
    };
  }
  if (safeKey.includes("6eZnjIDvyxoWHi3AoS9HXq/image-4") || safeKey.includes("EujPgDIPcbtATsDhasLWVD/image-1")) {
    return {
      bgPrimary: "#36271e",
      bgSecondary: "#523b2d",
      accent: "#ebd0b7",
      badgeColor: "#9c6137",
      familyTitle: "OBRADOR & BOLLERÍA DE MANTEQUILLA",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "bakery",
    };
  }
  if (safeKey.includes("6eZnjIDvyxoWHi3AoS9HXq/image-5")) {
    return {
      bgPrimary: "#38291b",
      bgSecondary: "#573f28",
      accent: "#f0c987",
      badgeColor: "#b8774c",
      familyTitle: "ZUMO NATURAL & BEBIDAS FRÍAS",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "juice",
    };
  }
  if (safeKey.includes("EujPgDIPcbtATsDhasLWVD/image-2") || safeKey.includes("I1SQQmekuDcC2HuhISg2g8/image-2")) {
    return {
      bgPrimary: "#381819",
      bgSecondary: "#542324",
      accent: "#e2be9d",
      badgeColor: "#621b1c",
      familyTitle: "IBÉRICOS DE BELLOTA & CORTE A CUCHILLO",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "ibericos",
    };
  }
  if (safeKey.includes("EujPgDIPcbtATsDhasLWVD/image-3")) {
    return {
      bgPrimary: "#2f241d",
      bgSecondary: "#47362b",
      accent: "#e5c2a7",
      badgeColor: "#8c5332",
      familyTitle: "CAFÉ DE ESPECIALIDAD & PAUSA DULCE",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "coffee",
    };
  }
  if (safeKey.includes("EujPgDIPcbtATsDhasLWVD/image-4")) {
    return {
      bgPrimary: "#341718",
      bgSecondary: "#4f2224",
      accent: "#deb996",
      badgeColor: "#621b1c",
      familyTitle: "VINOS, VERMUT DE GRIFO & BARRA",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "wine",
    };
  }
  if (safeKey.includes("EujPgDIPcbtATsDhasLWVD/image-5")) {
    return {
      bgPrimary: "#2c221b",
      bgSecondary: "#45352a",
      accent: "#dec0a4",
      badgeColor: "#621b1c",
      familyTitle: "CESTAS GOURMET & REGALOS A MEDIDA",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "basket",
    };
  }
  if (safeKey.includes("0ph7XQEFnMSHaCSLsIo0WO/image-2")) {
    return {
      bgPrimary: "#26281f",
      bgSecondary: "#3a3d2f",
      accent: "#d6c7a1",
      badgeColor: "#535941",
      familyTitle: "GILDAS, ENCURTIDOS & CONSERVAS",
      subtitle: "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA",
      motif: "conservas",
    };
  }
  if (safeKey.includes("0ph7XQEFnMSHaCSLsIo0WO/image-4")) {
    return {
      bgPrimary: "#382820",
      bgSecondary: "#543c30",
      accent: "#ecd0b6",
      badgeColor: "#9c6137",
      familyTitle: "PASTELERÍA, TARTAS & SWEET PACKS",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "pastry",
    };
  }
  if (safeKey.includes("0ph7XQEFnMSHaCSLsIo0WO/image-5") || safeKey.includes("I1SQQmekuDcC2HuhISg2g8/image-1")) {
    return {
      bgPrimary: "#33261e",
      bgSecondary: "#4d392d",
      accent: "#e5c2a7",
      badgeColor: "#8c5332",
      familyTitle: "CAFETERÍA, DESAYUNOS & BOCADILLOS",
      subtitle: "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA",
      motif: "savory",
    };
  }

  return {
    bgPrimary: "#33261e",
    bgSecondary: "#4d392d",
    accent: "#e5c2a7",
    badgeColor: "#621b1c",
    familyTitle: "OBRADOR & DESPENSA GOURMET",
    subtitle: "CORREDERA BAKERY & GOURMET · MADRID",
    motif: "bakery",
  };
}

function renderMotifPaths(motif: IllustrationTheme["motif"], accent: string): string {
  switch (motif) {
    case "bakery":
      return `
        <path d="M265 205c0-28 24-48 55-48s55 20 55 48c0 12-8 22-20 22-9 0-16-6-35-6s-26 6-35 6c-12 0-20-10-20-22Z" fill="none" stroke="${accent}" stroke-width="2" />
        <path d="M286 168c10 14 10 34 0 52M354 168c-10 14-10 34 0 52M305 159c6 16 6 36 0 54M335 159c-6 16-6 36 0 54" fill="none" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.5" stroke-linecap="round" />
      `;
    case "pastry":
      return `
        <path d="M272 222h96l-10-44-38-20-38 20-10 44Z" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round" />
        <path d="M276 196h88M320 158v-14" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="320" cy="140" r="5" fill="${accent}" fill-opacity="0.85" />
      `;
    case "coffee":
    case "savory":
      return `
        <path d="M282 178h62v26c0 17-14 30-31 30s-31-13-31-30v-26Z" fill="none" stroke="${accent}" stroke-width="2" />
        <path d="M344 184h10c7 0 12 5 12 12s-5 12-12 12h-10" fill="none" stroke="${accent}" stroke-width="1.8" />
        <path d="M270 242h86" stroke="${accent}" stroke-width="2" stroke-linecap="round" />
        <path d="M302 164c0-7 6-9 6-16M322 164c0-7 6-9 6-16" fill="none" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.5" stroke-linecap="round" />
      `;
    case "juice":
      return `
        <circle cx="320" cy="196" r="34" fill="none" stroke="${accent}" stroke-width="2" />
        <circle cx="320" cy="196" r="26" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="1" />
        <path d="M320 170v52M294 196h52M302 178l36 36M338 178l-36 36" stroke="${accent}" stroke-opacity="0.65" stroke-width="1.3" />
      `;
    case "ibericos":
      return `
        <path d="M272 216c18-32 48-48 84-52l14 14c-8 34-28 56-64 62-16 2-28-6-34-24Z" fill="none" stroke="${accent}" stroke-width="2" />
        <path d="M294 204c14-16 32-24 54-26" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="1.5" stroke-linecap="round" />
        <path d="M266 238h108" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round" />
      `;
    case "wine":
      return `
        <path d="M298 158h44l-4 30c-2 14-10 22-18 22s-16-8-18-22l-4-30Z" fill="none" stroke="${accent}" stroke-width="2" />
        <path d="M296 182h48M320 210v30M302 240h36" fill="none" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case "tablas":
      return `
        <rect x="268" y="176" width="92" height="54" rx="8" fill="none" stroke="${accent}" stroke-width="2" />
        <circle cx="372" cy="203" r="8" fill="none" stroke="${accent}" stroke-width="1.8" />
        <path d="M286 194h34M286 210h52" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round" />
      `;
    case "conservas":
      return `
        <ellipse cx="320" cy="198" rx="44" ry="26" fill="none" stroke="${accent}" stroke-width="2" />
        <ellipse cx="320" cy="198" rx="34" ry="18" fill="none" stroke="${accent}" stroke-opacity="0.6" stroke-width="1.3" />
        <circle cx="306" cy="198" r="5" fill="${accent}" fill-opacity="0.75" />
        <circle cx="324" cy="198" r="5" fill="${accent}" fill-opacity="0.75" />
      `;
    case "raciones":
      return `
        <path d="M274 202c0 22 20 36 46 36s46-14 46-36H274Z" fill="none" stroke="${accent}" stroke-width="2" />
        <path d="M290 190c10-12 24-16 36-12s20 8 26 12" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="1.6" stroke-linecap="round" />
      `;
    case "basket":
      return `
        <path d="M278 192h84l-10 44h-64l-10-44Z" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round" />
        <path d="M296 192c0-16 10-28 24-28s24 12 24 28" fill="none" stroke="${accent}" stroke-width="1.8" />
        <path d="M286 212h68" stroke="${accent}" stroke-opacity="0.6" stroke-width="1.4" />
      `;
  }
}

export function buildFallbackIllustrationSvg(key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9/_.-]/g, "");
  const matchedItem = resolveItemFromKey(safeKey);
  if (matchedItem) {
    return buildProductCulinarySvg(matchedItem);
  }

  const theme = resolveTheme(safeKey);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480" role="img" aria-label="${theme.familyTitle} — ${theme.subtitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bgPrimary}" />
      <stop offset="100%" stop-color="${theme.bgSecondary}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="640" height="480" fill="url(#bg)" />
  <rect width="640" height="480" fill="url(#glow)" />
  <rect x="24" y="24" width="592" height="432" fill="none" stroke="${theme.accent}" stroke-opacity="0.26" stroke-width="1" />
  <rect x="32" y="32" width="576" height="416" fill="none" stroke="${theme.accent}" stroke-opacity="0.12" stroke-width="1" />
  <circle cx="320" cy="198" r="58" fill="${theme.badgeColor}" fill-opacity="0.28" stroke="${theme.accent}" stroke-opacity="0.5" stroke-width="1.2" />
  ${renderMotifPaths(theme.motif, theme.accent)}
  <text x="320" y="294" text-anchor="middle" fill="#f5f2ed" font-family="Georgia, 'Times New Roman', serif" font-size="21" letter-spacing="4">CORREDERA</text>
  <text x="320" y="322" text-anchor="middle" fill="${theme.accent}" font-family="system-ui, sans-serif" font-size="11.5" font-weight="600" letter-spacing="2.6">${theme.familyTitle}</text>
  <text x="320" y="346" text-anchor="middle" fill="#d8cec2" fill-opacity="0.72" font-family="system-ui, sans-serif" font-size="9.5" letter-spacing="2">${theme.subtitle}</text>
</svg>`;
}

export function registerStorageProxy(app: Express) {
  // Ensure uploaded photos & videos from /admin are immediately served in both dev and production
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
  app.use(
    "/assets/uploads",
    express.static(PUBLIC_UPLOADS_DIR, {
      maxAge: "7d",
      fallthrough: true,
    })
  );

  app.get("/assets/products/:file", (req, res, next) => {
    const file = String((req.params as Record<string, string>).file || "").replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    );
    if (!file) {
      res.status(400).send("Invalid product asset");
      return;
    }
    const clientProductFile = path.join(
      CLIENT_PUBLIC_DIR,
      "assets",
      "products",
      file
    );
    const distProductFile = path.join(
      DIST_PUBLIC_DIR,
      "assets",
      "products",
      file
    );
    if (fs.existsSync(clientProductFile) || fs.existsSync(distProductFile)) {
      next();
      return;
    }
    const id = file.replace(/\.[a-zA-Z0-9]+$/, "");
    const item = menuItems.find((m) => m.id === id);
    if (!item) {
      res.status(404).send("Product visual not found");
      return;
    }
    res
      .status(200)
      .set("Content-Type", "image/svg+xml; charset=utf-8")
      .set("Cache-Control", "public, max-age=3600")
      .send(buildProductCulinarySvg(item));
  });

  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const sendFallbackSvg = () => {
      res
        .status(200)
        .set("Content-Type", "image/svg+xml; charset=utf-8")
        .set("Cache-Control", "public, max-age=300")
        .send(buildFallbackIllustrationSvg(key));
    };

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      sendFallbackSvg();
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        sendFallbackSvg();
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        sendFallbackSvg();
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      sendFallbackSvg();
    }
  });
}
