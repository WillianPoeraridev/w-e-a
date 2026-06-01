// Client-safe types/constants for the unified calendar (NO server imports here,
// so client components can import these without dragging in the DB layer).

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
  /** Generated transaction id for a bill already in the month (actionable). */
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
