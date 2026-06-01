import { describe, expect, it } from "vitest";
import { computeLinkedProgress, type MetricContext } from "./metrics";

const ctx: MetricContext = {
  savingsTotalCents: 500_000, // R$5.000
  workoutsThisWeek: 2,
  studyMinThisWeek: 180,
  habitStreak: new Map([["h1", 5]]),
};

describe("computeLinkedProgress", () => {
  it("savings: 5k of 10k -> 50%", () => {
    expect(computeLinkedProgress("savings_total", 1_000_000, null, ctx)).toBe(50);
  });
  it("workouts: caps at 100%", () => {
    expect(computeLinkedProgress("workouts_week", 2, null, ctx)).toBe(100);
    expect(computeLinkedProgress("workouts_week", 4, null, ctx)).toBe(50);
  });
  it("study minutes", () => {
    expect(computeLinkedProgress("study_week_min", 360, null, ctx)).toBe(50);
  });
  it("habit streak via linkedRef", () => {
    expect(computeLinkedProgress("habit_streak", 10, "h1", ctx)).toBe(50);
    expect(computeLinkedProgress("habit_streak", 10, "missing", ctx)).toBe(0);
  });
  it("unknown metric / zero target -> 0", () => {
    expect(computeLinkedProgress("nope", 10, null, ctx)).toBe(0);
    expect(computeLinkedProgress("savings_total", 0, null, ctx)).toBe(0);
  });
});
