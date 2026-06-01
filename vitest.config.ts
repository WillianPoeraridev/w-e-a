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
    // Run in SP time so date helpers are tested in a negative-offset timezone.
    // Dummy env so modules that transitively import the DB/env layer parse
    // (the Neon Pool is constructed lazily and never connects in unit tests).
    env: {
      TZ: "America/Sao_Paulo",
      DATABASE_URL: "postgresql://u:p@localhost/db",
      BETTER_AUTH_SECRET: "test-secret-at-least-16-chars",
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
});
