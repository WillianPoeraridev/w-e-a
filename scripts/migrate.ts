import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

// Carrega .env.local (preferencial) ou cai pro .env
loadEnv({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL não definida. Configure no .env.local.");
  process.exit(1);
}

async function main() {
  console.log("🔌 Conectando ao banco via WebSocket (neon-serverless)...");
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log("📂 Aplicando migrations da pasta ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ Migrations aplicadas com sucesso!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Falha ao aplicar migrations:", err);
  process.exit(1);
});
