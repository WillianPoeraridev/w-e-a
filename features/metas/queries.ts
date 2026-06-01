import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema";
import { getMetricContext } from "./metric-context";
import { computeLinkedProgress, metricLabel } from "./metrics";
import type { PillarKey } from "./pillars";

export type MilestoneLite = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
};

export type GoalWithMilestones = {
  id: string;
  title: string;
  description: string | null;
  pillar: PillarKey | null;
  status: "active" | "done" | "paused";
  ownerUserId: string | null;
  scope: "personal" | "shared";
  targetDate: string | null;
  manualProgress: number;
  /** Computed: linked metric (if set) > milestones > manual. */
  progress: number;
  milestones: MilestoneLite[];
  doneCount: number;
  total: number;
  /** Live metric linkage (interligação com outros módulos). */
  linkedMetric: string | null;
  targetValue: number | null;
  linkedRef: string | null;
  isAuto: boolean;
  autoLabel: string | null;
};

export async function getGoals(
  householdId: string,
): Promise<GoalWithMilestones[]> {
  const gs = await db
    .select()
    .from(goals)
    .where(eq(goals.householdId, householdId))
    .orderBy(asc(goals.createdAt));
  if (gs.length === 0) return [];

  const ms = await db
    .select()
    .from(milestones)
    .where(
      inArray(
        milestones.goalId,
        gs.map((g) => g.id),
      ),
    )
    .orderBy(asc(milestones.sortOrder), asc(milestones.createdAt));

  const byGoal = new Map<string, typeof ms>();
  for (const m of ms) {
    const list = byGoal.get(m.goalId) ?? [];
    list.push(m);
    byGoal.set(m.goalId, list);
  }

  // Only pay the cross-module cost when at least one goal is linked.
  const hasLinked = gs.some((g) => g.linkedMetric);
  const metricCtx = hasLinked ? await getMetricContext(householdId) : null;

  return gs.map((g) => {
    const mil: MilestoneLite[] = (byGoal.get(g.id) ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      done: m.done > 0,
      dueDate: m.dueDate,
    }));
    const doneCount = mil.filter((m) => m.done).length;

    let progress =
      mil.length > 0 ? Math.round((doneCount / mil.length) * 100) : g.progress;
    let autoLabel: string | null = null;
    const isAuto = Boolean(g.linkedMetric && metricCtx);
    if (g.linkedMetric && metricCtx) {
      progress = computeLinkedProgress(g.linkedMetric, g.targetValue ?? 0, g.linkedRef, metricCtx);
      autoLabel = metricLabel(g.linkedMetric, g.targetValue ?? 0, g.linkedRef, metricCtx);
    }

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      pillar: g.pillar as PillarKey | null,
      status: g.status,
      ownerUserId: g.ownerUserId,
      scope: g.scope,
      targetDate: g.targetDate,
      manualProgress: g.progress,
      progress,
      milestones: mil,
      doneCount,
      total: mil.length,
      linkedMetric: g.linkedMetric,
      targetValue: g.targetValue,
      linkedRef: g.linkedRef,
      isAuto,
      autoLabel,
    };
  });
}
