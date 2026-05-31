/**
 * Money is ALWAYS an integer number of cents (centavos). Never use floats for
 * money math. Display formatting happens only at the edge via `formatBRL`.
 */

export type Cents = number;

/** Convert a value in reais (e.g. 12.34) to integer cents (1234). */
export function toCents(reais: number): Cents {
  return Math.round(reais * 100);
}

/** Convert integer cents to a number of reais (1234 -> 12.34). */
export function toReais(cents: Cents): number {
  return cents / 100;
}

/**
 * Parse a user-typed BRL string into cents. Accepts "1.234,56", "1234,56",
 * "1234.56", "R$ 1.234,56", "1234". Returns null when not parseable.
 */
export function parseBRLToCents(input: string): Cents | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/\s/g, "").replace(/r\$/i, "");
  if (s === "") return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // pt-BR: dot = thousands, comma = decimal -> "1.234,56"
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // only comma -> decimal separator
    s = s.replace(",", ".");
  }
  // only dot or plain digits -> treat dot as decimal

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  return toCents(value);
}

/** Format integer cents as Brazilian currency: 123456 -> "R$ 1.234,56". */
export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toReais(cents));
}

/** Format cents compactly without the symbol: 123456 -> "1.234,56". */
export function formatAmount(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toReais(cents));
}

/** Sum a list of cents. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Split an amount across `parts` people so the pieces sum EXACTLY to the total.
 * The remainder (in cents) is distributed one cent at a time to the first
 * recipients, so nothing is ever lost or invented.
 */
export function splitEqually(total: Cents, parts: number): Cents[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  let remainder = total - base * parts;
  return Array.from({ length: parts }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return base + extra;
  });
}

/** Split an amount by integer weights (e.g. proportional to income). */
export function splitByWeights(total: Cents, weights: number[]): Cents[] {
  const totalWeight = weights.reduce((a, w) => a + w, 0);
  if (totalWeight <= 0) return splitEqually(total, weights.length);
  const raw = weights.map((w) => Math.floor((total * w) / totalWeight));
  let remainder = total - raw.reduce((a, v) => a + v, 0);
  // hand out leftover cents to the largest fractional losers, simplest: in order
  for (let i = 0; remainder > 0; i = (i + 1) % weights.length) {
    raw[i] += 1;
    remainder -= 1;
  }
  return raw;
}
