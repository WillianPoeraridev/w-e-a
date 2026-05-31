import { PageHeader } from "@/components/page-header";
import { GoalsView } from "@/features/metas/components/goals-view";
import { getGoals } from "@/features/metas/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Metas" };

// Deadlines/progress are date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const ctx = await requireHousehold();
  const goals = await getGoals(ctx.householdId);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Metas" subtitle="Os 3 pilares, degrau por degrau" />
      <GoalsView goals={goals} members={members} today={todaySP()} />
    </>
  );
}
