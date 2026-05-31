import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Neon serverless Pool (WebSocket) so Drizzle transactions work both on Vercel
 * and locally. The whole schema is passed in for the relational query API.
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
export { schema };
