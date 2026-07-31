import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ownership } from "./core";
import { timestamps } from "./_shared";

export const workoutKinds = [
  "strength",
  "cardio",
  "mobility",
  "sport",
  "other",
] as const;

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  date: date("date", { mode: "string" }).notNull(),
  title: text("title").notNull(),
  kind: text("kind")
    .$type<(typeof workoutKinds)[number]>()
    .notNull()
    .default("strength"),
  durationMin: integer("duration_min"),
  notes: text("notes"),
  ...timestamps,
});

export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exercise: text("exercise").notNull(),
  /** Weight stored in grams to stay integer (e.g. 20.5kg -> 20500). */
  weightGrams: integer("weight_grams"),
  reps: integer("reps"),
  sets: integer("sets"),
  /** Target rep range used by the double-progression coach. */
  targetRepsMin: integer("target_reps_min"),
  targetRepsMax: integer("target_reps_max"),
  /** Estimated repetitions in reserve on the final working set. */
  rir: integer("rir"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const sleepLogs = pgTable(
  "sleep_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...ownership(),
    /** The date the night belongs to (wake-up day). */
    date: date("date", { mode: "string" }).notNull(),
    bedtime: timestamp("bedtime", { withTimezone: true }),
    wakeAt: timestamp("wake_at", { withTimezone: true }),
    durationMin: integer("duration_min"),
    quality: integer("quality"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [unique().on(t.ownerUserId, t.date)],
);
