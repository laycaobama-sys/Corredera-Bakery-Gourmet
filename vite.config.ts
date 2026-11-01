import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Pre-bundle the admin chart library at startup so the lazy admin chunk never waits on a re-optimization.
  optimizeDeps: {
    include: ["recharts"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    // Hashed JS/CSS/fonts go to /static (cached for a year); /assets holds photos the owner can replace.
    assetsDir: "static",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Match whole package names: a loose "react" match once pulled the admin-only chart library into every page.
        manualChunks(id) {
          const pkg = id.match(/[\\/]node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?((?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1]?.replace("\\", "/");
          if (!pkg) return;
          if (pkg === "lucide-react") return "vendor-icons";
          if (/^(@trpc\/|@tanstack\/|superjson$|zod$|copy-anything$|is-what$)/.test(pkg)) return "vendor-query";
          if (/^(react|react-dom|scheduler|wouter|regexparam|use-sync-external-store)$/.test(pkg)) return "vendor-react";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
