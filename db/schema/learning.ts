import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { household, ownership } from "./core";
import { timestamps } from "./_shared";

export const trackStatuses = ["planned", "in_progress", "done"] as const;

/** A course / learning path (Willian Dev PJ, Angélica from zero). */
export const studyTracks = pgTable("study_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  title: text("title").notNull(),
  description: text("description"),
  provider: text("provider"),
  url: text("url"),
  status: text("status")
    .$type<(typeof trackStatuses)[number]>()
    .notNull()
    .default("planned"),
  progress: integer("progress").notNull().default(0),
  totalHours: integer("total_hours"),
  ...timestamps,
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  trackId: uuid("track_id").references(() => studyTracks.id, {
    onDelete: "set null",
  }),
  date: date("date", { mode: "string" }).notNull(),
  minutes: integer("minutes").notNull(),
  topic: text("topic"),
  notes: text("notes"),
  ...timestamps,
});

/** Saved tech/market updates to stay current. */
export const techFeed = pgTable("tech_feed", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source"),
  summary: text("summary"),
  tags: text("tags"),
  savedByUserId: text("saved_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  read: boolean("read").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
});
