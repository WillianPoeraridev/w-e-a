/** Days between two "YYYY-MM-DD" (a - b). */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

/**
 * Next occurrence of a date. For recurring dates, rolls month/day to this year
 * (or next if already past). `years` = the upcoming anniversary count.
 */
export function occurrence(
  date: string,
  recurring: boolean,
  today: string,
): { key: string; days: number; years: number } {
  if (!recurring) return { key: date, days: diffDays(date, today), years: 0 };
  const [oy, om, od] = date.split("-").map(Number);
  const ty = Number(today.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  let cand = `${ty}-${pad(om)}-${pad(od)}`;
  if (diffDays(cand, today) < 0) cand = `${ty + 1}-${pad(om)}-${pad(od)}`;
  return { key: cand, days: diffDays(cand, today), years: Number(cand.slice(0, 4)) - oy };
}

export function countdownLabel(days: number): string {
  if (days === 0) return "hoje! 🎉";
  if (days === 1) return "amanhã";
  if (days > 0) return `em ${days} dias`;
  return "passou";
}
