import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ownership } from "./core";
import { timestamps } from "./_shared";

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  allDay: boolean("all_day").notNull().default(false),
  location: text("location"),
  color: text("color").notNull().default("#6366f1"),
  /** Reserved for future Google Calendar sync. */
  googleEventId: text("google_event_id"),
  ...timestamps,
});
