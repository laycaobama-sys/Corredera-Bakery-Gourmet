import { defineConfig } from "vitest/config";
import fs from "fs";
import os from "os";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

// Tests must never write orders, analytics or the owner password into the real server/data.
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "corredera-test-data-"));

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    env: {
      DATA_DIR: path.join(testDataDir, "data"),
      UPLOAD_DIR: path.join(testDataDir, "uploads"),
    },
  },
});
