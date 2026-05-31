import { PageHeader } from "@/components/page-header";
import { SonoView } from "@/features/sono/components/sono-view";
import { getSleepLogs } from "@/features/sono/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Sono" };

// Week summary is date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function SonoPage() {
  const ctx = await requireHousehold();
  const logs = await getSleepLogs(ctx.householdId);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Sono" subtitle="Qualidade e tendências" />
      <SonoView
        logs={logs}
        members={members}
        currentUserId={ctx.userId}
        today={todaySP()}
      />
    </>
  );
}
