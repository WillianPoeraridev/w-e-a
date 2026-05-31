import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { membership } from "@/db/schema";
import { auth } from "./auth";

export type Member = {
  userId: string;
  displayName: string;
  color: string;
  role: "owner" | "member";
};

export type HouseholdContext = {
  householdId: string;
  userId: string;
  me: Member;
  members: Member[];
  /** The partner (first member that isn't me), if any. */
  partner: Member | null;
};

/** Resolve the Better Auth session (request-scoped, deduped). */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The full household context for the logged-in user, or null. */
export const getHousehold = cache(async (): Promise<HouseholdContext | null> => {
  const session = await getSession();
  if (!session) return null;

  const userId = session.user.id;
  const mine = await db
    .select()
    .from(membership)
    .where(eq(membership.userId, userId))
    .limit(1);
  const me = mine[0];
  if (!me) return null;

  const rows = await db
    .select()
    .from(membership)
    .where(eq(membership.householdId, me.householdId));

  const members: Member[] = rows.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
    role: m.role,
  }));

  return {
    householdId: me.householdId,
    userId,
    me: {
      userId: me.userId,
      displayName: me.displayName,
      color: me.color,
      role: me.role,
    },
    members,
    partner: members.find((m) => m.userId !== userId) ?? null,
  };
});

/** Use in protected pages: returns the context or redirects to login/onboarding. */
export async function requireHousehold(): Promise<HouseholdContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getHousehold();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

/** Map a userId to a member's display name (falls back to "Casa"). */
export function memberName(members: Member[], userId: string | null): string {
  if (!userId) return "Casa";
  return members.find((m) => m.userId === userId)?.displayName ?? "—";
}

export function memberColor(members: Member[], userId: string | null): string {
  if (!userId) return "#6366f1";
  return members.find((m) => m.userId === userId)?.color ?? "#6366f1";
}
