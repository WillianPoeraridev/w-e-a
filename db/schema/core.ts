import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { scopeValues, timestamps, type Scope } from "./_shared";

/** The couple's shared space. One household, two members. */
export const household = pgTable("household", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
});

/** Links a user to a household with their display identity (name + color). */
export const membership = pgTable("membership", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").$type<"owner" | "member">().notNull().default("member"),
  displayName: text("display_name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  ...timestamps,
});

/**
 * Common ownership columns reused by every domain table. Returns FRESH column
 * builders on each call (required by Drizzle). `ownerUserId` null => shared.
 */
export function ownership() {
  return {
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    scope: text("scope").$type<Scope>().notNull().default("shared"),
  };
}

export { scopeValues };
export type { Scope };
