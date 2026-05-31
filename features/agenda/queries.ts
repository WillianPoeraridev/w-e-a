import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import {
  dateKeySP,
  dayStartUtc,
  formatTimeSP,
  monthRangeUtc,
  todaySP,
  type MonthKey,
} from "@/lib/dates";

export type EventLite = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateKey: string; // SP day of the start
  allDay: boolean;
  startTime: string | null; // "HH:mm" SP, null when all-day
  endTime: string | null; // "HH:mm" SP, null when all-day or no end
  color: string;
  scope: "personal" | "shared";
  ownerUserId: string | null;
};

type EventRow = typeof calendarEvents.$inferSelect;

function toLite(e: EventRow): EventLite {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    dateKey: dateKeySP(e.startAt),
    allDay: e.allDay,
    startTime: e.allDay ? null : formatTimeSP(e.startAt),
    endTime: e.allDay || !e.endAt ? null : formatTimeSP(e.endAt),
    color: e.color,
    scope: e.scope,
    ownerUserId: e.ownerUserId,
  };
}

/** Events whose start falls within the given SP month. */
export async function getMonthEvents(
  householdId: string,
  month: MonthKey,
): Promise<EventLite[]> {
  const { start, end } = monthRangeUtc(month);
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.householdId, householdId),
        gte(calendarEvents.startAt, start),
        lt(calendarEvents.startAt, end),
      ),
    )
    .orderBy(asc(calendarEvents.startAt));
  return rows.map(toLite);
}

/** Next events from the start of today (SP) onward. */
export async function getUpcomingEvents(
  householdId: string,
  limit = 6,
): Promise<EventLite[]> {
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.householdId, householdId),
        gte(calendarEvents.startAt, dayStartUtc(todaySP())),
      ),
    )
    .orderBy(asc(calendarEvents.startAt))
    .limit(limit);
  return rows.map(toLite);
}
