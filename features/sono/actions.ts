"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sleepLogs } from "@/db/schema";
import { spWallToUtc } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { durationFromTimes } from "./lib";
import { sleepSchema } from "./schema";

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function revalidateSono() {
  revalidatePath("/sono");
  revalidatePath("/");
}

export async function upsertSleep(form: FormData) {
  const ctx = await requireHousehold();
  const qualityRaw = str(form, "quality");
  const input = sleepSchema.parse({
    date: str(form, "date"),
    bedtime: str(form, "bedtime"),
    wake: str(form, "wake"),
    quality: qualityRaw ? Number(qualityRaw) : null,
    notes: str(form, "notes"),
    ownerUserId: str(form, "ownerUserId") ?? "",
  });

  // Owner must belong to the household.
  if (!ctx.members.some((m) => m.userId === input.ownerUserId)) {
    throw new Error("Pessoa inválida.");
  }

  const durationMin = durationFromTimes(input.bedtime, input.wake);
  const wakeAt = spWallToUtc(`${input.date}T${input.wake}:00`);
  const bedtime = new Date(wakeAt.getTime() - durationMin * 60_000);

  await db
    .insert(sleepLogs)
    .values({
      householdId: ctx.householdId,
      ownerUserId: input.ownerUserId,
      scope: "personal",
      date: input.date,
      bedtime,
      wakeAt,
      durationMin,
      quality: input.quality,
      notes: input.notes,
    })
    .onConflictDoUpdate({
      target: [sleepLogs.ownerUserId, sleepLogs.date],
      set: { bedtime, wakeAt, durationMin, quality: input.quality, notes: input.notes },
    });
  revalidateSono();
}

export async function deleteSleep(id: string) {
  const ctx = await requireHousehold();
  await db
    .delete(sleepLogs)
    .where(and(eq(sleepLogs.id, id), eq(sleepLogs.householdId, ctx.householdId)));
  revalidateSono();
}
