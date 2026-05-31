import { addDays, format } from "date-fns";

export type Holiday = { key: string; name: string };

/** Easter Sunday (Gregorian computus) as a local Date. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const FIXED: { md: string; name: string }[] = [
  { md: "01-01", name: "Ano Novo" },
  { md: "04-21", name: "Tiradentes" },
  { md: "05-01", name: "Dia do Trabalho" },
  { md: "09-07", name: "Independência" },
  { md: "10-12", name: "N. Sra. Aparecida" },
  { md: "11-02", name: "Finados" },
  { md: "11-15", name: "Proclamação da República" },
  { md: "11-20", name: "Consciência Negra" },
  { md: "12-25", name: "Natal" },
];

/** All Brazilian national holidays (incl. Easter-based movable ones) for a year. */
export function brazilHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const mov = (offset: number, name: string): Holiday => ({
    key: format(addDays(easter, offset), "yyyy-MM-dd"),
    name,
  });
  return [
    ...FIXED.map((f) => ({ key: `${year}-${f.md}`, name: f.name })),
    mov(-48, "Carnaval"),
    mov(-47, "Carnaval"),
    mov(-2, "Sexta-feira Santa"),
    mov(60, "Corpus Christi"),
  ].sort((a, b) => a.key.localeCompare(b.key));
}

/** Holidays whose date falls in the given "YYYY-MM" month. */
export function holidaysInMonth(monthKey: string): Holiday[] {
  const year = Number(monthKey.slice(0, 4));
  return brazilHolidays(year).filter((h) => h.key.slice(0, 7) === monthKey);
}
