"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { shiftMonth } from "@/lib/dates";
import { Button } from "@/components/ui/button";

export function MonthSwitcher({
  month,
  label,
}: {
  month: string;
  label: string;
}) {
  const router = useRouter();
  const go = (delta: number) => {
    const next = shiftMonth(month, delta);
    router.push(`/financas?m=${next}`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => go(-1)}>
        <ChevronLeft />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium tabular-nums">
        {label}
      </span>
      <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => go(1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}
