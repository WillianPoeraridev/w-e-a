import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sleepLogs } from "@/db/schema";
import { formatTimeSP } from "@/lib/dates";

export type SleepLite = {
  id: string;
  date: string;
  bedtime: string | null; // "HH:mm" SP
  wake: string | null;
  durationMin: number | null;
  quality: number | null;
  notes: string | null;
  ownerUserId: string | null;
};

export async function getSleepLogs(householdId: string): Promise<SleepLite[]> {
  const rows = await db
    .select()
    .from(sleepLogs)
    .where(eq(sleepLogs.householdId, householdId))
    .orderBy(desc(sleepLogs.date));
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    bedtime: r.bedtime ? formatTimeSP(r.bedtime) : null,
    wake: r.wakeAt ? formatTimeSP(r.wakeAt) : null,
    durationMin: r.durationMin,
    quality: r.quality,
    notes: r.notes,
    ownerUserId: r.ownerUserId,
  }));
}
