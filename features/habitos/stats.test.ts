import { describe, expect, it } from "vitest";
import { computeHabitStats } from "./stats";

const today = "2026-05-31";

function map(entries: [string, number][]) {
  return new Map<string, number>(entries);
}

describe("computeHabitStats", () => {
  it("counts a streak ending today", () => {
    const s = computeHabitStats(
      map([
        ["2026-05-31", 1],
        ["2026-05-30", 1],
        ["2026-05-29", 1],
      ]),
      1,
      today,
    );
    expect(s.todayDone).toBe(true);
    expect(s.streak).toBe(3);
  });

  it("does not break the streak when today isn't checked yet", () => {
    const s = computeHabitStats(
      map([
        ["2026-05-30", 1],
        ["2026-05-29", 1],
      ]),
      1,
      today,
    );
    expect(s.todayDone).toBe(false);
    expect(s.streak).toBe(2); // counts from yesterday back
  });

  it("respects a target greater than 1 (partial days don't count)", () => {
    const s = computeHabitStats(
      map([
        ["2026-05-31", 3],
        ["2026-05-30", 2], // below target -> breaks
        ["2026-05-29", 3],
      ]),
      3,
      today,
    );
    expect(s.todayDone).toBe(true);
    expect(s.streak).toBe(1);
  });

  it("builds a 7-day window with today last", () => {
    const s = computeHabitStats(map([["2026-05-31", 1]]), 1, today);
    expect(s.last7).toHaveLength(7);
    expect(s.last7[6].key).toBe("2026-05-31");
    expect(s.last7[6].isToday).toBe(true);
    expect(s.last7[0].key).toBe("2026-05-25");
    expect(s.doneCount7).toBe(1);
  });
});
