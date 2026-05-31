import { PageHeader } from "@/components/page-header";
import { EstudosView } from "@/features/estudos/components/estudos-view";
import {
  getStudySessions,
  getStudyTracks,
  getTechFeed,
} from "@/features/estudos/queries";
import { todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Estudos" };

// Week summary / streak are date-relative — keep fresh.
export const dynamic = "force-dynamic";

export default async function EstudosPage() {
  const ctx = await requireHousehold();
  const [tracks, sessions, feed] = await Promise.all([
    getStudyTracks(ctx.householdId),
    getStudySessions(ctx.householdId),
    getTechFeed(ctx.householdId),
  ]);
  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));

  return (
    <>
      <PageHeader title="Estudos" subtitle="Trilhas, foco e radar de tech" />
      <EstudosView
        tracks={tracks}
        sessions={sessions}
        feed={feed}
        members={members}
        currentUserId={ctx.userId}
        today={todaySP()}
      />
    </>
  );
}
