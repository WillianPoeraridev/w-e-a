import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    // Match the "@/*" path alias from tsconfig so tests can import app modules.
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "features/**/*.test.ts"],
    // Run in SP time so date helpers are tested in a negative-offset timezone
    // (where the classic UTC/local off-by-one day bug would surface).
    env: { TZ: "America/Sao_Paulo" },
  },
});
