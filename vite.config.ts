import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared")
    }
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true
  },
  server: {
    middlewareMode: false
  }
});
