"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { requireHousehold } from "@/lib/household";
import { habitSchema, type HabitInput } from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parse(form: FormData): HabitInput {
  return habitSchema.parse({
    name: str(form, "name"),
    color: str(form, "color") ?? "#6366f1",
    target: Number(form.get("target") ?? 1),
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "shared",
    timeOfDay: str(form, "timeOfDay"),
    icon: str(form, "icon"),
  });
}

function revalidateHabits() {
  revalidatePath("/habitos");
  revalidatePath("/");
}

export async function createHabit(form: FormData) {
  const ctx = await requireHousehold();
  const input = parse(form);
  await db.insert(habits).values({
    householdId: ctx.householdId,
    ownerUserId: input.ownerUserId,
    scope: input.scope,
    name: input.name,
    color: input.color,
    icon: input.icon,
    timeOfDay: input.timeOfDay,
    cadence: "daily",
    targetPerPeriod: input.target,
  });
  revalidateHabits();
}

export async function updateHabit(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Hábito inválido.");
  const input = parse(form);
  await db
    .update(habits)
    .set({
      ownerUserId: input.ownerUserId,
      scope: input.scope,
      name: input.name,
      color: input.color,
      icon: input.icon,
      timeOfDay: input.timeOfDay,
      targetPerPeriod: input.target,
    })
    .where(and(eq(habits.id, id), eq(habits.householdId, ctx.householdId)));
  revalidateHabits();
}

export async function deleteHabit(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(habits)
    .where(and(eq(habits.id, id), eq(habits.householdId, ctx.householdId)));
  revalidateHabits();
}

/** Set a habit's count for a given day (0 removes the log). */
export async function setHabitCount(
  habitId: string,
  dateKey: string,
  count: number,
) {
  const ctx = await requireHousehold();
  const [owned] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.householdId, ctx.householdId)))
    .limit(1);
  if (!owned) throw new Error("Hábito não encontrado.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("Data inválida.");

  const c = Math.max(0, Math.floor(count));
  if (c === 0) {
    await db
      .delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, dateKey)));
  } else {
    await db
      .insert(habitLogs)
      .values({ habitId, householdId: ctx.householdId, date: dateKey, count: c })
      .onConflictDoUpdate({
        target: [habitLogs.habitId, habitLogs.date],
        set: { count: c },
      });
  }
  revalidateHabits();
}
