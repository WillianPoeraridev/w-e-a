import { ArrowDownCircle, ArrowUpCircle, Clock, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthKeyOf, todaySP, type MonthKey } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { formatBRL } from "@/lib/money";
import {
  CategoryDonut,
  TrendArea,
} from "@/features/financas/components/charts";
import { CategoryManager } from "@/features/financas/components/category-manager";
import { CoupleSplitCard } from "@/features/financas/components/couple-split-card";
import { MonthSwitcher } from "@/features/financas/components/month-switcher";
import { RecurringBillsCard } from "@/features/financas/components/recurring-bills-card";
import { SavingsGoalsCard } from "@/features/financas/components/savings-goals-card";
import { TransactionsCard } from "@/features/financas/components/transactions-card";
import {
  computeOverview,
  getCategories,
  getGeneratedBillIds,
  getBalanceTrend,
  getMonthTransactions,
  getRecurringBills,
  getSavingsGoals,
} from "@/features/financas/queries";

export const metadata = { title: "Finanças" };

function resolveMonth(m?: string): MonthKey {
  return m && /^\d{4}-\d{2}$/.test(m) ? m : monthKeyOf();
}

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const ctx = await requireHousehold();
  const { m } = await searchParams;
  const month = resolveMonth(m);

  const [rows, categories, bills, generatedIds, savings, trend] = await Promise.all([
    getMonthTransactions(ctx.householdId, month),
    getCategories(ctx.householdId),
    getRecurringBills(ctx.householdId),
    getGeneratedBillIds(ctx.householdId, month),
    getSavingsGoals(ctx.householdId),
    getBalanceTrend(ctx.householdId, month, 6),
  ]);

  const overview = computeOverview(month, rows, ctx.members);

  const members = ctx.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    color: m.color,
  }));
  const categoriesLite = categories.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    color: c.color,
  }));
  const donutData = overview.byCategory.map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color,
  }));
  const defaultDate = month === monthKeyOf() ? todaySP() : `${month}-01`;

  return (
    <>
      <PageHeader title="Finanças" subtitle={overview.label}>
        <CategoryManager categories={categoriesLite} />
        <MonthSwitcher month={month} label={overview.label} />
      </PageHeader>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Entradas" value={formatBRL(overview.income)} icon={ArrowDownCircle} tone="success" />
        <StatCard label="Saídas" value={formatBRL(overview.expense)} icon={ArrowUpCircle} tone="danger" />
        <StatCard
          label="Sobra do mês"
          value={formatBRL(overview.balance)}
          icon={Wallet}
          tone={overview.balance >= 0 ? "brand" : "danger"}
          hint={overview.balance >= 0 ? "no azul 💙" : "atenção ao vermelho"}
        />
        <StatCard label="A pagar" value={formatBRL(overview.expensePending)} icon={Clock} tone="warning" hint="contas pendentes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gastos por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryDonut data={donutData} />
                <ul className="mt-3 space-y-1">
                  {overview.byCategory.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-xs">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                      <span className="font-medium tabular-nums">{formatBRL(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução · 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendArea data={trend} />
              </CardContent>
            </Card>
          </div>

          <TransactionsCard
            rows={rows}
            categories={categoriesLite}
            members={members}
            currentUserId={ctx.userId}
            defaultDate={defaultDate}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <CoupleSplitCard split={overview.split} />
          <RecurringBillsCard
            bills={bills.map((b) => ({
              id: b.id,
              name: b.name,
              amountCents: b.amountCents,
              dueDay: b.dueDay,
              payerUserId: b.payerUserId,
              scope: b.scope,
              categoryColor: b.categoryColor,
            }))}
            generatedIds={[...generatedIds]}
            month={month}
            members={members}
          />
          <SavingsGoalsCard
            goals={savings.map((g) => ({
              id: g.id,
              name: g.name,
              targetCents: g.targetCents,
              currentCents: g.currentCents,
              color: g.color,
              deadline: g.deadline,
            }))}
          />
        </div>
      </div>
    </>
  );
}
