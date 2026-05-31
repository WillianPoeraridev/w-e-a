import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryDonut,
  CumulativeArea,
  TrendArea,
} from "@/features/financas/components/charts";
import { YearSwitcher } from "@/features/financas/components/year-switcher";
import { getAccumulated, getYearOverview } from "@/features/financas/queries";
import { monthKeyOf } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { formatBRL } from "@/lib/money";

export const metadata = { title: "Visão geral" };

// Defaults to the current year — keep fresh, never cached.
export const dynamic = "force-dynamic";

function resolveYear(y?: string): number {
  if (y && /^\d{4}$/.test(y)) return Number(y);
  return Number(monthKeyOf().slice(0, 4));
}

export default async function ResumoPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  const ctx = await requireHousehold();
  const { y } = await searchParams;
  const year = resolveYear(y);

  const [yr, acc] = await Promise.all([
    getYearOverview(ctx.householdId, year),
    getAccumulated(ctx.householdId),
  ]);

  const donutData = yr.byCategory.map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color,
  }));
  const savingsPct = Math.round(yr.savingsRate * 100);

  return (
    <>
      {/* Year controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Visão do ano de <span className="font-medium text-foreground">{year}</span>
        </p>
        <YearSwitcher year={year} />
      </div>

      {/* Year totals */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Entradas no ano" value={formatBRL(yr.income)} icon={ArrowDownCircle} tone="success" />
        <StatCard label="Saídas no ano" value={formatBRL(yr.expense)} icon={ArrowUpCircle} tone="danger" />
        <StatCard
          label="Sobra no ano"
          value={formatBRL(yr.balance)}
          icon={Wallet}
          tone={yr.balance >= 0 ? "brand" : "danger"}
          hint={`${yr.activeMonths} ${yr.activeMonths === 1 ? "mês" : "meses"} com movimento`}
        />
        <StatCard
          label="Taxa de poupança"
          value={`${savingsPct}%`}
          icon={TrendingUp}
          tone={savingsPct >= 0 ? "success" : "danger"}
          hint="do que entrou, sobrou"
        />
      </div>

      {/* Year by month + averages */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Por mês · {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendArea data={yr.months.map((m) => ({ label: m.label, income: m.income, expense: m.expense }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Médias mensais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <AvgRow label="Entra / mês" value={formatBRL(yr.avgIncome)} color="text-success" />
            <AvgRow label="Sai / mês" value={formatBRL(yr.avgExpense)} color="text-destructive" />
            <AvgRow label="Sobra / mês" value={formatBRL(yr.avgBalance)} color="text-primary" />
            <p className="pt-1 text-xs text-muted-foreground">
              Média sobre os meses com movimento.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories of the year */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gastos do ano por categoria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CategoryDonut data={donutData} />
          <ul className="space-y-1.5 self-center">
            {yr.byCategory.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                <span className="font-medium tabular-nums">{formatBRL(c.total)}</span>
              </li>
            ))}
            {yr.byCategory.length === 0 && (
              <li className="text-sm text-muted-foreground">Sem gastos neste ano.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Accumulated / patrimônio */}
      <div className="mb-4 flex items-center gap-2">
        <Landmark className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Patrimônio · acumulado
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Sobrou no total"
          value={formatBRL(acc.allTimeBalance)}
          icon={Wallet}
          tone={acc.allTimeBalance >= 0 ? "brand" : "danger"}
          hint="desde o início"
        />
        <StatCard
          label="Guardado em metas"
          value={formatBRL(acc.savedTotal)}
          icon={PiggyBank}
          tone="success"
          hint={`de ${formatBRL(acc.savedTarget)}`}
        />
        <StatCard label="Entrou no total" value={formatBRL(acc.allTimeIncome)} icon={ArrowDownCircle} tone="success" />
        <StatCard label="Saiu no total" value={formatBRL(acc.allTimeExpense)} icon={ArrowUpCircle} tone="danger" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo acumulado no tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <CumulativeArea data={acc.points.map((p) => ({ label: p.label, cumulative: p.cumulative }))} />
        </CardContent>
      </Card>
    </>
  );
}

function AvgRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
