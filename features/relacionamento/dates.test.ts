import { describe, expect, it } from "vitest";
import { countdownLabel, diffDays, occurrence } from "./dates";

const today = "2026-05-31";

describe("diffDays", () => {
  it("counts the gap", () => {
    expect(diffDays("2026-06-10", today)).toBe(10);
    expect(diffDays("2026-05-30", today)).toBe(-1);
  });
});

describe("occurrence", () => {
  it("non-recurring returns the date itself", () => {
    const o = occurrence("2026-06-15", false, today);
    expect(o.key).toBe("2026-06-15");
    expect(o.days).toBe(15);
  });

  it("recurring rolls to this year (or next if past) and counts years", () => {
    // anniversary started 2025-04-30; next occurrence is 2027-04-30 (2026 already passed)
    const o = occurrence("2025-04-30", true, today);
    expect(o.key).toBe("2027-04-30");
    expect(o.years).toBe(2);
    expect(o.days).toBeGreaterThan(0);
  });

  it("recurring upcoming later this year", () => {
    const o = occurrence("2020-12-25", true, today);
    expect(o.key).toBe("2026-12-25");
    expect(o.years).toBe(6);
  });
});

describe("countdownLabel", () => {
  it("phrases the countdown", () => {
    expect(countdownLabel(0)).toContain("hoje");
    expect(countdownLabel(1)).toBe("amanhã");
    expect(countdownLabel(5)).toBe("em 5 dias");
    expect(countdownLabel(-2)).toBe("passou");
  });
});
