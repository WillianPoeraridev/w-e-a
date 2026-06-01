import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cache } from "react";
import { workoutSets, workouts } from "@/db/schema";
import type { WorkoutKind } from "./lib";

export type SetLite = {
  id: string;
  exercise: string;
  weightGrams: number | null;
  reps: number | null;
  sets: number | null;
};

export type WorkoutLite = {
  id: string;
  date: string;
  title: string;
  kind: WorkoutKind;
  durationMin: number | null;
  notes: string | null;
  ownerUserId: string | null;
  scope: "personal" | "shared";
  sets: SetLite[];
};

export const getWorkouts = cache(_getWorkouts);
async function _getWorkouts(
  householdId: string,
): Promise<WorkoutLite[]> {
  const ws = await db
    .select()
    .from(workouts)
    .where(eq(workouts.householdId, householdId))
    .orderBy(desc(workouts.date), desc(workouts.createdAt));
  if (ws.length === 0) return [];

  const sets = await db
    .select()
    .from(workoutSets)
    .where(
      inArray(
        workoutSets.workoutId,
        ws.map((w) => w.id),
      ),
    )
    .orderBy(asc(workoutSets.sortOrder), asc(workoutSets.createdAt));

  const byWorkout = new Map<string, SetLite[]>();
  for (const s of sets) {
    const list = byWorkout.get(s.workoutId) ?? [];
    list.push({
      id: s.id,
      exercise: s.exercise,
      weightGrams: s.weightGrams,
      reps: s.reps,
      sets: s.sets,
    });
    byWorkout.set(s.workoutId, list);
  }

  return ws.map((w) => ({
    id: w.id,
    date: w.date,
    title: w.title,
    kind: w.kind,
    durationMin: w.durationMin,
    notes: w.notes,
    ownerUserId: w.ownerUserId,
    scope: w.scope,
    sets: byWorkout.get(w.id) ?? [],
  }));
}
