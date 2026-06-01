import { holidaysInMonth } from "@/features/agenda/holidays";
import {
  getMonthTransactions,
  getRecurringBills,
} from "@/features/financas/queries";
import { getStudySessions } from "@/features/estudos/queries";
import { getGoals } from "@/features/metas/queries";
import { occurrence } from "@/features/relacionamento/dates";
import { getImportantDates } from "@/features/relacionamento/queries";
import { fmtDuration } from "@/features/sono/lib";
import { getSleepLogs } from "@/features/sono/queries";
import { getWorkouts } from "@/features/treino/queries";
import { todaySP, type MonthKey } from "@/lib/dates";

export type CalendarSource =
  | "holiday"
  | "special"
  | "bill"
  | "workout"
  | "study"
  | "sleep"
  | "goal";

export type CalendarItem = {
  id: string;
  dateKey: string;
  source: CalendarSource;
  title: string;
  color: string;
  href?: string;
  amountCents?: number | null;
  /** Generated transaction id for a bill that's already in the month (actionable). */
  txId?: string | null;
  paid?: boolean | null;
};

export const SOURCE_META: Record<CalendarSource, { label: string; color: string }> = {
  holiday: { label: "Feriado", color: "#059669" },
  special: { label: "Casal", color: "#ec4899" },
  bill: { label: "Conta", color: "#f59e0b" },
  workout: { label: "Treino", color: "#6366f1" },
  study: { label: "Estudo", color: "#8b5cf6" },
  sleep: { label: "Sono", color: "#0ea5e9" },
  goal: { label: "Meta", color: "#10b981" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const inMonth = (dateKey: string | null | undefined, month: MonthKey) =>
  Boolean(dateKey && dateKey.slice(0, 7) === month);

/**
 * Read-only markers from every module for a given month — the Agenda's unified
 * timeline. Each module stays the source of truth; this just surfaces them.
 */
export async function getCalendarItems(
  householdId: string,
  month: MonthKey,
): Promise<CalendarItem[]> {
  const today = todaySP();
  const [bills, txs, workouts, sessions, sleep, goals, importantDates] =
    await Promise.all([
      getRecurringBills(householdId),
      getMonthTransactions(householdId, month),
      getWorkouts(householdId),
      getStudySessions(householdId),
      getSleepLogs(householdId),
      getGoals(householdId),
      getImportantDates(householdId),
    ]);

  const items: CalendarItem[] = [];
  const color = (s: CalendarSource) => SOURCE_META[s].color;

  for (const h of holidaysInMonth(month)) {
    items.push({ id: `hol-${h.key}-${h.name}`, dateKey: h.key, source: "holiday", title: h.name, color: color("holiday") });
  }

  for (const d of importantDates) {
    const occ = occurrence(d.date, d.recurring, today);
    if (!inMonth(occ.key, month)) continue;
    const suffix = d.recurring && occ.years > 0 ? ` · ${occ.years} ano${occ.years > 1 ? "s" : ""}` : "";
    items.push({ id: `sp-${d.id}`, dateKey: occ.key, source: "special", title: `${d.title}${suffix}`, color: color("special") });
  }

  for (const b of bills) {
    if (!b.active) continue;
    const tx = txs.find((t) => t.recurringBillId === b.id);
    items.push({
      id: `bill-${b.id}`,
      dateKey: `${month}-${pad(b.dueDay)}`,
      source: "bill",
      title: b.name,
      color: color("bill"),
      amountCents: b.amountCents,
      href: "/financas",
      txId: tx?.id ?? null,
      paid: tx ? tx.paid : null,
    });
  }

  for (const w of workouts) {
    if (!inMonth(w.date, month)) continue;
    items.push({ id: `wk-${w.id}`, dateKey: w.date, source: "workout", title: w.title, color: color("workout"), href: "/treino" });
  }

  for (const s of sessions) {
    if (!inMonth(s.date, month)) continue;
    items.push({ id: `st-${s.id}`, dateKey: s.date, source: "study", title: s.topic || s.trackTitle || `Estudo ${s.minutes}min`, color: color("study"), href: "/estudos" });
  }

  for (const sl of sleep) {
    if (!inMonth(sl.date, month) || sl.durationMin == null) continue;
    items.push({ id: `sl-${sl.id}`, dateKey: sl.date, source: "sleep", title: `Sono ${fmtDuration(sl.durationMin)}`, color: color("sleep") });
  }

  for (const g of goals) {
    if (!inMonth(g.targetDate, month) || g.status === "done") continue;
    items.push({ id: `gl-${g.id}`, dateKey: g.targetDate as string, source: "goal", title: `Meta: ${g.title}`, color: color("goal"), href: "/metas" });
  }

  return items;
}
