import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions, studyTracks, techFeed } from "@/db/schema";
import { cache } from "react";

export type TrackStatus = "planned" | "in_progress" | "done";

export type TrackLite = {
  id: string;
  title: string;
  description: string | null;
  provider: string | null;
  url: string | null;
  status: TrackStatus;
  progress: number;
  totalHours: number | null;
  ownerUserId: string | null;
  scope: "personal" | "shared";
};

export type SessionLite = {
  id: string;
  date: string;
  minutes: number;
  topic: string | null;
  trackId: string | null;
  trackTitle: string | null;
  ownerUserId: string | null;
};

export type FeedLite = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  tags: string | null;
  read: boolean;
  savedByUserId: string | null;
};

export async function getStudyTracks(householdId: string): Promise<TrackLite[]> {
  const rows = await db
    .select()
    .from(studyTracks)
    .where(eq(studyTracks.householdId, householdId))
    .orderBy(desc(studyTracks.createdAt));
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    provider: t.provider,
    url: t.url,
    status: t.status,
    progress: t.progress,
    totalHours: t.totalHours,
    ownerUserId: t.ownerUserId,
    scope: t.scope,
  }));
}

export const getStudySessions = cache(_getStudySessions);
async function _getStudySessions(
  householdId: string,
): Promise<SessionLite[]> {
  const rows = await db
    .select({
      id: studySessions.id,
      date: studySessions.date,
      minutes: studySessions.minutes,
      topic: studySessions.topic,
      trackId: studySessions.trackId,
      trackTitle: studyTracks.title,
      ownerUserId: studySessions.ownerUserId,
    })
    .from(studySessions)
    .leftJoin(studyTracks, eq(studySessions.trackId, studyTracks.id))
    .where(eq(studySessions.householdId, householdId))
    .orderBy(desc(studySessions.date), desc(studySessions.createdAt));
  return rows;
}

export async function getTechFeed(householdId: string): Promise<FeedLite[]> {
  const rows = await db
    .select()
    .from(techFeed)
    .where(eq(techFeed.householdId, householdId))
    .orderBy(desc(techFeed.createdAt));
  return rows.map((f) => ({
    id: f.id,
    title: f.title,
    url: f.url,
    source: f.source,
    tags: f.tags,
    read: f.read,
    savedByUserId: f.savedByUserId,
  }));
}
