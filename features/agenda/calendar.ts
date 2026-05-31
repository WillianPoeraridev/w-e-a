import { format } from "date-fns";
import { todaySP } from "@/lib/dates";

export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export type GridDay = {
  key: string; // "YYYY-MM-DD"
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

/**
 * 7-column grid covering a month, padded with the surrounding days so weeks are
 * complete (Sunday-first). Pure calendar math with the LOCAL Date constructor +
 * format, so it never drifts a day across timezones.
 */
export function buildMonthGrid(monthKey: string): GridDay[] {
  const [y, m] = monthKey.split("-").map(Number);
  const startWeekday = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const today = todaySP();

  const out: GridDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(y, m - 1, 1 - startWeekday + i);
    const key = format(d, "yyyy-MM-dd");
    const wd = d.getDay();
    out.push({
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === m - 1 && d.getFullYear() === y,
      isToday: key === today,
      isWeekend: wd === 0 || wd === 6,
    });
  }
  return out;
}
