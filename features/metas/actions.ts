"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema";
import { requireHousehold } from "@/lib/household";
import { goalSchema, milestoneSchema, type GoalInput } from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parse(form: FormData): GoalInput {
  return goalSchema.parse({
    title: str(form, "title"),
    description: str(form, "description"),
    pillar: str(form, "pillar"),
    status: str(form, "status") ?? "active",
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "shared",
    targetDate: str(form, "targetDate"),
    progress: Number(form.get("progress") ?? 0),
    linkedMetric: str(form, "linkedMetric"),
    targetValue: form.get("targetValue") ? Number(form.get("targetValue")) : null,
    linkedRef: str(form, "linkedRef"),
  });
}

function revalidateMetas() {
  revalidatePath("/metas");
  revalidatePath("/");
}

/** Throws unless the goal belongs to the current household. */
async function assertOwnGoal(goalId: string, householdId: string) {
  const [g] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.householdId, householdId)))
    .limit(1);
  if (!g) throw new Error("Meta não encontrada.");
}

export async function createGoal(form: FormData) {
  const ctx = await requireHousehold();
  const input = parse(form);
  await db.insert(goals).values({
    householdId: ctx.householdId,
    ownerUserId: input.ownerUserId,
    scope: input.scope,
    title: input.title,
    description: input.description,
    pillar: input.pillar,
    status: input.status,
    progress: input.progress,
    targetDate: input.targetDate,
    linkedMetric: input.linkedMetric,
    targetValue: input.targetValue,
    linkedRef: input.linkedRef,
  });
  revalidateMetas();
}

export async function updateGoal(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Meta inválida.");
  const input = parse(form);
  await db
    .update(goals)
    .set({
      ownerUserId: input.ownerUserId,
      scope: input.scope,
      title: input.title,
      description: input.description,
      pillar: input.pillar,
      status: input.status,
      progress: input.progress,
      targetDate: input.targetDate,
      linkedMetric: input.linkedMetric,
      targetValue: input.targetValue,
      linkedRef: input.linkedRef,
    })
    .where(and(eq(goals.id, id), eq(goals.householdId, ctx.householdId)));
  revalidateMetas();
}

export async function setGoalStatus(
  id: string,
  status: "active" | "done" | "paused",
) {
  const ctx = await requireHousehold();
  await db
    .update(goals)
    .set(status === "done" ? { status, progress: 100 } : { status })
    .where(and(eq(goals.id, id), eq(goals.householdId, ctx.householdId)));
  revalidateMetas();
}

export async function deleteGoal(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.householdId, ctx.householdId)));
  revalidateMetas();
}

// ── Milestones (degraus) ─────────────────────────────────────────────────────

export async function addMilestone(goalId: string, title: string) {
  const ctx = await requireHousehold();
  await assertOwnGoal(goalId, ctx.householdId);
  const parsed = milestoneSchema.parse({ title });
  await db.insert(milestones).values({
    goalId,
    title: parsed.title,
    done: 0,
    sortOrder: Date.now() % 1_000_000,
  });
  revalidateMetas();
}

export async function toggleMilestone(milestoneId: string, done: boolean) {
  const ctx = await requireHousehold();
  const [m] = await db
    .select({ goalId: milestones.goalId })
    .from(milestones)
    .where(eq(milestones.id, milestoneId))
    .limit(1);
  if (!m) throw new Error("Etapa não encontrada.");
  await assertOwnGoal(m.goalId, ctx.householdId);
  await db
    .update(milestones)
    .set({ done: done ? 1 : 0 })
    .where(eq(milestones.id, milestoneId));
  revalidateMetas();
}

export async function deleteMilestone(milestoneId: string) {
  const ctx = await requireHousehold();
  const [m] = await db
    .select({ goalId: milestones.goalId })
    .from(milestones)
    .where(eq(milestones.id, milestoneId))
    .limit(1);
  if (!m) throw new Error("Etapa não encontrada.");
  await assertOwnGoal(m.goalId, ctx.householdId);
  await db.delete(milestones).where(eq(milestones.id, milestoneId));
  revalidateMetas();
}
