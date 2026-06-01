import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Dumbbell,
  Heart,
  type LucideIcon,
  Moon,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { AiSummaryCard } from "@/features/dashboard/components/ai-summary-card";
import { Assistant } from "@/features/dashboard/components/assistant";
import { TodayHabits } from "@/features/dashboard/components/today-habits";
import { WeeklyReview } from "@/features/dashboard/components/weekly-review";
import { getDailyDigest } from "@/features/dashboard/digest";
import { getDailySummary } from "@/features/dashboard/summary";
import { fmtDuration } from "@/features/sono/lib";
import { aiEnabled } from "@/lib/ai";
import { formatDayShort, hourSP, todayLongLabel, todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { formatBRL } from "@/lib/money";
import { NAV } from "@/lib/nav";

export const metadata = { title: "Hoje" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = hourSP();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Widget({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-4 transition-colors hover:border-primary/40 hover:bg-accent/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className="size-4 text-primary" />
        </div>
        <p className="mt-1.5 text-lg font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </Card>
    </Link>
  );
}

export default async function TodayPage() {
  const ctx = await requireHousehold();
  const today = todaySP();
  const digest = await getDailyDigest(ctx, today);
  const summary = await getDailySummary(ctx, digest, ctx.me.displayName);
  const f = digest.finance;

  return (
    <div className="space-y-6">
      <AiSummaryCard
        text={summary.text}
        source={summary.source}
        greeting={greeting()}
        dateLabel={todayLongLabel()}
        name={ctx.me.displayName}
      />

      {/* Finance snapshot */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Finanças · {digest.monthLabel}
          </h2>
          <Link href="/financas" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Abrir <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Sobra do mês" value={formatBRL(f.balance)} icon={Wallet} tone={f.balance >= 0 ? "brand" : "danger"} />
          <StatCard label="A pagar" value={formatBRL(f.pending)} icon={Clock} tone="warning" />
          <StatCard label="Projeção" value={formatBRL(f.projection)} icon={Wallet} tone={f.projection >= 0 ? "success" : "danger"} hint="após pagar tudo" />
          <StatCard label="Guardado" value={formatBRL(f.savingsTotal)} icon={Target} tone="success" hint={`de ${formatBRL(f.savingsTarget)}`} />
        </div>
      </section>

      {/* Assistant + today's habits */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Assistant enabled={aiEnabled()} />
        </div>
        <TodayHabits
          habits={digest.habits.map((h) => ({
            id: h.id,
            name: h.name,
            color: h.color,
            target: h.target,
            todayCount: h.stats.todayCount,
            todayDone: h.stats.todayDone,
          }))}
          today={today}
        />
      </section>

      {/* Cross-module widgets */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Widget icon={Moon} label="Sono" value={digest.sleepLast?.durationMin != null ? fmtDuration(digest.sleepLast.durationMin) : "—"} hint="última noite" href="/sono" />
        <Widget icon={Dumbbell} label="Treino" value={`${digest.workoutsWeek}`} hint="na semana" href="/treino" />
        <Widget icon={BookOpen} label="Estudo" value={`${digest.studyStreak}d 🔥`} hint={`${digest.studyWeekMin}min/sem`} href="/estudos" />
        <Widget icon={Target} label="Metas" value={`${digest.goalsAvg}%`} hint={`${digest.goalsActive} ativas`} href="/metas" />
        <Widget icon={Heart} label="Nós" value={digest.nextDate ? `${digest.nextDate.days}d` : "—"} hint={digest.nextDate?.title ?? "datas"} href="/relacionamento" />
        <Widget icon={CalendarDays} label="Agenda" value={digest.nextEvent ? formatDayShort(digest.nextEvent.dateKey) : "—"} hint={digest.nextEvent?.title ?? "próximo evento"} href="/agenda" />
      </section>

      {/* Weekly review */}
      <WeeklyReview />

      {/* Modules */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Seus módulos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NAV.filter((n) => n.href !== "/").map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
