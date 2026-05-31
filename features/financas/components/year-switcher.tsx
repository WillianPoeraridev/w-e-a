"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function YearSwitcher({ year }: { year: number }) {
  const router = useRouter();
  const go = (delta: number) => {
    router.push(`/financas/resumo?y=${year + delta}`);
    router.refresh();
  };
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" aria-label="Ano anterior" onClick={() => go(-1)}>
        <ChevronLeft />
      </Button>
      <span className="min-w-16 text-center text-sm font-medium tabular-nums">{year}</span>
      <Button variant="outline" size="icon" aria-label="Próximo ano" onClick={() => go(1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}
