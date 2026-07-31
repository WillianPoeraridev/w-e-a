import { describe, expect, it } from "vitest";
import { getProgressionAdvice, type ProgressionEntry } from "./progression";

const entry = (patch: Partial<ProgressionEntry> = {}): ProgressionEntry => ({
  date: "2026-07-01",
  exercise: "Supino reto",
  ownerUserId: "willian",
  sets: 3,
  reps: 12,
  weightGrams: 80000,
  targetRepsMin: 8,
  targetRepsMax: 12,
  rir: 2,
  ...patch,
});

describe("getProgressionAdvice", () => {
  it("only raises load after two top-range, in-reserve sessions", () => {
    const advice = getProgressionAdvice([
      entry({ date: "2026-07-01" }),
      entry({ date: "2026-07-04" }),
    ]);

    expect(advice.tone).toBe("increase");
    expect(advice.suggestedWeightGrams).toBe(82000);
  });

  it("holds the load when the latest set reaches failure", () => {
    const advice = getProgressionAdvice([entry({ rir: 0 })]);

    expect(advice.tone).toBe("recover");
    expect(advice.suggestedWeightGrams).toBe(80000);
  });

  it("suggests a conservative reduction after two sessions below the range", () => {
    const advice = getProgressionAdvice([
      entry({ date: "2026-07-01", reps: 6, rir: 0 }),
      entry({ date: "2026-07-04", reps: 7, rir: 1 }),
    ]);

    expect(advice.tone).toBe("recover");
    expect(advice.suggestedWeightGrams).toBe(76000);
  });
});
