import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared")
    }
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["**/node_modules/**", "**/.git/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  }
});
