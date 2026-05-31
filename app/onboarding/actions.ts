"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { household, membership } from "@/db/schema";
import { getHousehold, getSession } from "@/lib/household";

const schema = z.object({
  householdName: z.string().min(1).max(80),
  displayName: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

/** Creates the first household for a freshly signed-up user. */
export async function createHouseholdAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Already in a household? Go home.
  if (await getHousehold()) redirect("/");

  const parsed = schema.safeParse({
    householdName: formData.get("householdName"),
    displayName: formData.get("displayName"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    throw new Error("Dados inválidos para criar a casa.");
  }

  const [house] = await db
    .insert(household)
    .values({ name: parsed.data.householdName })
    .returning();

  await db.insert(membership).values({
    householdId: house.id,
    userId: session.user.id,
    displayName: parsed.data.displayName,
    color: parsed.data.color,
    role: "owner",
  });

  redirect("/");
}
