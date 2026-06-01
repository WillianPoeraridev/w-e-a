import { getSavingsGoals } from "@/features/financas/queries";
import { getHabitsWithStats } from "@/features/habitos/queries";
import { getStudySessions } from "@/features/estudos/queries";
import { getWorkouts } from "@/features/treino/queries";
import { addDaysKey, todaySP } from "@/lib/dates";
import { sumCents } from "@/lib/money";

export const LINKED_METRICS = [
  { key: "savings_total", label: "Total guardado (poupança)", hint: "alvo em R$", unit: "money" },
  { key: "workouts_week", label: "Treinos por semana", hint: "alvo: nº/semana", unit: "count" },
  { key: "study_week_min", label: "Estudo por semana", hint: "alvo: min/semana", unit: "minutes" },
  { key: "habit_streak", label: "Sequência de um hábito", hint: "alvo: dias seguidos", unit: "days" },
] as const;

export type LinkedMetric = (typeof LINKED_METRICS)[number]["key"];

export type MetricContext = {
  savingsTotalCents: number;
  workoutsThisWeek: number;
  studyMinThisWeek: number;
  habitStreak: Map<string, number>;
};

/** Fetch the cross-module data once so many linked goals reuse it. */
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

function pct(current: number, target: number): number {
  return target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
}

/** Live progress (0–100) for a goal linked to a module metric. */
export function computeLinkedProgress(
  metric: string,
  targetValue: number,
  linkedRef: string | null,
  ctx: MetricContext,
): number {
  switch (metric) {
    case "savings_total":
      return pct(ctx.savingsTotalCents, targetValue);
    case "workouts_week":
      return pct(ctx.workoutsThisWeek, targetValue);
    case "study_week_min":
      return pct(ctx.studyMinThisWeek, targetValue);
    case "habit_streak":
      return pct(linkedRef ? ctx.habitStreak.get(linkedRef) ?? 0 : 0, targetValue);
    default:
      return 0;
  }
}

/** Human "atual / alvo" line for a linked goal. */
export function metricLabel(
  metric: string,
  targetValue: number,
  linkedRef: string | null,
  ctx: MetricContext,
): string {
  switch (metric) {
    case "savings_total":
      return `${(ctx.savingsTotalCents / 100).toLocaleString("pt-BR")} / ${(targetValue / 100).toLocaleString("pt-BR")}`;
    case "workouts_week":
      return `${ctx.workoutsThisWeek} / ${targetValue} treinos/sem`;
    case "study_week_min":
      return `${ctx.studyMinThisWeek} / ${targetValue} min/sem`;
    case "habit_streak":
      return `${(linkedRef ? ctx.habitStreak.get(linkedRef) ?? 0 : 0)} / ${targetValue} dias`;
    default:
      return "";
  }
}
