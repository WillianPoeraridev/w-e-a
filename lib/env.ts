import { z } from "zod";

/**
 * Typed, validated environment. Every boundary (incl. env) is parsed with Zod.
 *
 * Design: Next.js evaluates this module during the build step (when collecting
 * page data for /api/auth/[...all]). If a required var is missing, the build
 * fails with a cryptic ZodError. To avoid that, we use a two-phase approach:
 *
 *   1. `env` is parsed with a *permissive* schema at module load. Missing vars
 *      simply become `undefined` — pages and API routes still render during
 *      the build (they just fail at request time if they touch a missing var).
 *
 *   2. `requireEnv()` runs the strict schema and throws a clear error. Call
 *      this at the top of a server action, route handler, or other
 *      request-time boundary — anywhere guaranteed NOT to run during the
 *      Next.js build.
 */
const strictSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET muito curto"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL precisa ser uma URL válida"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL precisa ser uma URL válida"),
  // Optional — enables the AI features (Google Gemini free tier). The app stays
  // fully functional with a local fallback when this is absent.
  GEMINI_API_KEY: z.string().min(1).optional(),
});

const permissiveSchema = strictSchema.partial();

const parsed = permissiveSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

/**
 * Always-defined object. Use this for read-only access. Missing required vars
 * will be `undefined` — check before using, or call `requireEnv()` at the
 * request boundary to fail loudly.
 */
export const env = parsed.success ? parsed.data : {};

/**
 * Throws if any required env var is missing/invalid. Call this at the top of
 * a server action, route handler, or other request-time boundary — anywhere
 * that is guaranteed NOT to run during the Next.js build.
 */
export function requireEnv() {
  return strictSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
}
