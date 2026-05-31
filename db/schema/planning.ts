import { date, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { ownership } from "./core";
import { timestamps } from "./_shared";

/** The three life pillars Willian is optimizing. */
export const pillars = ["tempo_dinheiro", "relacionamento", "carreira"] as const;
export type Pillar = (typeof pillars)[number];

export const goalStatuses = ["active", "done", "paused"] as const;

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  title: text("title").notNull(),
  description: text("description"),
  pillar: text("pillar").$type<Pillar>(),
  status: text("status")
    .$type<(typeof goalStatuses)[number]>()
    .notNull()
    .default("active"),
  progress: integer("progress").notNull().default(0),
  targetDate: date("target_date", { mode: "string" }),
  ...timestamps,
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: integer("done").notNull().default(0),
  dueDate: date("due_date", { mode: "string" }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});
