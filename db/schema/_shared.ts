import { timestamp } from "drizzle-orm/pg-core";

/** A record can be personal (one of us) or shared (ours). */
export const scopeValues = ["personal", "shared"] as const;
export type Scope = (typeof scopeValues)[number];

/** created_at / updated_at present on every domain table. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
