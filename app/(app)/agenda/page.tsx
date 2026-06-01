import { PageHeader } from "@/components/page-header";
import { buildMonthGrid } from "@/features/agenda/calendar";
import { AgendaView } from "@/features/agenda/components/agenda-view";
import { getMonthEvents, getUpcomingEvents } from "@/features/agenda/queries";
import { getCalendarItems } from "@/features/calendar/aggregate";
import { monthKeyOf, monthLabel, todaySP, type MonthKey } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";

export const metadata = { title: "Agenda" };

// Default month follows the current date — keep fresh.
export const dynamic = "force-dynamic";

function resolveMonth(m?: string): MonthKey {
  return m && /^\d{4}-\d{2}$/.test(m) ? m : monthKeyOf();
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const ctx = await requireHousehold();
  const { m } = await searchParams;
  const month = resolveMonth(m);

  const [events, upcoming, items] = await Promise.all([
    getMonthEvents(ctx.householdId, month),
    getUpcomingEvents(ctx.householdId, 6),
    getCalendarItems(ctx.householdId, month),
  ]);

  const members = ctx.members.map((mm) => ({
    userId: mm.userId,
    displayName: mm.displayName,
    color: mm.color,
  }));

  return (
    <>
      <PageHeader title="Agenda" subtitle="O calendário de vocês dois" />
      <AgendaView
        monthKey={month}
        label={monthLabel(month)}
        gridDays={buildMonthGrid(month)}
        events={events}
        items={items}
        upcoming={upcoming}
        members={members}
        today={todaySP()}
      />
    </>
  );
}
