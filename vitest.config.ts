import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // server-only crashes outside Next runtime; services import it for the
      // build-time boundary, tests stub it out.
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // First run downloads the mongod binary (~600MB); hooks must survive that.
    hookTimeout: 300000,
    teardownTimeout: 120000,
  },
});
