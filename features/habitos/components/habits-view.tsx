"use client";

import { Check, Clock, Flame, ListChecks, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { setHabitCount } from "../actions";
import type { HabitWithStats } from "../queries";
import { HabitForm, type HabitMember } from "./habit-form";

const GROUPS = [
  { key: "manha", label: "Manhã", emoji: "☀️" },
  { key: "tarde", label: "Tarde", emoji: "🌤️" },
  { key: "noite", label: "Noite", emoji: "🌙" },
  { key: "sem", label: "Sem horário", emoji: "🕓" },
] as const;

type GroupKey = (typeof GROUPS)[number]["key"];

function periodOf(time: string | null): GroupKey {
  if (!time) return "sem";
  const h = Number(time.slice(0, 2));
  if (h < 12) return "manha";
  if (h < 18) return "tarde";
  return "noite";
}

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

  const grouped = useMemo(() => {
    const map = new Map<GroupKey, HabitWithStats[]>();
    for (const h of habits) {
      const k = periodOf(h.timeOfDay);
      const list = map.get(k) ?? [];
      list.push(h);
      map.set(k, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.timeOfDay ?? "99:99").localeCompare(b.timeOfDay ?? "99:99") ||
        a.name.localeCompare(b.name),
      );
    }
    return map;
  }, [habits]);

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
              Água, treino, leitura, código, dormir cedo… Crie o primeiro hábito,
              dê um horário e marque todo dia. 💪
            </p>
            <Button onClick={openNew} className="mt-1">
              <Plus /> Criar hábito
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const list = grouped.get(g.key) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={g.key}>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <span>{g.emoji}</span> {g.label}
                </h2>
                <div className="space-y-3">
                  {list.map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      ownerName={nameOf(h.ownerUserId)}
                      today={today}
                      pending={pending}
                      onLog={log}
                      onEdit={() => openEdit(h)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <HabitForm open={formOpen} onClose={() => setFormOpen(false)} members={members} initial={formInitial} />
    </div>
  );
}

function HabitRow({
  habit: h,
  ownerName,
  today,
  pending,
  onLog,
  onEdit,
}: {
  habit: HabitWithStats;
  ownerName: string;
  today: string;
  pending: boolean;
  onLog: (habitId: string, dateKey: string, count: number) => void;
  onEdit: () => void;
}) {
  const { stats } = h;
  const meta = [
    h.timeOfDay,
    h.target === 1 ? "todo dia" : `${h.target}x/dia`,
    ownerName,
  ].filter(Boolean);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {h.icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: `${h.color}1f` }}>
            {h.icon}
          </span>
        ) : (
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: h.color }} />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{h.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {h.timeOfDay && <Clock className="size-3" />}
            {meta.join(" · ")}
          </p>
        </div>

        {stats.streak > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/15 to-red-500/15 px-2.5 py-1 text-sm font-bold text-orange-600 dark:text-orange-400"
            title={stats.bestStreak > stats.streak ? `Recorde: ${stats.bestStreak} dias` : `Sequência: ${stats.streak} dias`}
          >
            <Flame className="size-5 animate-flame fill-orange-500/40" />
            {stats.streak}
          </span>
        ) : stats.bestStreak > 0 ? (
          <span className="text-xs text-muted-foreground" title="Melhor sequência">
            rec. {stats.bestStreak}
          </span>
        ) : null}

        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>

        <button
          type="button"
          disabled={pending}
          onClick={() => onLog(h.id, today, stats.todayDone ? 0 : stats.todayCount + 1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums transition-colors disabled:opacity-60"
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
            onClick={() => onLog(h.id, c.key, c.done ? 0 : h.target)}
            className="flex flex-col items-center gap-1 disabled:opacity-60"
            title={c.key}
          >
            <span className={cn("text-[10px] capitalize", c.isToday ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {c.wd}
            </span>
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
}
