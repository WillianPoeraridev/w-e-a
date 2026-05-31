import { PageHeader } from "@/components/page-header";
import { TreinoView } from "@/features/treino/components/treino-view";
import { getWorkouts } from "@/features/treino/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Treino" };

// Week summary is date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function TreinoPage() {
  const ctx = await requireHousehold();
  const workouts = await getWorkouts(ctx.householdId);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Treino" subtitle="Registro e evolução" />
      <TreinoView
        workouts={workouts}
        members={members}
        currentUserId={ctx.userId}
        today={todaySP()}
      />
    </>
  );
}
