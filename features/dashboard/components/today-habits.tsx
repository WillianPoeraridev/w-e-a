"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setHabitCount } from "@/features/habitos/actions";
import { cn } from "@/lib/utils";

export type TodayHabit = {
  id: string;
  name: string;
  color: string;
  target: number;
  todayCount: number;
  todayDone: boolean;
};

export function TodayHabits({ habits, today }: { habits: TodayHabit[]; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const toggle = (h: TodayHabit) =>
    start(async () => {
      await setHabitCount(h.id, today, h.todayDone ? 0 : h.todayCount + 1);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Hábitos de hoje</CardTitle>
        <Link href="/habitos" className="text-xs font-medium text-primary hover:underline">ver todos</Link>
      </CardHeader>
      <CardContent className="pt-0">
        {habits.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            Nenhum hábito. <Link href="/habitos" className="text-primary hover:underline">Criar</Link>
          </p>
        ) : (
          <ul className="space-y-1.5">
            {habits.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(h)}
                  disabled={pending}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold tabular-nums transition-colors disabled:opacity-60"
                  style={h.todayDone ? { backgroundColor: h.color, borderColor: h.color, color: "#fff" } : { borderColor: `${h.color}66`, color: h.color }}
                  aria-label={`Marcar ${h.name}`}
                >
                  {h.todayDone ? <Check className="size-3.5" /> : h.target > 1 ? h.todayCount : null}
                </button>
                <span className={cn("flex-1 truncate text-sm", h.todayDone && "text-muted-foreground line-through")}>{h.name}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
