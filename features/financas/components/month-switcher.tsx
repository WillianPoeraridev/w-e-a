"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { monthKeyOf, parseMonthKey, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function MonthSwitcher({
  month,
  label,
}: {
  month: string;
  label: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const viewed = parseMonthKey(month);
  const current = parseMonthKey(monthKeyOf());
  const [year, setYear] = useState(viewed.year);

  const goTo = (key: string) => {
    router.push(`/financas?m=${key}`);
    router.refresh();
    setOpen(false);
  };
  const step = (delta: number) => goTo(shiftMonth(month, delta));
  const pick = (month1: number) =>
    goTo(`${year}-${String(month1).padStart(2, "0")}`);

  // Browse from the viewed month's year each time the picker opens.
  useEffect(() => {
    if (open) setYear(viewed.year);
  }, [open, viewed.year]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => step(-1)}>
        <ChevronLeft />
      </Button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex min-w-40 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium tabular-nums transition-colors hover:bg-accent"
      >
        {label}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => step(1)}>
        <ChevronRight />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl">
          {/* Year stepper */}
          <div className="mb-2 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Ano anterior" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums">{year}</span>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Próximo ano" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_SHORT.map((m, i) => {
              const month1 = i + 1;
              const isViewed = year === viewed.year && month1 === viewed.month;
              const isCurrent = year === current.year && month1 === current.month;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => pick(month1)}
                  className={cn(
                    "rounded-md py-1.5 text-sm font-medium capitalize transition-colors",
                    isViewed
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                    !isViewed && isCurrent && "text-primary ring-1 ring-primary/40",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => goTo(monthKeyOf())}
            className="mt-2 w-full rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            Ir para o mês atual
          </button>
        </div>
      )}
    </div>
  );
}
