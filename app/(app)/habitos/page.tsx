import { PageHeader } from "@/components/page-header";
import { HabitsView } from "@/features/habitos/components/habits-view";
import { getHabitsWithStats } from "@/features/habitos/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Hábitos" };

// "Hoje" depends on the current date — keep fresh.
export const dynamic = "force-dynamic";

export default async function HabitosPage() {
  const ctx = await requireHousehold();
  const habits = await getHabitsWithStats(ctx.householdId);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Hábitos" subtitle="Sua rotina, dia após dia" />
      <HabitsView habits={habits} members={members} today={todaySP()} />
    </>
  );
}
