/**
 * Idempotent seed: household "Casa W&A", the two accounts, default categories,
 * the couple's real fixed bills, savings goals, and one example month so the
 * dashboard is alive on first run. Safe to run multiple times.
 *
 * Run with: pnpm db:seed
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { monthKeyOf, monthStart } from "@/lib/dates";
import { toCents } from "@/lib/money";
import {
  categories,
  household,
  membership,
  recurringBills,
  savingsGoals,
  transactions,
  user,
} from "@/db/schema";

const PEOPLE = {
  willian: {
    email: "willianpoerari.dev@gmail.com",
    name: "Willian",
    password: process.env.SEED_WILLIAN_PASSWORD ?? "casaWeA@2026",
    color: "#6366f1",
  },
  angelica: {
    email: "angelica@wea.app",
    name: "Angélica",
    password: process.env.SEED_ANGELICA_PASSWORD ?? "casaWeA@2026",
    color: "#ec4899",
  },
} as const;

async function ensureUser(p: {
  email: string;
  name: string;
  password: string;
}): Promise<string> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, p.email))
    .limit(1);
  if (existing[0]) return existing[0].id;

  await auth.api.signUpEmail({
    body: { email: p.email, name: p.name, password: p.password },
  });
  const created = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, p.email))
    .limit(1);
  if (!created[0]) throw new Error(`Failed to create user ${p.email}`);
  return created[0].id;
}

async function ensureHousehold(name: string): Promise<string> {
  const existing = await db
    .select({ id: household.id })
    .from(household)
    .where(eq(household.name, name))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [row] = await db.insert(household).values({ name }).returning();
  return row.id;
}

async function ensureMembership(args: {
  householdId: string;
  userId: string;
  displayName: string;
  color: string;
  role: "owner" | "member";
}) {
  const existing = await db
    .select({ id: membership.id })
    .from(membership)
    .where(
      and(
        eq(membership.householdId, args.householdId),
        eq(membership.userId, args.userId),
      ),
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(membership).values(args);
}

type CatSeed = { kind: "income" | "expense"; name: string; color: string; icon: string };
const DEFAULT_CATEGORIES: CatSeed[] = [
  { kind: "income", name: "Salário", color: "#22c55e", icon: "Banknote" },
  { kind: "income", name: "Freela / PJ", color: "#10b981", icon: "Laptop" },
  { kind: "income", name: "Outros (entrada)", color: "#84cc16", icon: "Plus" },
  { kind: "expense", name: "Moradia", color: "#3b82f6", icon: "Home" },
  { kind: "expense", name: "Contas da casa", color: "#06b6d4", icon: "Zap" },
  { kind: "expense", name: "Mercado", color: "#f97316", icon: "ShoppingCart" },
  { kind: "expense", name: "Transporte", color: "#eab308", icon: "Car" },
  { kind: "expense", name: "Lazer", color: "#ec4899", icon: "PartyPopper" },
  { kind: "expense", name: "Saúde", color: "#ef4444", icon: "HeartPulse" },
  { kind: "expense", name: "Educação", color: "#8b5cf6", icon: "GraduationCap" },
  { kind: "expense", name: "Pensão", color: "#64748b", icon: "Baby" },
  { kind: "expense", name: "Outros (saída)", color: "#9ca3af", icon: "MoreHorizontal" },
];

async function main() {
  console.log("🌱 Seeding Casa W&A...");

  const householdId = await ensureHousehold("Casa W&A");
  const willianId = await ensureUser(PEOPLE.willian);
  const angelicaId = await ensureUser(PEOPLE.angelica);

  await ensureMembership({
    householdId,
    userId: willianId,
    displayName: PEOPLE.willian.name,
    color: PEOPLE.willian.color,
    role: "owner",
  });
  await ensureMembership({
    householdId,
    userId: angelicaId,
    displayName: PEOPLE.angelica.name,
    color: PEOPLE.angelica.color,
    role: "member",
  });

  // Categories
  const existingCats = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.householdId, householdId));
  if (existingCats.length === 0) {
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, householdId, isDefault: true })),
    );
    console.log(`  + ${DEFAULT_CATEGORIES.length} categorias`);
  }

  const catByName = new Map(
    (
      await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.householdId, householdId))
    ).map((c) => [c.name, c.id]),
  );

  // Recurring fixed bills (real numbers)
  const existingBills = await db
    .select({ id: recurringBills.id })
    .from(recurringBills)
    .where(eq(recurringBills.householdId, householdId));
  if (existingBills.length === 0) {
    await db.insert(recurringBills).values([
      { householdId, name: "Aluguel", amountCents: toCents(950), categoryId: catByName.get("Moradia"), dueDay: 10, payerUserId: willianId, scope: "shared", splitKind: "equal" },
      { householdId, name: "Água", amountCents: toCents(100), categoryId: catByName.get("Contas da casa"), dueDay: 10, payerUserId: willianId, scope: "shared", splitKind: "equal" },
      { householdId, name: "Luz", amountCents: toCents(175), categoryId: catByName.get("Contas da casa"), dueDay: 15, payerUserId: willianId, scope: "shared", splitKind: "equal" },
      { householdId, name: "Internet", amountCents: toCents(10), categoryId: catByName.get("Contas da casa"), dueDay: 20, payerUserId: willianId, scope: "shared", splitKind: "equal" },
      { householdId, name: "Pensão alimentícia", amountCents: toCents(1000), categoryId: catByName.get("Pensão"), dueDay: 5, payerUserId: willianId, scope: "personal", splitKind: "none" },
    ]);
    console.log("  + 5 contas fixas (aluguel, água, luz, internet, pensão)");
  }

  // Savings goals
  const existingGoals = await db
    .select({ id: savingsGoals.id })
    .from(savingsGoals)
    .where(eq(savingsGoals.householdId, householdId));
  if (existingGoals.length === 0) {
    await db.insert(savingsGoals).values([
      { householdId, ownerUserId: null, scope: "shared", name: "Reserva de emergência", targetCents: toCents(10000), currentCents: 0, color: "#10b981", icon: "ShieldCheck" },
      { householdId, ownerUserId: null, scope: "shared", name: "Viagem a dois", targetCents: toCents(5000), currentCents: 0, color: "#f59e0b", icon: "Plane" },
    ]);
    console.log("  + 2 metas de poupança");
  }

  // Example current month so the dashboard isn't empty
  const existingTx = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.householdId, householdId))
    .limit(1);
  if (!existingTx[0]) {
    const month = monthKeyOf();
    const first = monthStart(month);
    const bills = await db
      .select()
      .from(recurringBills)
      .where(eq(recurringBills.householdId, householdId));

    await db.insert(transactions).values([
      // incomes
      { householdId, date: first, kind: "income", amountCents: toCents(4500), categoryId: catByName.get("Salário"), payerUserId: willianId, scope: "personal", description: "Salário Willian", paid: true },
      { householdId, date: first, kind: "income", amountCents: toCents(2000), categoryId: catByName.get("Salário"), payerUserId: angelicaId, scope: "personal", description: "Salário Angélica", paid: true },
      // fixed bills generated as pending expenses
      ...bills.map((b) => ({
        householdId,
        date: `${month}-${String(b.dueDay).padStart(2, "0")}`,
        kind: "expense" as const,
        amountCents: b.amountCents,
        categoryId: b.categoryId,
        payerUserId: b.payerUserId,
        scope: b.scope,
        description: b.name,
        paid: false,
        recurringBillId: b.id,
        billMonth: month,
      })),
    ]);
    console.log(`  + mês de exemplo (${month}): 2 entradas + ${bills.length} contas`);
  }

  console.log("\n✅ Seed concluído!");
  console.log("   Login:");
  console.log(`   • ${PEOPLE.willian.name}:  ${PEOPLE.willian.email}  /  ${PEOPLE.willian.password}`);
  console.log(`   • ${PEOPLE.angelica.name}: ${PEOPLE.angelica.email}  /  ${PEOPLE.angelica.password}`);
  console.log("   (troque as senhas depois)\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed falhou:", err);
    process.exit(1);
  });
