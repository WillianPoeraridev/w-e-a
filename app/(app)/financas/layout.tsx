import { FinanceTabs } from "@/features/financas/components/finance-tabs";

export default function FinancasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Finanças</h1>
        <FinanceTabs />
      </div>
      {children}
    </div>
  );
}
