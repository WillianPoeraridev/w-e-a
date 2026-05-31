"use client";

import { Check, Flame, ListChecks, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { setHabitCount } from "../actions";
import type { HabitWithStats } from "../queries";
import { HabitForm, type HabitMember } from "./habit-form";

export function HabitsView({
  habits,
  members,
  today,
}: {
  habits: HabitWithStats[];
  members: HabitMember[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<HabitWithStats | null>(null);

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  const doneToday = habits.filter((h) => h.stats.todayDone).length;
  const pct = habits.length ? (doneToday / habits.length) * 100 : 0;

  const log = (habitId: string, dateKey: string, count: number) => {
    startTransition(async () => {
      await setHabitCount(habitId, dateKey, count);
      router.refresh();
    });
  };

  const openNew = () => {
    setFormInitial(null);
    setFormOpen(true);
  };
  const openEdit = (h: HabitWithStats) => {
    setFormInitial(h);
    setFormOpen(true);
  };

  return (
    <div>
      {/* Summary */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-52 flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">Hoje</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {doneToday} de {habits.length} concluídos
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus /> Novo hábito
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ListChecks className="size-6" />
            </span>
            <p className="font-medium">Comece sua rotina</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Água, treino, leitura, código, dormir cedo… Crie o primeiro hábito e
              marque todo dia. 💪
            </p>
            <Button onClick={openNew} className="mt-1">
              <Plus /> Criar hábito
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => {
            const { stats } = h;
            return (
              <Card key={h.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: h.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.target === 1 ? "todo dia" : `${h.target}x por dia`} · {nameOf(h.ownerUserId)}
                    </p>
                  </div>

                  {stats.streak > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                      <Flame className="size-3.5" />
                      {stats.streak}
                    </span>
                  )}

                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => openEdit(h)}>
                    <Pencil className="size-3.5" />
                  </Button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => log(h.id, today, stats.todayDone ? 0 : stats.todayCount + 1)}
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums transition-colors disabled:opacity-60",
                    )}
                    style={
                      stats.todayDone
                        ? { backgroundColor: h.color, borderColor: h.color, color: "#fff" }
                        : { borderColor: `${h.color}66`, color: h.color }
                    }
                    aria-label="Marcar hoje"
                  >
                    {stats.todayDone ? (
                      <Check className="size-5" />
                    ) : h.target > 1 ? (
                      `${stats.todayCount}/${h.target}`
                    ) : (
                      <Check className="size-5 opacity-25" />
                    )}
                  </button>
                </div>

                {/* 7-day strip */}
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {stats.last7.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      disabled={pending}
                      onClick={() => log(h.id, c.key, c.done ? 0 : h.target)}
                      className="flex flex-col items-center gap-1 disabled:opacity-60"
                      title={c.key}
                    >
                      <span className="text-[10px] text-muted-foreground">{c.wd}</span>
                      <span
                        className={cn(
                          "size-6 rounded-full border transition-colors",
                          c.isToday && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                        )}
                        style={
                          c.done
                            ? { backgroundColor: h.color, borderColor: h.color }
                            : c.count > 0
                              ? { backgroundColor: `${h.color}40`, borderColor: `${h.color}80` }
                              : { borderColor: "hsl(var(--border))" }
                        }
                      />
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <HabitForm open={formOpen} onClose={() => setFormOpen(false)} members={members} initial={formInitial} />
    </div>
  );
}
