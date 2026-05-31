import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  recurringBills,
  savingsGoals,
  transactions,
} from "@/db/schema";
import {
  monthLabel,
  monthStart,
  nextMonthStart,
  shiftMonth,
  type MonthKey,
} from "@/lib/dates";
import type { Member } from "@/lib/household";
import { splitEqually, sumCents } from "@/lib/money";

export type TxRow = {
  id: string;
  date: string;
  kind: "income" | "expense";
  amountCents: number;
  scope: "personal" | "shared";
  description: string | null;
  paid: boolean;
  payerUserId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  recurringBillId: string | null;
};

export async function getCategories(householdId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.householdId, householdId))
    .orderBy(categories.kind, categories.name);
}

export async function getMonthTransactions(
  householdId: string,
  month: MonthKey,
): Promise<TxRow[]> {
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
      scope: transactions.scope,
      description: transactions.description,
      paid: transactions.paid,
      payerUserId: transactions.payerUserId,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      recurringBillId: transactions.recurringBillId,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.householdId, householdId),
        gte(transactions.date, monthStart(month)),
        lt(transactions.date, nextMonthStart(month)),
      ),
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export type PersonTotals = {
  userId: string;
  name: string;
  color: string;
  income: number;
  expense: number;
};

export type SplitMember = {
  userId: string;
  name: string;
  color: string;
  paid: number;
  fairShare: number;
  balance: number; // paid - fairShare; positive => is owed
};

export type CoupleSplit = {
  total: number;
  members: SplitMember[];
  /** Human settlement for the 2-person case, or null when even. */
  settlement: { fromName: string; toName: string; amount: number } | null;
};

export type MonthOverview = {
  month: MonthKey;
  label: string;
  income: number;
  expense: number;
  expensePaid: number;
  expensePending: number;
  balance: number;
  txCount: number;
  byCategory: { id: string; name: string; color: string; total: number }[];
  byPerson: PersonTotals[];
  split: CoupleSplit;
};

export function computeOverview(
  month: MonthKey,
  rows: TxRow[],
  members: Member[],
): MonthOverview {
  const incomes = rows.filter((r) => r.kind === "income");
  const expenses = rows.filter((r) => r.kind === "expense");

  const income = sumCents(incomes.map((r) => r.amountCents));
  const expense = sumCents(expenses.map((r) => r.amountCents));
  const expensePaid = sumCents(
    expenses.filter((r) => r.paid).map((r) => r.amountCents),
  );

  // Expenses grouped by category
  const catMap = new Map<string, { name: string; color: string; total: number }>();
  for (const r of expenses) {
    const id = r.categoryId ?? "none";
    const cur = catMap.get(id) ?? {
      name: r.categoryName ?? "Sem categoria",
      color: r.categoryColor ?? "#9ca3af",
      total: 0,
    };
    cur.total += r.amountCents;
    catMap.set(id, cur);
  }
  const byCategory = [...catMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total);

  // Per-person income/expense
  const byPerson: PersonTotals[] = members.map((m) => ({
    userId: m.userId,
    name: m.displayName,
    color: m.color,
    income: sumCents(
      incomes.filter((r) => r.payerUserId === m.userId).map((r) => r.amountCents),
    ),
    expense: sumCents(
      expenses.filter((r) => r.payerUserId === m.userId).map((r) => r.amountCents),
    ),
  }));

  // Couple split: shared expenses divided equally; who paid vs fair share
  const shared = expenses.filter((r) => r.scope === "shared");
  const sharedTotal = sumCents(shared.map((r) => r.amountCents));
  const fair = splitEqually(sharedTotal, Math.max(members.length, 1));
  const splitMembers: SplitMember[] = members.map((m, i) => {
    const paid = sumCents(
      shared.filter((r) => r.payerUserId === m.userId).map((r) => r.amountCents),
    );
    return {
      userId: m.userId,
      name: m.displayName,
      color: m.color,
      paid,
      fairShare: fair[i] ?? 0,
      balance: paid - (fair[i] ?? 0),
    };
  });

  let settlement: CoupleSplit["settlement"] = null;
  if (splitMembers.length === 2) {
    const [a, b] = splitMembers;
    const creditor = a.balance >= b.balance ? a : b;
    const debtor = creditor === a ? b : a;
    const amount = Math.min(creditor.balance, -debtor.balance);
    if (amount > 0) {
      settlement = { fromName: debtor.name, toName: creditor.name, amount };
    }
  }

  return {
    month,
    label: monthLabel(month),
    income,
    expense,
    expensePaid,
    expensePending: expense - expensePaid,
    balance: income - expense,
    txCount: rows.length,
    byCategory,
    byPerson,
    split: { total: sharedTotal, members: splitMembers, settlement },
  };
}

export async function getMonthOverview(
  householdId: string,
  month: MonthKey,
  members: Member[],
): Promise<MonthOverview> {
  const rows = await getMonthTransactions(householdId, month);
  return computeOverview(month, rows, members);
}

export type TrendPoint = {
  month: MonthKey;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export async function getBalanceTrend(
  householdId: string,
  currentMonth: MonthKey,
  monthsBack = 6,
): Promise<TrendPoint[]> {
  const firstMonth = shiftMonth(currentMonth, -(monthsBack - 1));
  const rows = await db
    .select({
      date: transactions.date,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        gte(transactions.date, monthStart(firstMonth)),
        lt(transactions.date, nextMonthStart(currentMonth)),
      ),
    );

  const points: TrendPoint[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const m = shiftMonth(firstMonth, i);
    const monthRows = rows.filter((r) => r.date.slice(0, 7) === m);
    const income = sumCents(
      monthRows.filter((r) => r.kind === "income").map((r) => r.amountCents),
    );
    const expense = sumCents(
      monthRows.filter((r) => r.kind === "expense").map((r) => r.amountCents),
    );
    points.push({
      month: m,
      label: monthLabel(m).split(" ")[0].slice(0, 3),
      income,
      expense,
      balance: income - expense,
    });
  }
  return points;
}

export async function getRecurringBills(householdId: string) {
  return db
    .select({
      id: recurringBills.id,
      name: recurringBills.name,
      amountCents: recurringBills.amountCents,
      dueDay: recurringBills.dueDay,
      payerUserId: recurringBills.payerUserId,
      scope: recurringBills.scope,
      splitKind: recurringBills.splitKind,
      active: recurringBills.active,
      categoryId: recurringBills.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(recurringBills)
    .leftJoin(categories, eq(recurringBills.categoryId, categories.id))
    .where(eq(recurringBills.householdId, householdId))
    .orderBy(recurringBills.dueDay);
}

export async function getSavingsGoals(householdId: string) {
  return db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.householdId, householdId))
    .orderBy(desc(savingsGoals.createdAt));
}

/** Which recurring bills already have a transaction generated for the month. */
export async function getGeneratedBillIds(
  householdId: string,
  month: MonthKey,
): Promise<Set<string>> {
  const rows = await db
    .select({ recurringBillId: transactions.recurringBillId })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.billMonth, month),
      ),
    );
  return new Set(rows.map((r) => r.recurringBillId).filter(Boolean) as string[]);
}
