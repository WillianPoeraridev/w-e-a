/** Weight is stored in grams (integer); shown in kg. */

export function gramsFromKg(kg: number): number {
  return Math.round(kg * 1000);
}

export function kgFromGrams(grams: number): number {
  return grams / 1000;
}

/** "40500" g -> "40,5 kg". */
export function formatKg(grams: number): string {
  const kg = kgFromGrams(grams);
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(kg)} kg`;
}

export type WorkoutKind = "strength" | "cardio" | "mobility" | "sport" | "other";
