import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICS, "");
}

/**
 * Cross-module glue: when a workout/study session is logged, mark the matching
 * habit(s) as done for that day. Matches active habits owned by the same person
 * (or shared) whose name contains a keyword. Idempotent (upsert).
 */
export async function markHabitsByKeyword(
  householdId: string,
  ownerUserId: string | null,
  dateKey: string,
  keywords: string[],
): Promise<void> {
  const rows = await db
    .select({
      id: habits.id,
      name: habits.name,
      target: habits.targetPerPeriod,
      ownerUserId: habits.ownerUserId,
    })
    .from(habits)
    .where(and(eq(habits.householdId, householdId), eq(habits.active, true)));

  const kws = keywords.map(normalize);
  const ownsMatch = (habitOwner: string | null) =>
    ownerUserId ? habitOwner === ownerUserId || habitOwner == null : habitOwner == null;

  for (const h of rows) {
    if (!ownsMatch(h.ownerUserId)) continue;
    if (!kws.some((k) => normalize(h.name).includes(k))) continue;
    await db
      .insert(habitLogs)
      .values({ habitId: h.id, householdId, date: dateKey, count: h.target })
      .onConflictDoUpdate({
        target: [habitLogs.habitId, habitLogs.date],
        set: { count: h.target },
      });
  }
}
