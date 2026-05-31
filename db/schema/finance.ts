import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { household, ownership } from "./core";
import { timestamps, type Scope } from "./_shared";

export const transactionKinds = ["income", "expense"] as const;
export type TransactionKind = (typeof transactionKinds)[number];

/** How a shared cost is divided between the couple. */
export const splitKinds = ["none", "equal", "income"] as const;
export type SplitKind = (typeof splitKinds)[number];

/** Income/expense categories (household-wide, with color + lucide icon). */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  kind: text("kind").$type<TransactionKind>().notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  isDefault: boolean("is_default").notNull().default(false),
  ...timestamps,
});

/** Recurring monthly bills (rent, water, power, internet, child support…). */
export const recurringBills = pgTable("recurring_bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  dueDay: integer("due_day").notNull().default(10),
  payerUserId: text("payer_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  scope: text("scope").$type<Scope>().notNull().default("shared"),
  splitKind: text("split_kind").$type<SplitKind>().notNull().default("equal"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Every concrete money movement. Money is integer cents, dates are SP days. */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => household.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  kind: text("kind").$type<TransactionKind>().notNull(),
  amountCents: integer("amount_cents").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  payerUserId: text("payer_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  scope: text("scope").$type<Scope>().notNull().default("shared"),
  description: text("description"),
  paid: boolean("paid").notNull().default(true),
  recurringBillId: uuid("recurring_bill_id").references(
    () => recurringBills.id,
    { onDelete: "set null" },
  ),
  /** "YYYY-MM" when this row was generated from a recurring bill (dedupe key). */
  billMonth: text("bill_month"),
  ...timestamps,
});

/** Savings goals with a target and current balance (both in cents). */
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...ownership(),
  name: text("name").notNull(),
  targetCents: integer("target_cents").notNull(),
  currentCents: integer("current_cents").notNull().default(0),
  color: text("color").notNull().default("#10b981"),
  icon: text("icon"),
  deadline: date("deadline", { mode: "string" }),
  ...timestamps,
});
