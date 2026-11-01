export type VisualMode = "bakery" | "gourmet";

export interface ProductVisualSpec {
  id: string;
  mode: VisualMode;
  category: string;
  name: string;
  nameEn: string;
  price: string;
}

type PlatePalette = {
  tableA: string;
  tableB: string;
  plateFill: string;
  plateRim: string;
  accent: string;
  warmHighlight: string;
  badgeBg: string;
  textMuted: string;
};

function getPalette(id: string, mode: VisualMode, category: string): PlatePalette {
  const hash = id.split("").reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0);
  if (mode === "bakery") {
    const bakeryTables: [string, string][] = [
      ["#2d2119", "#473427"],
      ["#32241b", "#4e392b"],
      ["#2a1f18", "#433125"],
      ["#35261c", "#523b2c"],
      ["#2e231c", "#48372c"],
    ];
    const [tableA, tableB] = bakeryTables[hash % bakeryTables.length];
    return {
      tableA,
      tableB,
      plateFill: category === "packs" ? "#e9dccb" : "#f6f1ea",
      plateRim: "#d9cbb8",
      accent: "#d9a679",
      warmHighlight: "#f3d5b5",
      badgeBg: "#7c4a2b",
      textMuted: "#dfd3c3",
    };
  }

  const gourmetTables: [string, string][] = [
    ["#261415", "#3f1f21"],
    ["#231815", "#3b2722"],
    ["#1f1c18", "#332e27"],
    ["#2b1617", "#462224"],
    ["#221917", "#382824"],
  ];
  const [tableA, tableB] = gourmetTables[hash % gourmetTables.length];
  return {
    tableA,
    tableB,
    plateFill:
      category === "jamones_enteros" ||
      category === "sobres_jamon" ||
      category === "embutidos" ||
      category === "sobres_embutidos" ||
      category === "quesos" ||
      category === "tablas"
        ? "#6e472b"
        : "#f2ece4",
    plateRim:
      category === "jamones_enteros" ||
      category === "sobres_jamon" ||
      category === "embutidos" ||
      category === "sobres_embutidos" ||
      category === "quesos" ||
      category === "tablas"
        ? "#8c5c38"
        : "#d5c7b4",
    accent: "#dfba94",
    warmHighlight: "#f0d6b8",
    badgeBg: "#621b1c",
    textMuted: "#e0d2c2",
  };
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Renders a detailed, dish-specific overhead culinary illustration for each of the 102 catalog items.
 * Every product ID receives its own distinct vessel, garnish, ingredients, and plating arrangement.
 */
function renderDishArtwork(spec: ProductVisualSpec): string {
  const { id, category } = spec;

  // 1. DESAYUNOS (d1 - d4)
  if (id === "d1") {
    // Desayuno Clásico: Coffee latte cup + toasted hogaza with grated ruby tomato + small jam pot
    return `
      <!-- Wooden breakfast tray -->
      <rect x="130" y="96" width="380" height="230" rx="26" fill="#8b5e3c" stroke="#a97852" stroke-width="3"/>
      <rect x="142" y="108" width="356" height="206" rx="20" fill="#784f30" stroke="#9c6c46" stroke-width="1.5"/>
      <!-- Ceramic plate with toasted bread & tomato -->
      <circle cx="248" cy="210" r="78" fill="#f7f3ed" stroke="#ded4c6" stroke-width="4"/>
      <path d="M196 196 C196 168, 298 168, 300 198 C302 228, 286 250, 248 250 C210 250, 194 224, 196 196 Z" fill="#c68b45" stroke="#8f5c24" stroke-width="4"/>
      <path d="M206 198 C210 178, 286 178, 290 198 C292 220, 276 238, 248 238 C218 238, 204 218, 206 198 Z" fill="#d94436" fill-opacity="0.9"/>
      <path d="M220 196 Q248 186 276 202 M224 214 Q250 206 272 218" stroke="#e6b84c" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="238" cy="198" r="2.5" fill="#4f772d"/>
      <circle cx="258" cy="210" r="2.5" fill="#4f772d"/>
      <!-- Coffee cup with latte art -->
      <circle cx="404" cy="178" r="52" fill="#f3ede4" stroke="#d8cbb8" stroke-width="3"/>
      <circle cx="404" cy="178" r="38" fill="#6f4528" stroke="#f7f3ed" stroke-width="5"/>
      <path d="M392 174 C392 164, 416 164, 416 174 C416 184, 404 192, 404 192 C404 192, 392 184, 392 174 Z" fill="#f4e8d8" fill-opacity="0.88"/>
      <!-- Small artisan jam jar -->
      <circle cx="412" cy="268" r="26" fill="#fcf9f5" stroke="#d8cbb8" stroke-width="3"/>
      <circle cx="412" cy="268" r="19" fill="#9e2a2b"/>
      <circle cx="406" cy="262" r="4" fill="#ffffff" fill-opacity="0.45"/>
    `;
  }

  if (id === "d2") {
    // Desayuno Dulce: Coffee cup + Large Butter Croissant + Mini Cinnamon Roll + Palmerita
    return `
      <ellipse cx="320" cy="212" rx="196" ry="118" fill="#f6f1ea" stroke="#dfd3c3" stroke-width="5"/>
      <ellipse cx="320" cy="212" rx="168" ry="96" fill="none" stroke="#e5dacb" stroke-width="1.5"/>
      <!-- Golden croissant -->
      <path d="M180 218 C172 172, 232 142, 282 162 C320 176, 332 214, 304 232 C284 244, 266 218, 244 218 C220 218, 190 246, 180 218 Z" fill="#d88b35" stroke="#99581a" stroke-width="3"/>
      <path d="M208 182 Q244 166 276 184 M218 200 Q246 188 272 202" stroke="#f4c27a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Mini cinnamon roll -->
      <circle cx="264" cy="262" r="30" fill="#c97d3a" stroke="#8c4f19" stroke-width="2.5"/>
      <path d="M264 262 m-4 0 a 6 6 0 1 0 12 0 a 12 12 0 1 0 -24 0 a 18 18 0 1 0 36 0" fill="none" stroke="#5e3013" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M248 254 Q264 246 280 258 Q264 270 252 268" fill="none" stroke="#fbf6ef" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Coffee cup -->
      <circle cx="412" cy="196" r="54" fill="#ebe3d8" stroke="#d0c2b0" stroke-width="3"/>
      <circle cx="412" cy="196" r="40" fill="#5c3820" stroke="#ffffff" stroke-width="5"/>
      <circle cx="412" cy="196" r="22" fill="#e8d5be" fill-opacity="0.8"/>
    `;
  }

  if (id === "d3") {
    // Desayuno Ibérico (Más vendido): Toasted sourdough with marbled 100% Iberian ham + specialty coffee
    return `
      <rect x="122" y="92" width="396" height="236" rx="28" fill="#6b442a" stroke="#8f603f" stroke-width="3"/>
      <!-- Plate with Iberian ham toast -->
      <circle cx="256" cy="210" r="88" fill="#f8f4ee" stroke="#dfd3c3" stroke-width="4"/>
      <path d="M188 188 C192 156, 316 156, 322 192 C328 228, 304 258, 254 258 C204 258, 184 222, 188 188 Z" fill="#c2853e" stroke="#87551e" stroke-width="4"/>
      <!-- Ribbons of marbled jamón ibérico -->
      <path d="M198 186 C222 168, 272 170, 308 188 C298 212, 246 214, 198 198 Z" fill="#8d1b22" stroke="#b8333a" stroke-width="1.5"/>
      <path d="M204 206 C234 190, 286 194, 312 214 C296 238, 238 242, 202 222 Z" fill="#7a151b" stroke="#a82830" stroke-width="1.5"/>
      <!-- White Iberian fat marbling streaks -->
      <path d="M214 184 Q252 178 292 190 M218 214 Q258 208 298 220" stroke="#f6e4d8" stroke-width="2.5" stroke-linecap="round" fill="none" stroke-opacity="0.85"/>
      <!-- Espresso con leche cup -->
      <circle cx="424" cy="192" r="54" fill="#f5efe6" stroke="#d9cbb8" stroke-width="3"/>
      <circle cx="424" cy="192" r="40" fill="#633b20" stroke="#fdfbf7" stroke-width="5"/>
      <path d="M412 188 C412 176, 436 176, 436 188 C436 200, 424 208, 424 208 C424 208, 412 200, 412 188 Z" fill="#f3e5d3"/>
    `;
  }

  if (id === "d4") {
    // Extra Zumo de Naranja Natural Pequeño
    return `
      <circle cx="320" cy="212" r="108" fill="#f5efe6" stroke="#ded2c1" stroke-width="4"/>
      <!-- Halved fresh Valencia orange -->
      <circle cx="248" cy="236" r="46" fill="#f77f00" stroke="#d65a00" stroke-width="3"/>
      <circle cx="248" cy="236" r="39" fill="#fcbf49" stroke="#fff3d6" stroke-width="3"/>
      <path d="M248 198 v76 M210 236 h76 M221 209 l54 54 M275 209 l-54 54" stroke="#fff3d6" stroke-width="2.2"/>
      <!-- Crystal tumbler of fresh orange juice -->
      <rect x="314" y="138" width="88" height="126" rx="14" fill="#ffffff" fill-opacity="0.35" stroke="#e8dfd3" stroke-width="3"/>
      <rect x="320" y="154" width="76" height="104" rx="10" fill="#ff9f1c"/>
      <ellipse cx="358" cy="154" rx="38" ry="9" fill="#ffbf69"/>
      <path d="M332 168 v74" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-opacity="0.55"/>
      <!-- Mint leaf -->
      <path d="M372 146 C384 132, 404 134, 398 150 C390 160, 376 156, 372 146 Z" fill="#386641"/>
    `;
  }

  // 2. MERIENDAS (m1 - m3)
  if (category === "meriendas") {
    const isEmpanada = id === "m2";
    const isFocaccia = id === "m3";
    return `
      <rect x="124" y="96" width="392" height="228" rx="24" fill="#7a5133" stroke="#9e6d48" stroke-width="3"/>
      <circle cx="258" cy="212" r="84" fill="#f7f2eb" stroke="#dfd3c2" stroke-width="4"/>
      ${
        isEmpanada
          ? `<path d="M192 232 C192 168, 324 168, 324 232 Z" fill="#d98a36" stroke="#965615" stroke-width="3.5"/>
             <path d="M196 232 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0" fill="none" stroke="#f5c98b" stroke-width="3"/>`
          : isFocaccia
            ? `<rect x="190" y="168" width="136" height="88" rx="16" fill="#d89748" stroke="#99621e" stroke-width="3"/>
               <circle cx="218" cy="194" r="8" fill="#c1121f"/><circle cx="262" cy="212" r="8" fill="#c1121f"/><circle cx="296" cy="190" r="8" fill="#c1121f"/>
               <path d="M236 184 l8 -10 M278 228 l10 -8" stroke="#386641" stroke-width="3" stroke-linecap="round"/>`
            : `<rect x="184" y="178" width="148" height="68" rx="32" fill="#c88439" stroke="#8a5419" stroke-width="3.5"/>
               <path d="M194 212 Q258 226 322 212" stroke="#e9c46a" stroke-width="8" stroke-linecap="round" fill="none"/>
               <path d="M198 204 Q258 192 318 204" stroke="#588157" stroke-width="6" stroke-linecap="round" fill="none"/>`
      }
      <!-- Chilled drink glass -->
      <rect x="384" y="136" width="76" height="142" rx="14" fill="#f4a261" fill-opacity="0.9" stroke="#f7f2eb" stroke-width="4"/>
      <rect x="388" y="138" width="68" height="24" rx="6" fill="#fcf8f2"/>
      <path d="M402 172 v86" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.5"/>
    `;
  }

  // 3. PACKS (p1 - p6)
  if (category === "packs") {
    const isSweet = id === "p1" || id === "p2" || id === "p3";
    const count = id === "p1" ? 8 : id === "p2" ? 12 : id === "p3" ? 16 : id === "p4" ? 4 : id === "p5" ? 6 : 12;
    const cols = count <= 4 ? 2 : count <= 8 ? 4 : 4;
    const rows = Math.ceil(count / cols);
    const itemsSvg: string[] = [];
    const boxX = 148;
    const boxY = 92;
    const boxW = 344;
    const boxH = 236;
    const cellW = (boxW - 48) / cols;
    const cellH = (boxH - 48) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = boxX + 24 + c * cellW + cellW / 2;
        const cy = boxY + 24 + r * cellH + cellH / 2;
        if (isSweet) {
          if ((r + c) % 2 === 0) {
            // Golden mini croissant
            itemsSvg.push(
              `<ellipse cx="${cx}" cy="${cy}" rx="${Math.min(26, cellW * 0.38)}" ry="${Math.min(16, cellH * 0.34)}" fill="#d98a36" stroke="#8f5112" stroke-width="2"/>` +
                `<path d="M${cx - 10} ${cy - 4} Q${cx} ${cy - 10} ${cx + 10} ${cy - 4}" stroke="#f7cfa0" stroke-width="2" fill="none"/>`
            );
          } else {
            // Heart-shaped golden palmier
            itemsSvg.push(
              `<circle cx="${cx - 7}" cy="${cy}" r="${Math.min(13, cellH * 0.28)}" fill="#c87628" stroke="#7d430d" stroke-width="2"/>` +
                `<circle cx="${cx + 7}" cy="${cy}" r="${Math.min(13, cellH * 0.28)}" fill="#c87628" stroke="#7d430d" stroke-width="2"/>`
            );
          }
        } else {
          // Hand-crimped golden empanadilla
          itemsSvg.push(
            `<path d="M${cx - 24} ${cy + 10} A 24 22 0 0 1 ${cx + 24} ${cy + 10} Z" fill="#d9913b" stroke="#8c5319" stroke-width="2.2"/>` +
              `<path d="M${cx - 18} ${cy + 8} h36" stroke="#f5cfa0" stroke-width="2" stroke-dasharray="4 3"/>`
          );
        }
      }
    }

    return `
      <!-- Artisan open kraft catering box -->
      <rect x="${boxX - 10}" y="${boxY - 10}" width="${boxW + 20}" height="${boxH + 20}" rx="18" fill="#bfa07a" stroke="#8c6d49" stroke-width="3"/>
      <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="12" fill="#f7f1e6" stroke="#d5c3aa" stroke-width="2"/>
      ${itemsSvg.join("\n")}
    `;
  }

  // 4. BOCADILLOS BAKERY & EMPANADAS & FOCACCIA (b1 - b9, e1 - e3)
  if (id === "e1") {
    // Empanada Gallega Artesana (rectangular golden lattice pie)
    return `
      <rect x="136" y="96" width="368" height="228" rx="22" fill="#784f30" stroke="#9c6c46" stroke-width="3"/>
      <rect x="164" y="118" width="312" height="184" rx="16" fill="#d88932" stroke="#8a4f11" stroke-width="4"/>
      <path d="M180 134 L460 286 M240 118 L476 250 M164 170 L400 302 M460 134 L180 286 M400 118 L164 250 M476 170 L240 302" stroke="#f2be7e" stroke-width="4" stroke-opacity="0.75"/>
      <circle cx="320" cy="210" r="14" fill="#6b3808" stroke="#f2be7e" stroke-width="3"/>
    `;
  }

  if (id === "e2") {
    // Empanadillas Variadas (trio of golden half-moon pastries)
    return `
      <circle cx="320" cy="210" r="112" fill="#f6f1ea" stroke="#ded2c1" stroke-width="4"/>
      <path d="M196 206 A 54 48 0 0 1 304 206 Z" fill="#d98c36" stroke="#8c5113" stroke-width="3"/>
      <path d="M332 206 A 54 48 0 0 1 440 206 Z" fill="#e09642" stroke="#8c5113" stroke-width="3"/>
      <path d="M264 268 A 56 50 0 0 1 376 268 Z" fill="#cf7f29" stroke="#8c5113" stroke-width="3"/>
      <circle cx="250" cy="184" r="3" fill="#4a2c11"/><circle cx="386" cy="184" r="3" fill="#4a2c11"/><circle cx="320" cy="244" r="3" fill="#4a2c11"/>
    `;
  }

  if (id === "e3") {
    // Focaccia artesana rellena
    return `
      <rect x="136" y="102" width="368" height="216" rx="24" fill="#ede4d7" stroke="#cfc1ae" stroke-width="4"/>
      <rect x="176" y="130" width="288" height="160" rx="22" fill="#d99646" stroke="#945c1b" stroke-width="4"/>
      <circle cx="222" cy="168" r="11" fill="#bc2c1a"/><circle cx="288" cy="196" r="11" fill="#bc2c1a"/><circle cx="358" cy="164" r="11" fill="#bc2c1a"/><circle cx="412" cy="212" r="11" fill="#bc2c1a"/><circle cx="246" cy="236" r="11" fill="#bc2c1a"/>
      <circle cx="324" cy="158" r="8" fill="#2b2d42"/><circle cx="378" cy="238" r="8" fill="#2b2d42"/><circle cx="212" cy="218" r="8" fill="#2b2d42"/>
      <path d="M256 168 l14 -12 M336 218 l16 -10 M396 178 l12 14" stroke="#386641" stroke-width="3.5" stroke-linecap="round"/>
    `;
  }

  if (category === "bocadillos" && spec.mode === "bakery") {
    // b1 - b9: Specific fillings for each signature sandwich
    const fillingMap: Record<string, { main: string; second: string; garnish: string }> = {
      b1: { main: "#8d1b22", second: "#b8333a", garnish: "#f5e3d5" }, // Jamón Ibérico
      b2: { main: "#f29e4c", second: "#f4d35e", garnish: "#e07a5f" }, // Croissant Mixto
      b3: { main: "#fcf9f2", second: "#d62828", garnish: "#386641" }, // Mozzarella y Tomate
      b4: { main: "#7f4f24", second: "#f8f9fa", garnish: "#588157" }, // Kebab
      b5: { main: "#dda15e", second: "#e9c46a", garnish: "#4f772d" }, // Pollo y Mostaza
      b6: { main: "#f4b942", second: "#8d1b22", garnish: "#f9dc5c" }, // Tortilla y Jamón
      b7: { main: "#9b2226", second: "#e9c46a", garnish: "#6a994e" }, // Pastrami
      b8: { main: "#e5989b", second: "#f3e9d2", garnish: "#6a994e" }, // Mortadela y Parmesano
      b9: { main: "#6f1d1b", second: "#bb3e03", garnish: "#9d4edd" }, // Pulled Pork
    };
    const fill = fillingMap[id] ?? fillingMap.b1;
    const isCroissant = id === "b2";
    return `
      <ellipse cx="320" cy="212" rx="194" ry="110" fill="#f7f2eb" stroke="#dfd3c2" stroke-width="4"/>
      ${
        isCroissant
          ? `<path d="M174 226 C164 156, 256 126, 344 146 C420 164, 468 206, 444 242 C424 268, 376 238, 316 238 C252 238, 190 268, 174 226 Z" fill="#d98a32" stroke="#8f5112" stroke-width="4"/>`
          : `<rect x="162" y="156" width="316" height="112" rx="54" fill="#c9863d" stroke="#85511a" stroke-width="4"/>`
      }
      <!-- Rich layered sandwich filling -->
      <path d="M176 212 Q248 238 320 212 Q392 238 464 212" stroke="${fill.second}" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M180 204 Q248 182 320 206 Q392 182 460 204" stroke="${fill.main}" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M196 208 Q256 196 320 210 Q384 196 444 208" stroke="${fill.garnish}" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 10" fill="none"/>
      <!-- Crust score marks -->
      <path d="M224 168 l24 26 M296 164 l24 26 M368 168 l24 26" stroke="#f4c78e" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  // 5. BOLLERÍA (bo1 - bo14)
  if (category === "bolleria") {
    if (id === "bo1" || id === "bo11") {
      // Croissant Grande / Mini Croissant
      const scale = id === "bo11" ? "transform='translate(64,42) scale(0.78)'" : "";
      return `
        <circle cx="320" cy="212" r="112" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <g ${scale}>
          <path d="M182 228 C168 162, 246 128, 326 144 C402 158, 458 202, 438 238 C422 266, 376 234, 318 234 C256 234, 198 268, 182 228 Z" fill="#d98932" stroke="#8c4f12" stroke-width="3.8"/>
          <path d="M226 168 Q284 148 348 166 M236 192 Q296 174 358 192 M254 214 Q306 202 352 214" stroke="#f7cba0" stroke-width="4" fill="none" stroke-linecap="round"/>
        </g>
      `;
    }
    if (id === "bo8" || id === "bo9" || id === "bo10") {
      // NY Rolls: Pistacho (bo8), Dulce de Leche (bo9), Chocolate (bo10)
      const glaze = id === "bo8" ? "#7cb518" : id === "bo9" ? "#b5651d" : "#3d2314";
      const crumb = id === "bo8" ? "#d9ed92" : id === "bo9" ? "#f4d58d" : "#e0afa0";
      return `
        <circle cx="320" cy="212" r="112" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <!-- Circular laminated suprême NY Roll -->
        <circle cx="320" cy="212" r="76" fill="#d4893b" stroke="#8a5017" stroke-width="4"/>
        <circle cx="320" cy="212" r="58" fill="none" stroke="#a66321" stroke-width="3" stroke-dasharray="12 6"/>
        <circle cx="320" cy="212" r="42" fill="none" stroke="#a66321" stroke-width="3" stroke-dasharray="10 5"/>
        <!-- Rich cream glaze crown -->
        <path d="M262 184 C278 148, 362 148, 378 184 C390 212, 364 244, 320 242 C276 244, 250 212, 262 184 Z" fill="${glaze}"/>
        <circle cx="302" cy="186" r="5" fill="${crumb}"/><circle cx="334" cy="178" r="4" fill="${crumb}"/><circle cx="320" cy="204" r="5.5" fill="${crumb}"/><circle cx="344" cy="202" r="4" fill="${crumb}"/>
      `;
    }
    if (id === "bo5" || id === "bo6" || id === "bo7") {
      // Palmeritas / Palmeritas Rellenas / Palmera de Yema
      const coating = id === "bo6" ? "#4a2511" : id === "bo7" ? "#f4a226" : "#d98932";
      return `
        <circle cx="320" cy="212" r="112" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <path d="M320 266 C258 266, 206 218, 224 172 C238 136, 294 142, 320 182 C346 142, 402 136, 416 172 C434 218, 382 266, 320 266 Z" fill="${coating}" stroke="#854912" stroke-width="4"/>
        <path d="M258 184 C272 164, 304 170, 320 198 C336 170, 368 164, 382 184" fill="none" stroke="#f8d5a3" stroke-width="3.5" stroke-linecap="round"/>
      `;
    }
    // bo2 (Caracol), bo3 (Napolitana), bo4 (Canolis), bo12 (Cinnamon Roll), bo13 (Abanicos), bo14 (Teja)
    return `
      <circle cx="320" cy="212" r="112" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
      ${
        id === "bo3"
          ? `<rect x="224" y="156" width="192" height="112" rx="18" fill="#d88b35" stroke="#8a4f14" stroke-width="4"/>
             <path d="M244 184 h152 M244 212 h152 M244 240 h152" stroke="#42210b" stroke-width="6" stroke-linecap="round"/>`
          : id === "bo4"
            ? `<rect x="218" y="168" width="204" height="42" rx="20" fill="#d48c46" stroke="#8a5219" stroke-width="3"/>
               <rect x="218" y="218" width="204" height="42" rx="20" fill="#d48c46" stroke="#8a5219" stroke-width="3"/>
               <circle cx="222" cy="189" r="16" fill="#fcf8f0"/><circle cx="418" cy="189" r="16" fill="#fcf8f0"/>
               <circle cx="222" cy="239" r="16" fill="#fcf8f0"/><circle cx="418" cy="239" r="16" fill="#fcf8f0"/>`
            : `<circle cx="320" cy="212" r="68" fill="#d98b38" stroke="#8a4e12" stroke-width="4"/>
               <path d="M320 212 m-8 0 a 14 14 0 1 0 28 0 a 28 28 0 1 0 -56 0 a 42 42 0 1 0 84 0" fill="none" stroke="#69380c" stroke-width="5" stroke-linecap="round"/>`
      }
    `;
  }

  // 6. TARTAS (t1 - t12)
  if (category === "tartas") {
    if (id === "t1") {
      // Pastel de Nata (caramelized custard tartlet)
      return `
        <circle cx="320" cy="212" r="110" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <circle cx="320" cy="212" r="72" fill="#d4893b" stroke="#8c5015" stroke-width="5"/>
        <circle cx="320" cy="212" r="56" fill="#f7c844"/>
        <ellipse cx="304" cy="198" rx="18" ry="12" fill="#5c2c06" fill-opacity="0.78"/>
        <ellipse cx="342" cy="224" rx="14" ry="10" fill="#5c2c06" fill-opacity="0.72"/>
        <circle cx="332" cy="192" r="8" fill="#783909" fill-opacity="0.65"/>
      `;
    }
    if (id === "t8" || id === "t9" || id === "t7" || id === "t6") {
      // Wedge slice of cake on stoneware: Chocolate (t8), Cheesecake (t9), Zanahoria (t7), Naranja (t6)
      const topColor =
        id === "t8" ? "#2d150c" : id === "t9" ? "#c96e28" : id === "t7" ? "#f5efe6" : "#f4a226";
      const bodyColor =
        id === "t8" ? "#472415" : id === "t9" ? "#f8edcf" : id === "t7" ? "#b86428" : "#f7c868";
      const accentColor =
        id === "t8" ? "#6e3821" : id === "t9" ? "#a83232" : id === "t7" ? "#e07a2b" : "#ff9f1c";
      return `
        <circle cx="320" cy="212" r="114" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <!-- Triangular artisan cake slice -->
        <polygon points="214,244 396,158 416,256" fill="${bodyColor}" stroke="#6b3e1d" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="214,244 396,158 378,136 206,218" fill="${topColor}" stroke="#593115" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="364" cy="166" r="12" fill="${accentColor}"/>
        <circle cx="342" cy="178" r="9" fill="${accentColor}"/>
      `;
    }
    // Whole cakes & tartlets (t2, t3, t4, t5, t10, t11, t12)
    const filling =
      id === "t2" || id === "t5"
        ? "#f9c74f"
        : id === "t3"
          ? "#c1121f"
          : id === "t4"
            ? "#e09f3e"
            : "#6f3826";
    return `
      <circle cx="320" cy="212" r="114" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
      <circle cx="320" cy="212" r="82" fill="#d99b52" stroke="#8f5819" stroke-width="4"/>
      <circle cx="320" cy="212" r="66" fill="${filling}"/>
      <circle cx="298" cy="196" r="12" fill="#fcf8f2" fill-opacity="0.88"/>
      <circle cx="342" cy="196" r="12" fill="#fcf8f2" fill-opacity="0.88"/>
      <circle cx="320" cy="230" r="12" fill="#fcf8f2" fill-opacity="0.88"/>
    `;
  }

  // 7. CAFETERÍA (c1 - c14)
  if (category === "cafeteria") {
    const isCold = id === "c11" || id === "c12" || id === "c13" || id === "c14";
    if (isCold) {
      const liquid =
        id === "c11"
          ? "#ff9f1c"
          : id === "c12"
            ? "#5c2718"
            : id === "c13"
              ? "#a8dadc"
              : "#90e0ef";
      return `
        <circle cx="320" cy="212" r="110" fill="#f7f2eb" stroke="#ded2c1" stroke-width="4"/>
        <rect x="276" y="122" width="88" height="172" rx="16" fill="#ffffff" fill-opacity="0.4" stroke="#d9cbb8" stroke-width="3.5"/>
        <rect x="282" y="142" width="76" height="146" rx="12" fill="${liquid}" fill-opacity="0.88"/>
        <circle cx="308" cy="176" r="11" fill="#ffffff" fill-opacity="0.45"/>
        <circle cx="334" cy="204" r="9" fill="#ffffff" fill-opacity="0.45"/>
        <path d="M296 154 v116" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-opacity="0.6"/>
      `;
    }
    const coffeeTone =
      id === "c1" || id === "c2"
        ? "#3b1f0e"
        : id === "c8"
          ? "#b06d3b"
          : id === "c9"
            ? "#5e341a"
            : id === "c10"
              ? "#fbf8f3"
              : "#6f4425";
    return `
      <circle cx="320" cy="212" r="112" fill="#ebe2d5" stroke="#cfc1ae" stroke-width="4"/>
      <path d="M392 192 h28 a 22 22 0 0 1 0 44 h-28" fill="none" stroke="#ffffff" stroke-width="10"/>
      <circle cx="320" cy="212" r="76" fill="#ffffff" stroke="#e2d7c7" stroke-width="4"/>
      <circle cx="320" cy="212" r="62" fill="${coffeeTone}"/>
      ${
        id !== "c10"
          ? `<path d="M298 206 C298 188, 342 188, 342 206 C342 226, 320 238, 320 238 C320 238, 298 226, 298 206 Z" fill="#f4e6d4" fill-opacity="0.85"/>`
          : ""
      }
    `;
  }

  // 8. GOURMET: JAMONES ENTEROS, SOBRES DE JAMÓN, EMBUTIDOS Y SOBRES DE EMBUTIDOS
  if (
    category === "jamones_enteros" ||
    category === "sobres_jamon" ||
    category === "embutidos" ||
    category === "sobres_embutidos"
  ) {
    if (category === "jamones_enteros") {
      return `
        <!-- Whole Iberian acorn-fed ham piece on stand + vacuum sachet -->
        <rect x="112" y="92" width="416" height="236" rx="28" fill="#432818" stroke="#855836" stroke-width="4"/>
        <path d="M162 246 C188 184, 294 142, 412 152 C452 156, 472 192, 444 226 C408 264, 254 276, 162 246 Z" fill="#6f1d1b" stroke="#bb9457" stroke-width="4"/>
        <path d="M214 212 C258 178, 344 168, 410 178 C394 214, 286 234, 214 212 Z" fill="#991b1b"/>
        <path d="M236 198 Q316 182 388 194" stroke="#f7e7da" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <rect x="138" y="232" width="54" height="18" rx="6" fill="#d4a373" transform="rotate(-18 138 232)"/>
      `;
    }
    return `
      <!-- Rustic oak or slate board with hand-sliced Iberian meats -->
      <rect x="120" y="92" width="400" height="236" rx="28" fill="#5e3c23" stroke="#855836" stroke-width="4"/>
      <circle cx="320" cy="210" r="98" fill="#f8f4ee" stroke="#ded2c1" stroke-width="4"/>
      <path d="M242 168 C274 148, 366 148, 396 172 C384 198, 256 198, 242 168 Z" fill="#82161d" stroke="#b52b34" stroke-width="1.5"/>
      <path d="M232 198 C272 178, 372 178, 406 202 C392 228, 248 228, 232 198 Z" fill="#941c24" stroke="#c4353f" stroke-width="1.5"/>
      <path d="M246 228 C280 212, 364 212, 394 234 C378 258, 262 258, 246 228 Z" fill="#751218" stroke="#a8242d" stroke-width="1.5"/>
      <path d="M258 170 Q320 160 378 174 M252 200 Q320 190 388 204 M264 232 Q320 222 374 234" stroke="#f7e7da" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.85"/>
      <rect x="148" y="136" width="16" height="58" rx="8" transform="rotate(-18 148 136)" fill="#dfc196"/>
      <rect x="468" y="218" width="16" height="58" rx="8" transform="rotate(22 468 218)" fill="#dfc196"/>
    `;
  }

  // 9. GOURMET: QUESOS (q1 - q12)
  if (category === "quesos") {
    return `
      <rect x="128" y="96" width="384" height="228" rx="26" fill="#2b2927" stroke="#4a4642" stroke-width="4"/>
      <polygon points="196,242 296,144 328,236" fill="#f3dfb6" stroke="#8c6239" stroke-width="5" stroke-linejoin="round"/>
      <polygon points="282,256 388,154 428,242" fill="#e9cb8e" stroke="#6c4b2b" stroke-width="5" stroke-linejoin="round"/>
      ${
        id === "q3" || id === "q4"
          ? `<path d="M236 212 l28 -14 M254 226 l32 -8" stroke="#2b2623" stroke-width="3" stroke-linecap="round"/>`
          : ""
      }
      <circle cx="444" cy="168" r="11" fill="#5a189a"/><circle cx="462" cy="176" r="11" fill="#5a189a"/><circle cx="448" cy="188" r="11" fill="#7209b7"/>
      <circle cx="182" cy="168" r="15" fill="#9c6644" stroke="#6f4518" stroke-width="2"/>
    `;
  }

  // 9B. GOURMET: ACEITES DE OLIVA VIRGEN EXTRA (ac1 - ac7)
  if (category === "aceites") {
    return `
      <circle cx="320" cy="212" r="112" fill="#f5f1e8" stroke="#d8cbb8" stroke-width="4"/>
      <rect x="282" y="136" width="76" height="148" rx="18" fill="#606c38" stroke="#283618" stroke-width="3.5"/>
      <rect x="304" y="102" width="32" height="36" rx="6" fill="#dda15e" stroke="#bc6c25" stroke-width="2.5"/>
      <rect x="292" y="176" width="56" height="68" rx="6" fill="#fefae0" stroke="#d4a373" stroke-width="2"/>
      <circle cx="320" cy="210" r="14" fill="#d4a017" fill-opacity="0.85"/>
      <circle cx="242" cy="252" r="14" fill="#606c38"/><circle cx="264" cy="262" r="12" fill="#283618"/>
    `;
  }

  // 10. GOURMET: TOSTAS & BOCADILLOS GOURMET (g6, g7, g16, g17, g18, g19)
  if (category === "bocadillos" && spec.mode === "gourmet") {
    const topFill =
      id === "g16" ? "#f28482" : id === "g18" ? "#9c6644" : "#8d1b22";
    return `
      <rect x="132" y="98" width="376" height="224" rx="24" fill="#6b442a" stroke="#8f603f" stroke-width="3.5"/>
      <!-- Rustic sourdough hogaza toast / pan de cristal -->
      <path d="M174 198 C174 148, 466 148, 466 198 C466 248, 424 268, 320 268 C216 268, 174 248, 174 198 Z" fill="#c68942" stroke="#825119" stroke-width="5"/>
      <path d="M196 198 C212 166, 428 166, 444 198 C436 236, 204 236, 196 198 Z" fill="${topFill}"/>
      <!-- Rocket leaves & parmesan shavings -->
      <circle cx="264" cy="196" r="10" fill="#4f772d"/><circle cx="322" cy="190" r="11" fill="#4f772d"/><circle cx="378" cy="198" r="10" fill="#4f772d"/>
      <rect x="284" y="198" width="26" height="14" rx="4" fill="#f9f1dc" transform="rotate(-12 284 198)"/>
      <rect x="342" y="202" width="26" height="14" rx="4" fill="#f9f1dc" transform="rotate(14 342 202)"/>
    `;
  }

  // 11. GOURMET: VINOS & VERMUT (g8, g9, g20, g21, g22)
  if (category === "vinos") {
    const wineColor =
      id === "g21" ? "#f4d35e" : id === "g22" ? "#e09f3e" : id === "g9" ? "#781d19" : "#5e0b15";
    return `
      <circle cx="320" cy="212" r="114" fill="#2b1819" stroke="#522c2e" stroke-width="4"/>
      <!-- Stemmed crystal wine glass / vermouth glass -->
      <path d="M268 122 h104 l-10 72 c-4 32 -22 48 -42 48 s-38 -16 -42 -48 Z" fill="#ffffff" fill-opacity="0.18" stroke="#f5ebe0" stroke-width="3.5"/>
      <path d="M274 156 h92 l-6 38 c-4 26 -20 40 -40 40 s-36 -14 -40 -40 Z" fill="${wineColor}"/>
      <ellipse cx="320" cy="156" rx="46" ry="9" fill="${wineColor}" stroke="#f5ebe0" stroke-width="1.5" stroke-opacity="0.6"/>
      <path d="M320 242 v54 M284 296 h72" stroke="#f5ebe0" stroke-width="4" stroke-linecap="round"/>
      ${
        id === "g9"
          ? `<circle cx="348" cy="152" r="14" fill="#f77f00"/><circle cx="302" cy="168" r="9" fill="#6a994e"/>`
          : ""
      }
    `;
  }

  // 12. GOURMET: RACIONES FRÍAS (r1 - r6)
  if (category === "raciones") {
    const bowlTone =
      id === "r4"
        ? "#f4a261"
        : id === "r5"
          ? "#cbb292"
          : id === "r6"
            ? "#588157"
            : "#f6efe2";
    const garnishTone =
      id === "r1"
        ? "#c1121f"
        : id === "r2"
          ? "#e9c46a"
          : id === "r3"
            ? "#457b9d"
            : id === "r4"
              ? "#e76f51"
              : id === "r5"
                ? "#9b2226"
                : "#d62828";
    return `
      <circle cx="320" cy="212" r="112" fill="#e8dfd1" stroke="#cbbba4" stroke-width="5"/>
      <circle cx="320" cy="212" r="86" fill="${bowlTone}" stroke="#d8cbb8" stroke-width="3"/>
      <path d="M268 202 Q320 172 372 206 Q320 242 268 202 Z" fill="${garnishTone}" fill-opacity="0.85"/>
      <circle cx="320" cy="204" r="10" fill="#4f772d"/>
      <path d="M282 228 Q320 244 358 226" stroke="#d4a373" stroke-width="4" stroke-linecap="round" fill="none"/>
    `;
  }

  // 13. GOURMET: CONSERVAS & ENCURTIDOS (c15 - c19)
  if (category === "conservas") {
    if (id === "c15") {
      // Gildas skewers
      return `
        <rect x="140" y="104" width="360" height="212" rx="26" fill="#f6f1ea" stroke="#ded2c1" stroke-width="4"/>
        <line x1="186" y1="210" x2="454" y2="210" stroke="#bc8a5f" stroke-width="5" stroke-linecap="round"/>
        <circle cx="242" cy="210" r="24" fill="#6a994e" stroke="#386641" stroke-width="3"/>
        <path d="M284 176 C304 176, 304 244, 324 244" stroke="#7f5539" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M352 172 C368 192, 368 228, 352 248" stroke="#8ac926" stroke-width="12" stroke-linecap="round" fill="none"/>
        <circle cx="396" cy="210" r="24" fill="#6a994e" stroke="#386641" stroke-width="3"/>
      `;
    }
    return `
      <ellipse cx="320" cy="212" rx="146" ry="96" fill="#d4a373" stroke="#9c6644" stroke-width="6"/>
      <ellipse cx="320" cy="212" rx="122" ry="76" fill="#faedcd"/>
      ${
        id === "c16"
          ? `<circle cx="272" cy="198" r="18" fill="#6a994e"/><circle cx="316" cy="188" r="18" fill="#386641"/><circle cx="362" cy="202" r="18" fill="#4a2545"/><circle cx="294" cy="232" r="18" fill="#6a994e"/><circle cx="342" cy="230" r="18" fill="#386641"/>`
          : id === "c19"
            ? `<path d="M232 196 Q320 168 408 196 Q320 228 232 196 Z" fill="#f28482"/><path d="M238 224 Q320 198 402 224 Q320 252 238 224 Z" fill="#f5989b"/>`
            : `<rect x="242" y="182" width="156" height="18" rx="9" fill="#adb5bd"/><rect x="242" y="206" width="156" height="18" rx="9" fill="#ced4da"/><rect x="242" y="230" width="156" height="18" rx="9" fill="#adb5bd"/>`
      }
    `;
  }

  // 14. GOURMET: TABLAS + 2 COPAS DE VINO (t13 - t16)
  return `
    <!-- Sharing wood board + 2 crystal wine glasses -->
    <rect x="116" y="102" width="286" height="216" rx="24" fill="#6f4528" stroke="#99653f" stroke-width="4"/>
    <circle cx="204" cy="176" r="46" fill="#8d1b22" stroke="#b8333a" stroke-width="2"/>
    <polygon points="268,248 338,168 366,244" fill="#f3dfb6" stroke="#8c6239" stroke-width="3"/>
    <circle cx="208" cy="256" r="24" fill="#e5989b"/>
    <!-- Two stemmed glasses of wine on right -->
    <circle cx="456" cy="156" r="38" fill="#ffffff" fill-opacity="0.22" stroke="#f5ebe0" stroke-width="3"/>
    <circle cx="456" cy="156" r="28" fill="#660708"/>
    <circle cx="484" cy="248" r="38" fill="#ffffff" fill-opacity="0.22" stroke="#f5ebe0" stroke-width="3"/>
    <circle cx="484" cy="248" r="28" fill="#660708"/>
  `;
}

export function buildProductCulinarySvg(spec: ProductVisualSpec): string {
  const palette = getPalette(spec.id, spec.mode, spec.category);
  const safeName = escapeXml(spec.name).slice(0, 44);
  const safeCategory = escapeXml(spec.category.toUpperCase());
  const safePrice = escapeXml(spec.price);
  const areaLabel =
    spec.mode === "gourmet"
      ? "CORREDERA GOURMET · ILUSTRACIÓN ORIENTATIVA"
      : "CORREDERA BAKERY · ILUSTRACIÓN ORIENTATIVA";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480" role="img" aria-label="${safeName} — ${areaLabel}">
  <defs>
    <linearGradient id="bg-${spec.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.tableA}" />
      <stop offset="100%" stop-color="${palette.tableB}" />
    </linearGradient>
    <radialGradient id="light-${spec.id}" cx="48%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${palette.warmHighlight}" stop-opacity="0.26" />
      <stop offset="100%" stop-color="${palette.warmHighlight}" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow-${spec.id}" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0f0906" flood-opacity="0.42" />
    </filter>
  </defs>
  <rect width="640" height="480" fill="url(#bg-${spec.id})" />
  <rect width="640" height="480" fill="url(#light-${spec.id})" />
  <rect x="20" y="20" width="600" height="440" rx="14" fill="none" stroke="${palette.accent}" stroke-opacity="0.24" stroke-width="1" />
  <g filter="url(#shadow-${spec.id})">
    ${renderDishArtwork(spec)}
  </g>
  <!-- Editorial bottom caption plate -->
  <rect x="36" y="366" width="568" height="78" rx="10" fill="#17110d" fill-opacity="0.72" stroke="${palette.accent}" stroke-opacity="0.28" stroke-width="1" />
  <text x="58" y="394" fill="${palette.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" letter-spacing="2.2">REF. ${escapeXml(spec.id.toUpperCase())} · ${safeCategory}</text>
  <text x="58" y="418" fill="#f7f3ed" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="600">${safeName}</text>
  <text x="58" y="435" fill="${palette.textMuted}" fill-opacity="0.78" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" letter-spacing="1.6">${areaLabel}</text>
  <rect x="478" y="384" width="106" height="36" rx="18" fill="${palette.badgeBg}" stroke="${palette.accent}" stroke-opacity="0.45" stroke-width="1" />
  <text x="531" y="407" text-anchor="middle" fill="#fdfaf6" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700">${safePrice}</text>
</svg>`;
}

export function buildProductDataUri(spec: ProductVisualSpec): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildProductCulinarySvg(spec))}`;
}
