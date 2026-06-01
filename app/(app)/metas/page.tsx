import { PageHeader } from "@/components/page-header";
import { getHabitsWithStats } from "@/features/habitos/queries";
import { GoalsView } from "@/features/metas/components/goals-view";
import { getGoals } from "@/features/metas/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Metas" };

// Deadlines/progress are date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const ctx = await requireHousehold();
  const [goals, habits] = await Promise.all([
    getGoals(ctx.householdId),
    getHabitsWithStats(ctx.householdId),
  ]);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Metas" subtitle="Os 3 pilares, degrau por degrau" />
      <GoalsView
        goals={goals}
        members={members}
        habits={habits.map((h) => ({ id: h.id, title: h.name }))}
        today={todaySP()}
      />
    </>
  );
}
