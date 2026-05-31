import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Better Auth stack (and its kysely fallback we don't use) out of the
  // server bundle so the bundler doesn't statically analyze dead adapter code.
  serverExternalPackages: [
    "better-auth",
    "@better-auth/kysely-adapter",
    "@better-auth/drizzle-adapter",
    "kysely",
  ],
};

export default nextConfig;
