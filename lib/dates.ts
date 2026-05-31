import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

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

/** Shift a "YYYY-MM-DD" day key by n days (handles month/year overflow). */
export function addDaysKey(dayKey: string, n: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return format(new Date(y, m - 1, d + n), "yyyy-MM-dd");
}

/** Long, capitalized label for today in SP: "Sexta-feira, 30 de maio". */
export function todayLongLabel(): string {
  const [y, m, d] = todaySP().split("-").map(Number);
  const label = format(new Date(y, m - 1, d), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ── Instant ↔ SP wall-clock (for calendar events stored as UTC timestamps) ──

/** Interpret an SP wall-clock string ("2026-06-15T14:30:00") as a UTC instant. */
export function spWallToUtc(localIso: string): Date {
  return fromZonedTime(localIso, TZ);
}

/** "HH:mm" of an instant in São Paulo. */
export function formatTimeSP(date: Date): string {
  return formatInTimeZone(date, TZ, "HH:mm");
}

/** "YYYY-MM-DD" calendar day of an instant in São Paulo. */
export function dateKeySP(date: Date): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

/** UTC [start, end) bounds covering a whole SP month. */
export function monthRangeUtc(key: MonthKey): { start: Date; end: Date } {
  return {
    start: fromZonedTime(`${key}-01T00:00:00`, TZ),
    end: fromZonedTime(`${shiftMonth(key, 1)}-01T00:00:00`, TZ),
  };
}

/** UTC instant for the start (00:00 SP) of a calendar day "YYYY-MM-DD". */
export function dayStartUtc(dayKey: string): Date {
  return fromZonedTime(`${dayKey}T00:00:00`, TZ);
}
