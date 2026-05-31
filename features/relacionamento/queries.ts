import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  checkins,
  dateIdeas,
  gratitudeNotes,
  importantDates,
} from "@/db/schema";

export type CheckinLite = {
  id: string;
  date: string;
  mood: number | null;
  gratitude: string | null;
  highlight: string | null;
  improve: string | null;
  authorUserId: string | null;
};

export type GratitudeLite = {
  id: string;
  message: string;
  date: string;
  authorUserId: string | null;
  toUserId: string | null;
};

export type DateIdeaLite = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  estimatedCostCents: number | null;
  done: boolean;
  doneDate: string | null;
  createdByUserId: string | null;
};

export type ImportantDateLite = {
  id: string;
  title: string;
  date: string;
  recurring: boolean;
  kind: "anniversary" | "birthday" | "other";
  notes: string | null;
};

export async function getCheckins(householdId: string): Promise<CheckinLite[]> {
  const rows = await db
    .select()
    .from(checkins)
    .where(eq(checkins.householdId, householdId))
    .orderBy(desc(checkins.date), desc(checkins.createdAt));
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    mood: r.mood,
    gratitude: r.gratitude,
    highlight: r.highlight,
    improve: r.improve,
    authorUserId: r.authorUserId,
  }));
}

export async function getGratitude(householdId: string): Promise<GratitudeLite[]> {
  const rows = await db
    .select()
    .from(gratitudeNotes)
    .where(eq(gratitudeNotes.householdId, householdId))
    .orderBy(desc(gratitudeNotes.createdAt));
  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    date: r.date,
    authorUserId: r.authorUserId,
    toUserId: r.toUserId,
  }));
}

export async function getDateIdeas(householdId: string): Promise<DateIdeaLite[]> {
  const rows = await db
    .select()
    .from(dateIdeas)
    .where(eq(dateIdeas.householdId, householdId))
    .orderBy(desc(dateIdeas.createdAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    estimatedCostCents: r.estimatedCostCents,
    done: r.done,
    doneDate: r.doneDate,
    createdByUserId: r.createdByUserId,
  }));
}

export async function getImportantDates(
  householdId: string,
): Promise<ImportantDateLite[]> {
  const rows = await db
    .select()
    .from(importantDates)
    .where(eq(importantDates.householdId, householdId));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    recurring: r.recurring,
    kind: r.kind,
    notes: r.notes,
  }));
}
