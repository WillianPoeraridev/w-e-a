"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  checkins,
  dateIdeas,
  gratitudeNotes,
  importantDates,
} from "@/db/schema";
import { aiEnabled, gemini } from "@/lib/ai";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { parseBRLToCents } from "@/lib/money";
import {
  checkinSchema,
  dateIdeaSchema,
  gratitudeSchema,
  importantDateSchema,
} from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function revalidateRel() {
  revalidatePath("/relacionamento");
  revalidatePath("/");
}

// ── Check-ins ────────────────────────────────────────────────────────────────

export async function createCheckin(form: FormData) {
  const ctx = await requireHousehold();
  const moodRaw = str(form, "mood");
  const input = checkinSchema.parse({
    date: str(form, "date"),
    mood: moodRaw ? Number(moodRaw) : null,
    gratitude: str(form, "gratitude"),
    highlight: str(form, "highlight"),
    improve: str(form, "improve"),
  });
  await db.insert(checkins).values({
    householdId: ctx.householdId,
    authorUserId: ctx.userId,
    ...input,
  });
  revalidateRel();
}

export async function deleteCheckin(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(checkins)
    .where(and(eq(checkins.id, id), eq(checkins.householdId, ctx.householdId)));
  revalidateRel();
}

// ── Gratitude ────────────────────────────────────────────────────────────────

export async function createGratitude(form: FormData) {
  const ctx = await requireHousehold();
  const input = gratitudeSchema.parse({ message: str(form, "message") });
  await db.insert(gratitudeNotes).values({
    householdId: ctx.householdId,
    authorUserId: ctx.userId,
    toUserId: ctx.partner?.userId ?? null,
    message: input.message,
    date: todaySP(),
  });
  revalidateRel();
}

export async function deleteGratitude(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(gratitudeNotes)
    .where(and(eq(gratitudeNotes.id, id), eq(gratitudeNotes.householdId, ctx.householdId)));
  revalidateRel();
}

// ── Date ideas ───────────────────────────────────────────────────────────────

export async function createDateIdea(form: FormData) {
  const ctx = await requireHousehold();
  const costRaw = str(form, "cost");
  const input = dateIdeaSchema.parse({
    title: str(form, "title"),
    description: str(form, "description"),
    category: str(form, "category"),
    estimatedCostCents: costRaw ? parseBRLToCents(costRaw) : null,
  });
  await db.insert(dateIdeas).values({
    householdId: ctx.householdId,
    createdByUserId: ctx.userId,
    ...input,
  });
  revalidateRel();
}

export async function toggleDateIdea(id: string, done: boolean) {
  const ctx = await requireHousehold();
  await db
    .update(dateIdeas)
    .set({ done, doneDate: done ? todaySP() : null })
    .where(and(eq(dateIdeas.id, id), eq(dateIdeas.householdId, ctx.householdId)));
  revalidateRel();
}

export async function deleteDateIdea(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(dateIdeas)
    .where(and(eq(dateIdeas.id, id), eq(dateIdeas.householdId, ctx.householdId)));
  revalidateRel();
}

// ── Important dates ──────────────────────────────────────────────────────────

export async function createImportantDate(form: FormData) {
  const ctx = await requireHousehold();
  const input = importantDateSchema.parse({
    title: str(form, "title"),
    date: str(form, "date"),
    recurring: form.get("recurring") === "on" || form.get("recurring") === "true",
    kind: str(form, "kind") ?? "other",
    notes: str(form, "notes"),
  });
  await db.insert(importantDates).values({ householdId: ctx.householdId, ...input });
  revalidateRel();
}

export async function deleteImportantDate(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(importantDates)
    .where(and(eq(importantDates.id, id), eq(importantDates.householdId, ctx.householdId)));
  revalidateRel();
}

// ── Sugestões de date por IA ─────────────────────────────────────────────────

export type DateSuggestion = { title: string; category: string; cost: string };

export async function suggestDateIdeas(): Promise<{
  enabled: boolean;
  ideas: DateSuggestion[];
}> {
  await requireHousehold();
  if (!aiEnabled()) return { enabled: false, ideas: [] };

  const prompt =
    'Sugira 5 ideias de date (encontro a dois) variadas e criativas para um casal no Brasil, com orçamentos diferentes (de grátis até ~R$200). Responda APENAS com um array JSON válido, sem texto fora dele, no formato: [{"title":"...","category":"casa|passeio|comida|cultura|aventura","cost":"0,00"}]. O cost em reais como string pt-BR (ex: "45,00").';
  const raw = await gemini(prompt, { temperature: 0.9, maxTokens: 500 });
  if (!raw) return { enabled: true, ideas: [] };

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const json = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(json)) return { enabled: true, ideas: [] };
    const ideas: DateSuggestion[] = json
      .slice(0, 6)
      .map((x) => {
        const o = x as Record<string, unknown>;
        return {
          title: String(o.title ?? "").slice(0, 120),
          category: String(o.category ?? "").slice(0, 40),
          cost: String(o.cost ?? "").slice(0, 20),
        };
      })
      .filter((i) => i.title);
    return { enabled: true, ideas };
  } catch {
    return { enabled: true, ideas: [] };
  }
}
