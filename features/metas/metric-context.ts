import { getStudySessions } from "@/features/estudos/queries";
import { getSavingsGoals } from "@/features/financas/queries";
import { getHabitsWithStats } from "@/features/habitos/queries";
import { getWorkouts } from "@/features/treino/queries";
import { addDaysKey, todaySP } from "@/lib/dates";
import { sumCents } from "@/lib/money";
import type { MetricContext } from "./metrics";

/** Cross-module data fetched once so many linked goals can reuse it (server). */
export async function getMetricContext(householdId: string): Promise<MetricContext> {
  const today = todaySP();
  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());

  const [savings, workouts, sessions, habits] = await Promise.all([
    getSavingsGoals(householdId),
    getWorkouts(householdId),
    getStudySessions(householdId),
    getHabitsWithStats(householdId),
  ]);

  return {
    savingsTotalCents: sumCents(savings.map((g) => g.currentCents)),
    workoutsThisWeek: workouts.filter((w) => w.date >= weekStart && w.date <= today).length,
    studyMinThisWeek: sessions
      .filter((s) => s.date >= weekStart && s.date <= today)
      .reduce((a, s) => a + s.minutes, 0),
    habitStreak: new Map(habits.map((h) => [h.id, h.stats.streak])),
  };
}
