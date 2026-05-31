import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { household } from "./core";
import { timestamps } from "./_shared";

/** Daily/periodic couple check-in (mood + gratitude + highlights). */
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  date: date("date", { mode: "string" }).notNull(),
  mood: integer("mood"),
  gratitude: text("gratitude"),
  highlight: text("highlight"),
  improve: text("improve"),
  ...timestamps,
});

/** Little notes of appreciation between the two of them. */
export const gratitudeNotes = pgTable("gratitude_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  toUserId: text("to_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  message: text("message").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  ...timestamps,
});

/** A backlog of date ideas to keep things romantic and intentional. */
export const dateIdeas = pgTable("date_ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  estimatedCostCents: integer("estimated_cost_cents"),
  done: boolean("done").notNull().default(false),
  doneDate: date("done_date", { mode: "string" }),
  createdByUserId: text("created_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

/** Anniversaries, birthdays and other dates that matter. */
export const importantDates = pgTable("important_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  recurring: boolean("recurring").notNull().default(true),
  kind: text("kind")
    .$type<"anniversary" | "birthday" | "other">()
    .notNull()
    .default("other"),
  notes: text("notes"),
  ...timestamps,
});
