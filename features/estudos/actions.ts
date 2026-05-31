"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { studySessions, studyTracks, techFeed } from "@/db/schema";
import { requireHousehold } from "@/lib/household";
import {
  feedSchema,
  sessionSchema,
  trackSchema,
  type FeedInput,
  type SessionInput,
  type TrackInput,
} from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function num(form: FormData, key: string): number | null {
  const s = str(form, key);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function revalidateEstudos() {
  revalidatePath("/estudos");
  revalidatePath("/");
}

// ── Tracks ───────────────────────────────────────────────────────────────────

function parseTrack(form: FormData): TrackInput {
  return trackSchema.parse({
    title: str(form, "title"),
    description: str(form, "description"),
    provider: str(form, "provider"),
    url: str(form, "url"),
    status: str(form, "status") ?? "planned",
    progress: num(form, "progress") ?? 0,
    totalHours: num(form, "totalHours"),
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "personal",
  });
}

export async function createTrack(form: FormData) {
  const ctx = await requireHousehold();
  const input = parseTrack(form);
  await db.insert(studyTracks).values({ householdId: ctx.householdId, ...input });
  revalidateEstudos();
}

export async function updateTrack(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Trilha inválida.");
  const input = parseTrack(form);
  await db
    .update(studyTracks)
    .set(input)
    .where(and(eq(studyTracks.id, id), eq(studyTracks.householdId, ctx.householdId)));
  revalidateEstudos();
}

export async function deleteTrack(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(studyTracks)
    .where(and(eq(studyTracks.id, id), eq(studyTracks.householdId, ctx.householdId)));
  revalidateEstudos();
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(form: FormData) {
  const ctx = await requireHousehold();
  const input: SessionInput = sessionSchema.parse({
    date: str(form, "date"),
    minutes: num(form, "minutes") ?? 0,
    topic: str(form, "topic"),
    trackId: str(form, "trackId"),
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "personal",
  });
  await db.insert(studySessions).values({ householdId: ctx.householdId, ...input });
  revalidateEstudos();
}

export async function deleteSession(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.householdId, ctx.householdId)));
  revalidateEstudos();
}

// ── Tech feed (Radar) ────────────────────────────────────────────────────────

export async function createFeed(form: FormData) {
  const ctx = await requireHousehold();
  const input: FeedInput = feedSchema.parse({
    title: str(form, "title"),
    url: str(form, "url"),
    source: str(form, "source"),
    tags: str(form, "tags"),
  });
  await db.insert(techFeed).values({
    householdId: ctx.householdId,
    savedByUserId: ctx.userId,
    ...input,
  });
  revalidateEstudos();
}

export async function toggleFeedRead(id: string, read: boolean) {
  const ctx = await requireHousehold();
  await db
    .update(techFeed)
    .set({ read })
    .where(and(eq(techFeed.id, id), eq(techFeed.householdId, ctx.householdId)));
  revalidateEstudos();
}

export async function deleteFeed(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(techFeed)
    .where(and(eq(techFeed.id, id), eq(techFeed.householdId, ctx.householdId)));
  revalidateEstudos();
}
