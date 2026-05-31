import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { household, ownership } from "./core";
import { timestamps } from "./_shared";

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull().default("#6366f1"),
  cadence: text("cadence").$type<"daily" | "weekly">().notNull().default("daily"),
  targetPerPeriod: integer("target_per_period").notNull().default(1),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(1),
    note: text("note"),
    ...timestamps,
  },
  (t) => [unique().on(t.habitId, t.date)],
);
