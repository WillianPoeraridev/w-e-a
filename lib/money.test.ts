import { describe, expect, it } from "vitest";
import {
  formatBRL,
  parseBRLToCents,
  splitByWeights,
  splitEqually,
  sumCents,
  toCents,
} from "./money";

describe("toCents", () => {
  it("rounds reais to integer cents", () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents(0.1 + 0.2)).toBe(30); // no float drift
    expect(toCents(950)).toBe(95000);
  });
});

describe("parseBRLToCents", () => {
  it("parses pt-BR formatted strings", () => {
    expect(parseBRLToCents("1.234,56")).toBe(123456);
    expect(parseBRLToCents("R$ 1.234,56")).toBe(123456);
    expect(parseBRLToCents("950")).toBe(95000);
    expect(parseBRLToCents("0,99")).toBe(99);
    expect(parseBRLToCents("1234.56")).toBe(123456);
  });
  it("returns null for garbage", () => {
    expect(parseBRLToCents("abc")).toBeNull();
    expect(parseBRLToCents("")).toBeNull();
  });
});

describe("splitEqually", () => {
  it("splits exactly with no lost cents", () => {
    expect(splitEqually(1000, 2)).toEqual([500, 500]);
    expect(splitEqually(1001, 2)).toEqual([501, 500]);
    expect(splitEqually(100, 3)).toEqual([34, 33, 33]);
    expect(sumCents(splitEqually(12349, 3))).toBe(12349);
  });
});

describe("splitByWeights", () => {
  it("splits proportionally and conserves total", () => {
    // Willian 5000 vs Angélica 2000 income -> 5:2 weights on a 1400,00 cost
    const parts = splitByWeights(140000, [5000, 2000]);
    expect(sumCents(parts)).toBe(140000);
    expect(parts[0]).toBeGreaterThan(parts[1]);
  });
});

describe("formatBRL", () => {
  it("formats cents as BRL", () => {
    // non-breaking space between symbol and number in pt-BR locale
    expect(formatBRL(123456).replace(/ /g, " ")).toBe("R$ 1.234,56");
    expect(formatBRL(0).replace(/ /g, " ")).toBe("R$ 0,00");
  });
});
