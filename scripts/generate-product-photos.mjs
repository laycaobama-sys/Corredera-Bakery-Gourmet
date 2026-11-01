/**
 * Generates photos with Google Flow (srzGoogleFlowMCP) for every id in a prompts file
 * (default scripts/product-photo-prompts.json). Already generated ids are skipped, so it can be resumed.
 *
 *   node scripts/generate-product-photos.mjs [--prompts scripts/home-photo-prompts.json] [--out raw-home] [id ...]
 *
 * Raw results: _flow_output/<out>/<id>/. Run scripts/install-product-photos.py afterwards for products.
 * The aspect ratio comes from the Flow agent defaults (Ajustes > Configuración del agente).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const flowDir = path.join(root, "srzGoogleFlowMCP");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    prompts: { type: "string", default: "scripts/product-photo-prompts.json" },
    out: { type: "string", default: "raw" },
  },
});
const prompts = JSON.parse(fs.readFileSync(path.join(root, values.prompts), "utf8"));
const style = prompts._style;
const ids = positionals.length ? positionals : Object.keys(prompts).filter((k) => !k.startsWith("_"));

let ok = 0;
for (const id of ids) {
  const outDir = path.join(root, "_flow_output", values.out, id);
  const done = fs.existsSync(outDir) && fs.readdirSync(outDir).some((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith("thumb"));
  if (done) {
    console.log(`= ${id} (ya generada)`);
    continue;
  }
  const promptFile = path.join(root, "_flow_output", "prompts", `${id}.txt`);
  fs.mkdirSync(path.dirname(promptFile), { recursive: true });
  fs.writeFileSync(promptFile, style.replace("{subject}", prompts[id]));
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const out = execFileSync(
        process.execPath,
        ["src/cli.js", "--prompt-file", promptFile, "--aspect", "4:3", "--count", "1", "--model", "2", "--out", outDir],
        { cwd: flowDir, encoding: "utf8", timeout: 6 * 60 * 1000 },
      );
      console.log(`+ ${id}: ${out.trim().split("\n").pop()}`);
      ok++;
      break;
    } catch (err) {
      console.log(`! ${id} intento ${attempt}: ${String(err.stderr || err.message).split("\n")[0]}`);
    }
  }
}
console.log(`Terminado: ${ok} nuevas imágenes.`);
