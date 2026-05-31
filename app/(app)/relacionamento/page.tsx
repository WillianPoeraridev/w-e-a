import { PageHeader } from "@/components/page-header";
import { RelacionamentoView } from "@/features/relacionamento/components/relacionamento-view";
import {
  getCheckins,
  getDateIdeas,
  getGratitude,
  getImportantDates,
} from "@/features/relacionamento/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Nós" };

// Countdowns are date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function RelacionamentoPage() {
  const ctx = await requireHousehold();
  const [checkins, gratitude, dateIdeas, importantDates] = await Promise.all([
    getCheckins(ctx.householdId),
    getGratitude(ctx.householdId),
    getDateIdeas(ctx.householdId),
    getImportantDates(ctx.householdId),
  ]);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Nós" subtitle="O que mantém vocês fortes 💜" />
      <RelacionamentoView
        checkins={checkins}
        gratitude={gratitude}
        dateIdeas={dateIdeas}
        importantDates={importantDates}
        members={members}
        currentUserId={ctx.userId}
        today={todaySP()}
      />
    </>
  );
}
