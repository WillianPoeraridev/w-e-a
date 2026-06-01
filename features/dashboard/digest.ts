import { getMonthEvents } from "@/features/agenda/queries";
import { getStudySessions } from "@/features/estudos/queries";
import {
  computeOverview,
  getGeneratedBillIds,
  getMonthTransactions,
  getRecurringBills,
  getSavingsGoals,
} from "@/features/financas/queries";
import { getHabitsWithStats, type HabitWithStats } from "@/features/habitos/queries";
import { getGoals } from "@/features/metas/queries";
import { occurrence } from "@/features/relacionamento/dates";
import { getImportantDates } from "@/features/relacionamento/queries";
import { getSleepLogs } from "@/features/sono/queries";
import { getWorkouts } from "@/features/treino/queries";
import { addDaysKey, monthKeyOf } from "@/lib/dates";
import type { HouseholdContext } from "@/lib/household";
import { sumCents } from "@/lib/money";

export type DailyDigest = {
  monthLabel: string;
  finance: {
    income: number;
    expense: number;
    balance: number;
    pending: number;
    projection: number;
    savingsTotal: number;
    savingsTarget: number;
  };
  habits: HabitWithStats[];
  habitsDone: number;
  sleepLast: { date: string; durationMin: number | null; quality: number | null } | null;
  workoutsWeek: number;
  studyWeekMin: number;
  studyStreak: number;
  goalsActive: number;
  goalsAvg: number;
  topGoals: { id: string; title: string; progress: number }[];
  topExpenseCategories: { name: string; total: number }[];
  nextDate: { title: string; days: number; key: string } | null;
  nextEvent: { title: string; dateKey: string; time: string | null } | null;
};

export async function getDailyDigest(
  ctx: HouseholdContext,
  today: string,
): Promise<DailyDigest> {
  const month = monthKeyOf();
  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());

  const [tx, savings, bills, generated, habits, sleep, workouts, sessions, goals, dates, events] =
    await Promise.all([
      getMonthTransactions(ctx.householdId, month),
      getSavingsGoals(ctx.householdId),
      getRecurringBills(ctx.householdId),
      getGeneratedBillIds(ctx.householdId, month),
      getHabitsWithStats(ctx.householdId),
      getSleepLogs(ctx.householdId),
      getWorkouts(ctx.householdId),
      getStudySessions(ctx.householdId),
      getGoals(ctx.householdId),
      getImportantDates(ctx.householdId),
      getMonthEvents(ctx.householdId, month),
    ]);

  const overview = computeOverview(month, tx, ctx.members);
  const billsLeft = bills.filter((b) => b.active && !generated.has(b.id));
  const projection = overview.balance - sumCents(billsLeft.map((b) => b.amountCents));

  // Study streak (consecutive days with a session)
  const studyDays = new Set(sessions.map((s) => s.date));
  let studyStreak = 0;
  let cursor = studyDays.has(today) ? today : addDaysKey(today, -1);
  while (studyDays.has(cursor)) {
    studyStreak++;
    cursor = addDaysKey(cursor, -1);
  }

  const active = goals.filter((g) => g.status === "active");
  const topGoals = [...active]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)
    .map((g) => ({ id: g.id, title: g.title, progress: g.progress }));

  let nextDate: DailyDigest["nextDate"] = null;
  for (const d of dates) {
    const occ = occurrence(d.date, d.recurring, today);
    if (occ.days < 0) continue;
    if (!nextDate || occ.days < nextDate.days) nextDate = { title: d.title, days: occ.days, key: occ.key };
  }

  const nextEv = events.find((e) => e.dateKey >= today);
  const sleepLast = sleep.find((s) => s.ownerUserId === ctx.userId) ?? null;

  return {
    monthLabel: overview.label,
    finance: {
      income: overview.income,
      expense: overview.expense,
      balance: overview.balance,
      pending: overview.expensePending,
      projection,
      savingsTotal: sumCents(savings.map((g) => g.currentCents)),
      savingsTarget: sumCents(savings.map((g) => g.targetCents)),
    },
    habits,
    habitsDone: habits.filter((h) => h.stats.todayDone).length,
    sleepLast: sleepLast
      ? { date: sleepLast.date, durationMin: sleepLast.durationMin, quality: sleepLast.quality }
      : null,
    workoutsWeek: workouts.filter((w) => w.date >= weekStart && w.date <= today).length,
    studyWeekMin: sessions
      .filter((s) => s.date >= weekStart && s.date <= today)
      .reduce((a, s) => a + s.minutes, 0),
    studyStreak,
    goalsActive: active.length,
    goalsAvg: active.length ? Math.round(active.reduce((a, g) => a + g.progress, 0) / active.length) : 0,
    topGoals,
    topExpenseCategories: overview.byCategory.slice(0, 6).map((c) => ({ name: c.name, total: c.total })),
    nextDate,
    nextEvent: nextEv ? { title: nextEv.title, dateKey: nextEv.dateKey, time: nextEv.startTime } : null,
  };
}
