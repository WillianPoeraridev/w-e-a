import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  recurringBills,
  savingsGoals,
  transactions,
} from "@/db/schema";
import {
  monthKeyOf,
  monthLabel,
  monthStart,
  nextMonthStart,
  shiftMonth,
  type MonthKey,
} from "@/lib/dates";
import type { Member } from "@/lib/household";
import { splitEqually, sumCents } from "@/lib/money";
import { cache } from "react";

export type TxRow = {
  id: string;
  date: string;
  kind: "income" | "expense" | "settlement";
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
  settled: number;
  fairShare: number;
  balance: number; // paid - fairShare; positive => is owed
};

export type CoupleSplit = {
  total: number;
  members: SplitMember[];
  /** Human settlement for the 2-person case, or null when even. */
  settlement: {
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    amount: number;
  } | null;
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
  const settlements = rows.filter((r) => r.kind === "settlement" && r.scope === "shared");
  const sharedTotal = sumCents(shared.map((r) => r.amountCents));
  const fair = splitEqually(sharedTotal, Math.max(members.length, 1));
  const splitMembers: SplitMember[] = members.map((m, i) => {
    const paid = sumCents(
      shared.filter((r) => r.payerUserId === m.userId).map((r) => r.amountCents),
    );
    const settled = settlementNetForMember(settlements, members, m.userId);
    return {
      userId: m.userId,
      name: m.displayName,
      color: m.color,
      paid,
      settled,
      fairShare: fair[i] ?? 0,
      balance: paid - (fair[i] ?? 0) + settled,
    };
  });

  let settlement: CoupleSplit["settlement"] = null;
  if (splitMembers.length === 2) {
    const [a, b] = splitMembers;
    const creditor = a.balance >= b.balance ? a : b;
    const debtor = creditor === a ? b : a;
    const amount = Math.min(creditor.balance, -debtor.balance);
    if (amount > 0) {
      settlement = {
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount,
      };
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

function settlementNetForMember(rows: TxRow[], members: Member[], userId: string) {
  if (members.length !== 2) return 0;
  const partnerIds = members
    .filter((m) => m.userId !== userId)
    .map((m) => m.userId);
  const paid = sumCents(
    rows.filter((r) => r.payerUserId === userId).map((r) => r.amountCents),
  );
  const received = sumCents(
    rows
      .filter((r) => r.payerUserId !== null && partnerIds.includes(r.payerUserId))
      .map((r) => r.amountCents),
  );
  return paid - received;
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

export const getSavingsGoals = cache(_getSavingsGoals);
async function _getSavingsGoals(householdId: string) {
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

const SHORT_MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export type YearMonthPoint = {
  month: number;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type YearOverview = {
  year: number;
  months: YearMonthPoint[];
  income: number;
  expense: number;
  balance: number;
  activeMonths: number;
  avgIncome: number;
  avgExpense: number;
  avgBalance: number;
  savingsRate: number;
  byCategory: { id: string; name: string; color: string; total: number }[];
};

/** Full-year breakdown: 12 months + totals, averages, savings rate, categories. */
export async function getYearOverview(
  householdId: string,
  year: number,
): Promise<YearOverview> {
  const rows = await db
    .select({
      date: transactions.date,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.householdId, householdId),
        gte(transactions.date, `${year}-01-01`),
        lt(transactions.date, `${year + 1}-01-01`),
      ),
    );

  const months: YearMonthPoint[] = SHORT_MONTHS.map((label, i) => {
    const m = i + 1;
    const monthRows = rows.filter((r) => Number(r.date.slice(5, 7)) === m);
    const income = sumCents(
      monthRows.filter((r) => r.kind === "income").map((r) => r.amountCents),
    );
    const expense = sumCents(
      monthRows.filter((r) => r.kind === "expense").map((r) => r.amountCents),
    );
    return { month: m, label, income, expense, balance: income - expense };
  });

  const income = sumCents(months.map((m) => m.income));
  const expense = sumCents(months.map((m) => m.expense));
  const balance = income - expense;
  const activeMonths = months.filter((m) => m.income > 0 || m.expense > 0).length;
  const div = activeMonths || 1;

  const catMap = new Map<string, { name: string; color: string; total: number }>();
  for (const r of rows) {
    if (r.kind !== "expense") continue;
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

  return {
    year,
    months,
    income,
    expense,
    balance,
    activeMonths,
    avgIncome: Math.round(income / div),
    avgExpense: Math.round(expense / div),
    avgBalance: Math.round(balance / div),
    savingsRate: income > 0 ? balance / income : 0,
    byCategory,
  };
}

export type AccumulatedPoint = {
  month: MonthKey;
  label: string;
  balance: number;
  cumulative: number;
};

export type AccumulatedOverview = {
  points: AccumulatedPoint[];
  allTimeIncome: number;
  allTimeExpense: number;
  allTimeBalance: number;
  savedTotal: number;
  savedTarget: number;
};

/** Long-term view: cumulative balance over time + all-time totals + savings. */
export async function getAccumulated(
  householdId: string,
): Promise<AccumulatedOverview> {
  const rows = await db
    .select({
      date: transactions.date,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
    })
    .from(transactions)
    .where(eq(transactions.householdId, householdId))
    .orderBy(transactions.date);

  const goals = await db
    .select({
      currentCents: savingsGoals.currentCents,
      targetCents: savingsGoals.targetCents,
    })
    .from(savingsGoals)
    .where(eq(savingsGoals.householdId, householdId));

  const allTimeIncome = sumCents(
    rows.filter((r) => r.kind === "income").map((r) => r.amountCents),
  );
  const allTimeExpense = sumCents(
    rows.filter((r) => r.kind === "expense").map((r) => r.amountCents),
  );

  const points: AccumulatedPoint[] = [];
  if (rows.length > 0) {
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const r of rows) {
      const key = r.date.slice(0, 7);
      const cur = byMonth.get(key) ?? { income: 0, expense: 0 };
      if (r.kind === "income") cur.income += r.amountCents;
      else if (r.kind === "expense") cur.expense += r.amountCents;
      byMonth.set(key, cur);
    }
    const firstMonth = rows[0].date.slice(0, 7);
    const lastTxMonth = rows[rows.length - 1].date.slice(0, 7);
    const current = monthKeyOf();
    const endMonth = current > lastTxMonth ? current : lastTxMonth;

    let cursor = firstMonth;
    let cumulative = 0;
    for (let i = 0; i < 600; i++) {
      const mv = byMonth.get(cursor) ?? { income: 0, expense: 0 };
      const balance = mv.income - mv.expense;
      cumulative += balance;
      const [yy, mm] = cursor.split("-");
      points.push({
        month: cursor,
        label: `${SHORT_MONTHS[Number(mm) - 1]}/${yy.slice(2)}`,
        balance,
        cumulative,
      });
      if (cursor === endMonth) break;
      cursor = shiftMonth(cursor, 1);
    }
  }

  return {
    points,
    allTimeIncome,
    allTimeExpense,
    allTimeBalance: allTimeIncome - allTimeExpense,
    savedTotal: sumCents(goals.map((g) => g.currentCents)),
    savedTarget: sumCents(goals.map((g) => g.targetCents)),
  };
}
