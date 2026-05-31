import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Clock,
  Lock,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoupleSplitCard } from "@/features/financas/components/couple-split-card";
import {
  computeOverview,
  getMonthTransactions,
  getSavingsGoals,
} from "@/features/financas/queries";
import { hourSP, monthKeyOf, todayLongLabel } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { formatBRL } from "@/lib/money";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export const metadata = { title: "Hoje" };

// "Hoje" depende da data atual — sempre renderizar fresco, nunca cachear.
export const dynamic = "force-dynamic";

function greeting() {
  const h = hourSP();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function TodayPage() {
  const ctx = await requireHousehold();
  const month = monthKeyOf();

  const [rows, savings] = await Promise.all([
    getMonthTransactions(ctx.householdId, month),
    getSavingsGoals(ctx.householdId),
  ]);
  const overview = computeOverview(month, rows, ctx.members);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-brand-2/10 p-6">
        <p className="text-sm text-muted-foreground capitalize">{todayLongLabel()}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {greeting()}, {ctx.me.displayName} 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Construindo a vida de vocês dois, degrau por degrau. Hoje é mais um
          passo. 💪
        </p>
      </section>

      {/* Finance snapshot */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Finanças · {overview.label}
          </h2>
          <Link href="/financas" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Abrir <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Entradas" value={formatBRL(overview.income)} icon={ArrowDownCircle} tone="success" />
          <StatCard label="Saídas" value={formatBRL(overview.expense)} icon={ArrowUpCircle} tone="danger" />
          <StatCard label="Sobra" value={formatBRL(overview.balance)} icon={Wallet} tone={overview.balance >= 0 ? "brand" : "danger"} />
          <StatCard label="A pagar" value={formatBRL(overview.expensePending)} icon={Clock} tone="warning" />
        </div>
      </section>

      {/* Split + savings */}
      <section className="grid gap-4 lg:grid-cols-2">
        <CoupleSplitCard split={overview.split} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-success" /> Metas de poupança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {savings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma meta ainda.{" "}
                <Link href="/financas" className="text-primary hover:underline">Criar</Link>
              </p>
            ) : (
              savings.slice(0, 3).map((g) => {
                const pct = g.targetCents > 0 ? Math.min(100, (g.currentCents / g.targetCents) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* Modules */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Seus módulos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NAV.filter((n) => n.href !== "/").map((item) => {
            const Icon = item.icon;
            const content = (
              <Card
                className={cn(
                  "h-full p-4 transition-colors",
                  item.available ? "hover:border-primary/40 hover:bg-accent/40" : "opacity-70",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  {!item.available && <Lock className="size-3.5 text-muted-foreground" />}
                </div>
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </Card>
            );
            return item.available ? (
              <Link key={item.href} href={item.href}>{content}</Link>
            ) : (
              <div key={item.href}>{content}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
