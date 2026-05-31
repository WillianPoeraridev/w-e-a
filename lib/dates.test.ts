import { describe, expect, it } from "vitest";
import {
  formatDateBR,
  formatDayShort,
  monthLabel,
  monthStart,
  nextMonthStart,
  shiftMonth,
} from "./dates";

// These run under TZ=America/Sao_Paulo (vitest.config.ts). The functions build
// dates with the LOCAL constructor + format locally, so a calendar date must
// never drift by a day regardless of the host's UTC offset.

describe("monthLabel", () => {
  it("labels the correct month (no off-by-one to the previous month)", () => {
    expect(monthLabel("2026-05")).toBe("Maio de 2026");
    expect(monthLabel("2026-01")).toBe("Janeiro de 2026");
    expect(monthLabel("2026-12")).toBe("Dezembro de 2026");
  });
});

describe("shiftMonth", () => {
  it("moves across month and year boundaries", () => {
    expect(shiftMonth("2026-05", 1)).toBe("2026-06");
    expect(shiftMonth("2026-05", -1)).toBe("2026-04");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("monthStart / nextMonthStart", () => {
  it("returns inclusive lower and exclusive upper bounds", () => {
    expect(monthStart("2026-05")).toBe("2026-05-01");
    expect(nextMonthStart("2026-05")).toBe("2026-06-01");
    expect(nextMonthStart("2026-12")).toBe("2027-01-01");
  });
});

describe("formatDateBR / formatDayShort", () => {
  it("formats a calendar date without shifting the day", () => {
    expect(formatDateBR("2026-05-20")).toBe("20/05/2026");
    expect(formatDayShort("2026-05-20")).toBe("20 mai");
    expect(formatDayShort("2026-05-31")).toBe("31 mai");
  });
});
