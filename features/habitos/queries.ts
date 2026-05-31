import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { todaySP } from "@/lib/dates";
import { computeHabitStats, type HabitStats } from "./stats";

export type HabitWithStats = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  timeOfDay: string | null;
  target: number;
  cadence: "daily" | "weekly";
  ownerUserId: string | null;
  scope: "personal" | "shared";
  stats: HabitStats;
};

export async function getHabitsWithStats(
  householdId: string,
): Promise<HabitWithStats[]> {
  const today = todaySP();

  const [rows, logs] = await Promise.all([
    db
      .select()
      .from(habits)
      .where(and(eq(habits.householdId, householdId), eq(habits.active, true)))
      .orderBy(asc(habits.sortOrder), asc(habits.createdAt)),
    db
      .select({
        habitId: habitLogs.habitId,
        date: habitLogs.date,
        count: habitLogs.count,
      })
      .from(habitLogs)
      .where(eq(habitLogs.householdId, householdId)),
  ]);

  const byHabit = new Map<string, Map<string, number>>();
  for (const l of logs) {
    const m = byHabit.get(l.habitId) ?? new Map<string, number>();
    m.set(l.date, l.count);
    byHabit.set(l.habitId, m);
  }

  return rows.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    icon: h.icon,
    timeOfDay: h.timeOfDay,
    target: h.targetPerPeriod,
    cadence: h.cadence,
    ownerUserId: h.ownerUserId,
    scope: h.scope,
    stats: computeHabitStats(byHabit.get(h.id) ?? new Map(), h.targetPerPeriod, today),
  }));
}
