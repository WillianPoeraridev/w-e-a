import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

/** All "wall clock" logic for the couple happens in São Paulo time. */
export const TZ = "America/Sao_Paulo";

/** A YYYY-MM month key, e.g. "2026-05". */
export type MonthKey = string;

/** Today's calendar date in SP as "YYYY-MM-DD". */
export function todaySP(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

/** Current hour (0–23) in São Paulo. */
export function hourSP(): number {
  return Number(formatInTimeZone(new Date(), TZ, "H"));
}

/** The month key ("YYYY-MM") for a given instant (defaults to now, SP). */
export function monthKeyOf(date: Date = new Date()): MonthKey {
  return formatInTimeZone(date, TZ, "yyyy-MM");
}

/** Parse "YYYY-MM" into its numeric parts. */
export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/** First day of the month as "YYYY-MM-DD" (inclusive lower bound). */
export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

/** First day of the NEXT month as "YYYY-MM-DD" (exclusive upper bound). */
export function nextMonthStart(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1, 1);
  const next = addMonths(d, 1);
  return format(next, "yyyy-MM-dd");
}

/** Shift a month key by n months: ("2026-05", -1) -> "2026-04". */
export function shiftMonth(key: MonthKey, n: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1, 1);
  return format(addMonths(d, n), "yyyy-MM");
}

/** Human label for a month key: "2026-05" -> "Maio de 2026". */
export function monthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1, 1);
  const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Format a "YYYY-MM-DD" date string as "dd/MM/yyyy". */
export function formatDateBR(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return format(new Date(y, m - 1, d), "dd/MM/yyyy");
}

/** Short day label: "2026-05-30" -> "30 mai". */
export function formatDayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return format(new Date(y, m - 1, d), "dd MMM", { locale: ptBR });
}

/** Long, capitalized label for today in SP: "Sexta-feira, 30 de maio". */
export function todayLongLabel(): string {
  const [y, m, d] = todaySP().split("-").map(Number);
  const label = format(new Date(y, m - 1, d), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
