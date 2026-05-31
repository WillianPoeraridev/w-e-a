import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "./env";

/**
 * Origins Better Auth trusts for CSRF protection. In prod it's the real app URL;
 * in dev we trust the usual localhost ports since Next picks 3001+ when 3000 is
 * busy (otherwise the browser's Origin header fails the check → "Invalid origin").
 */
const trustedOrigins =
  process.env.NODE_ENV === "production"
    ? [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL]
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
      ];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  // nextCookies() must be the LAST plugin so it can set cookies on responses.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
