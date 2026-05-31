import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "features/**/*.test.ts"],
    // Run in SP time so date helpers are tested in a negative-offset timezone
    // (where the classic UTC/local off-by-one day bug would surface).
    env: { TZ: "America/Sao_Paulo" },
  },
});
