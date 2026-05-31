"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { workoutSets, workouts } from "@/db/schema";
import { requireHousehold } from "@/lib/household";
import {
  exercisesSchema,
  workoutSchema,
  type ExerciseInput,
  type WorkoutInput,
} from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function num(form: FormData, key: string): number | null {
  const s = str(form, key);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseWorkout(form: FormData): WorkoutInput {
  return workoutSchema.parse({
    date: str(form, "date"),
    title: str(form, "title"),
    kind: str(form, "kind") ?? "strength",
    durationMin: num(form, "durationMin"),
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "personal",
    notes: str(form, "notes"),
  });
}

function parseExercises(form: FormData): ExerciseInput[] {
  const raw = form.get("exercises");
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(String(raw));
  } catch {
    throw new Error("Lista de exercícios inválida.");
  }
  return exercisesSchema.parse(json);
}

function revalidateTreino() {
  revalidatePath("/treino");
  revalidatePath("/");
}

async function insertSets(workoutId: string, exercises: ExerciseInput[]) {
  if (exercises.length === 0) return;
  await db.insert(workoutSets).values(
    exercises.map((e, i) => ({
      workoutId,
      exercise: e.exercise,
      weightGrams: e.weightGrams,
      reps: e.reps,
      sets: e.sets,
      sortOrder: i,
    })),
  );
}

export async function createWorkout(form: FormData) {
  const ctx = await requireHousehold();
  const input = parseWorkout(form);
  const exercises = parseExercises(form);

  const [row] = await db
    .insert(workouts)
    .values({
      householdId: ctx.householdId,
      ownerUserId: input.ownerUserId,
      scope: input.scope,
      date: input.date,
      title: input.title,
      kind: input.kind,
      durationMin: input.durationMin,
      notes: input.notes,
    })
    .returning({ id: workouts.id });

  await insertSets(row.id, exercises);
  revalidateTreino();
}

export async function updateWorkout(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Treino inválido.");
  const input = parseWorkout(form);
  const exercises = parseExercises(form);

  const updated = await db
    .update(workouts)
    .set({
      ownerUserId: input.ownerUserId,
      scope: input.scope,
      date: input.date,
      title: input.title,
      kind: input.kind,
      durationMin: input.durationMin,
      notes: input.notes,
    })
    .where(and(eq(workouts.id, id), eq(workouts.householdId, ctx.householdId)))
    .returning({ id: workouts.id });
  if (updated.length === 0) throw new Error("Treino não encontrado.");

  // Replace the set list.
  await db.delete(workoutSets).where(eq(workoutSets.workoutId, id));
  await insertSets(id, exercises);
  revalidateTreino();
}

export async function deleteWorkout(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.householdId, ctx.householdId)));
  revalidateTreino();
}
