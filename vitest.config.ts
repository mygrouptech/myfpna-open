import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

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
    // Global setup/teardown for MySQL container
    globalSetup: ["./server/test-setup.global.ts"],
    // Per-test setup for clean database
    setupFiles: ["./server/test-setup.each.ts"],
    // Increase timeout for container startup
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
