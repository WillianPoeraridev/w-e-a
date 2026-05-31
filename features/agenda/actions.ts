"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { spWallToUtc } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { eventSchema, type EventInput } from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parse(form: FormData): EventInput {
  return eventSchema.parse({
    title: str(form, "title"),
    date: str(form, "date"),
    allDay: form.get("allDay") === "on" || form.get("allDay") === "true",
    startTime: str(form, "startTime"),
    endTime: str(form, "endTime"),
    ownerUserId: str(form, "ownerUserId"),
    scope: str(form, "scope") ?? "shared",
    color: str(form, "color") ?? "#6366f1",
    description: str(form, "description"),
    location: str(form, "location"),
  });
}

/** Convert the SP wall-clock form input into stored UTC instants. */
function toInstants(input: EventInput) {
  if (input.allDay) {
    return {
      startAt: spWallToUtc(`${input.date}T00:00:00`),
      endAt: null as Date | null,
    };
  }
  return {
    startAt: spWallToUtc(`${input.date}T${input.startTime}:00`),
    endAt: input.endTime
      ? spWallToUtc(`${input.date}T${input.endTime}:00`)
      : null,
  };
}

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/");
}

export async function createEvent(form: FormData) {
  const ctx = await requireHousehold();
  const input = parse(form);
  const { startAt, endAt } = toInstants(input);

  await db.insert(calendarEvents).values({
    householdId: ctx.householdId,
    ownerUserId: input.ownerUserId,
    scope: input.scope,
    title: input.title,
    description: input.description,
    location: input.location,
    startAt,
    endAt,
    allDay: input.allDay,
    color: input.color,
  });
  revalidateAgenda();
}

export async function updateEvent(form: FormData) {
  const ctx = await requireHousehold();
  const id = str(form, "id");
  if (!id) throw new Error("Evento inválido.");
  const input = parse(form);
  const { startAt, endAt } = toInstants(input);

  await db
    .update(calendarEvents)
    .set({
      ownerUserId: input.ownerUserId,
      scope: input.scope,
      title: input.title,
      description: input.description,
      location: input.location,
      startAt,
      endAt,
      allDay: input.allDay,
      color: input.color,
    })
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.householdId, ctx.householdId),
      ),
    );
  revalidateAgenda();
}

export async function deleteEvent(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.householdId, ctx.householdId),
      ),
    );
  revalidateAgenda();
}
