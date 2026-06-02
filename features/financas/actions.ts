"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  categories,
  recurringBills,
  savingsGoals,
  transactions,
} from "@/db/schema";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { parseBRLToCents } from "@/lib/money";
import {
  categorySchema,
  recurringBillSchema,
  savingsGoalSchema,
  transactionSchema,
} from "./schema";
import { computeOverview, getMonthTransactions } from "./queries";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function amount(form: FormData, key = "amount"): number {
  const cents = parseBRLToCents(String(form.get(key) ?? ""));
  if (cents === null) throw new Error("Informe um valor válido.");
  return cents;
}

function cents(form: FormData, key: string): number {
  const value = Number(form.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error("Valor inválido.");
  return value;
}

function revalidateFinance() {
  revalidatePath("/financas");
  revalidatePath("/");
}

// ── Transactions ────────────────────────────────────────────────────────────

export async function createTransaction(form: FormData) {
  const ctx = await requireHousehold();
  const input = transactionSchema.parse({
    date: str(form, "date"),
    kind: str(form, "kind"),
    amountCents: amount(form),
    categoryId: str(form, "categoryId"),
    payerUserId: str(form, "payerUserId"),
    scope: str(form, "scope") ?? "shared",
    description: str(form, "description"),
    paid: form.get("paid") === "on" || form.get("paid") === "true",
  });

  await db.insert(transactions).values({ householdId: ctx.householdId, ...input });
  revalidateFinance();
}

export async function updateTransaction(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Transação inválida.");
  const input = transactionSchema.parse({
    date: str(form, "date"),
    kind: str(form, "kind"),
    amountCents: amount(form),
    categoryId: str(form, "categoryId"),
    payerUserId: str(form, "payerUserId"),
    scope: str(form, "scope") ?? "shared",
    description: str(form, "description"),
    paid: form.get("paid") === "on" || form.get("paid") === "true",
  });

  await db
    .update(transactions)
    .set(input)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.householdId, ctx.householdId),
      ),
    );
  revalidateFinance();
}

export async function deleteTransaction(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.householdId, ctx.householdId),
      ),
    );
  revalidateFinance();
}

export async function toggleTransactionPaid(id: string, paid: boolean) {
  const ctx = await requireHousehold();
  await db
    .update(transactions)
    .set({ paid })
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.householdId, ctx.householdId),
      ),
    );
  revalidateFinance();
}

export async function createSplitSettlement(form: FormData) {
  const ctx = await requireHousehold();
  const month = str(form, "month");
  const date = str(form, "date") ?? todaySP();
  const fromUserId = str(form, "fromUserId");
  const requestedAmount = str(form, "amount") ? amount(form, "amount") : cents(form, "amountCents");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new Error("Mês inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !date.startsWith(month)) {
    throw new Error("Data inválida para o mês selecionado.");
  }

  const rows = await getMonthTransactions(ctx.householdId, month);
  const overview = computeOverview(month, rows, ctx.members);
  const settlement = overview.split.settlement;
  if (!settlement || settlement.fromUserId !== fromUserId) {
    throw new Error("Não há acerto pendente para registrar.");
  }

  const amountCents = Math.min(requestedAmount, settlement.amount);
  await db.insert(transactions).values({
    householdId: ctx.householdId,
    date,
    kind: "settlement",
    amountCents,
    categoryId: null,
    payerUserId: settlement.fromUserId,
    scope: "shared",
    description: `Acerto do casal: ${settlement.fromName} -> ${settlement.toName}`,
    paid: true,
  });
  revalidateFinance();
}

// ── Recurring bills → generate the month ─────────────────────────────────────

export async function generateMonthBills(month: string) {
  const ctx = await requireHousehold();

  const bills = await db
    .select()
    .from(recurringBills)
    .where(
      and(
        eq(recurringBills.householdId, ctx.householdId),
        eq(recurringBills.active, true),
      ),
    );

  const existing = await db
    .select({ recurringBillId: transactions.recurringBillId })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, ctx.householdId),
        eq(transactions.billMonth, month),
      ),
    );
  const done = new Set(existing.map((e) => e.recurringBillId).filter(Boolean));

  const toInsert = bills
    .filter((b) => !done.has(b.id))
    .map((b) => ({
      householdId: ctx.householdId,
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
    }));

  if (toInsert.length > 0) {
    await db.insert(transactions).values(toInsert);
  }
  revalidateFinance();
  return { generated: toInsert.length };
}

export async function createRecurringBill(form: FormData) {
  const ctx = await requireHousehold();
  const input = recurringBillSchema.parse({
    name: str(form, "name"),
    amountCents: amount(form),
    categoryId: str(form, "categoryId"),
    dueDay: Number(form.get("dueDay") ?? 10),
    payerUserId: str(form, "payerUserId"),
    scope: str(form, "scope") ?? "shared",
    splitKind: str(form, "splitKind") ?? "equal",
  });
  await db.insert(recurringBills).values({ householdId: ctx.householdId, ...input });
  revalidateFinance();
}

export async function deleteRecurringBill(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(recurringBills)
    .where(
      and(
        eq(recurringBills.id, id),
        eq(recurringBills.householdId, ctx.householdId),
      ),
    );
  revalidateFinance();
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(form: FormData) {
  const ctx = await requireHousehold();
  const input = categorySchema.parse({
    kind: str(form, "kind"),
    name: str(form, "name"),
    color: str(form, "color") ?? "#6366f1",
    icon: str(form, "icon"),
  });
  await db.insert(categories).values({ householdId: ctx.householdId, ...input });
  revalidateFinance();
}

export async function deleteCategory(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(categories)
    .where(
      and(eq(categories.id, id), eq(categories.householdId, ctx.householdId)),
    );
  revalidateFinance();
}

// ── Savings goals ────────────────────────────────────────────────────────────

export async function createSavingsGoal(form: FormData) {
  const ctx = await requireHousehold();
  const currentRaw = parseBRLToCents(String(form.get("current") ?? "0")) ?? 0;
  const input = savingsGoalSchema.parse({
    name: str(form, "name"),
    targetCents: amount(form, "target"),
    currentCents: currentRaw,
    color: str(form, "color") ?? "#10b981",
    deadline: str(form, "deadline"),
  });
  await db.insert(savingsGoals).values({
    householdId: ctx.householdId,
    scope: "shared",
    ...input,
  });
  revalidateFinance();
}

export async function contributeSavings(id: string, deltaCents: number) {
  const ctx = await requireHousehold();
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(
      and(eq(savingsGoals.id, id), eq(savingsGoals.householdId, ctx.householdId)),
    )
    .limit(1);
  if (!goal) throw new Error("Meta não encontrada.");
  const next = Math.max(0, goal.currentCents + deltaCents);
  await db
    .update(savingsGoals)
    .set({ currentCents: next })
    .where(eq(savingsGoals.id, id));
  revalidateFinance();
}

export async function deleteSavingsGoal(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(savingsGoals)
    .where(
      and(
        eq(savingsGoals.id, id),
        eq(savingsGoals.householdId, ctx.householdId),
      ),
    );
  revalidateFinance();
}
