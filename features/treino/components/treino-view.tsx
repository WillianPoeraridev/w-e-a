"use client";

import { CalendarDays, Clock, Dumbbell, Pencil, Plus, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { addDaysKey, formatDayShort } from "@/lib/dates";
import { KIND_MAP } from "../kinds";
import { formatKg, kgFromGrams } from "../lib";
import type { SetLite, WorkoutLite } from "../queries";
import { ProgressChart } from "./progress-chart";
import { WorkoutForm, type WorkoutMember } from "./workout-form";

function setLabel(s: SetLite): string {
  const parts: string[] = [];
  if (s.sets && s.reps) parts.push(`${s.sets}×${s.reps}`);
  else if (s.reps) parts.push(`${s.reps} reps`);
  else if (s.sets) parts.push(`${s.sets} séries`);
  if (s.weightGrams != null) parts.push(formatKg(s.weightGrams));
  return parts.join(" · ");
}

export function TreinoView({
  workouts,
  members,
  currentUserId,
  today,
}: {
  workouts: WorkoutLite[];
  members: WorkoutMember[];
  currentUserId: string;
  today: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<WorkoutLite | null>(null);
  const [selectedEx, setSelectedEx] = useState("");

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  // This week (Sunday → today)
  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());
  const week = workouts.filter((w) => w.date >= weekStart && w.date <= today);
  const weekMin = week.reduce((a, w) => a + (w.durationMin ?? 0), 0);

  const exercises = useMemo(() => {
    const freq = new Map<string, number>();
    for (const w of workouts)
      for (const s of w.sets) freq.set(s.exercise, (freq.get(s.exercise) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [workouts]);

  const exercise = selectedEx || exercises[0] || "";

  const series = useMemo(() => {
    if (!exercise) return [];
    const points: { label: string; kg: number }[] = [];
    for (const w of [...workouts].reverse()) {
      const matching = w.sets.filter((s) => s.exercise === exercise && s.weightGrams != null);
      if (matching.length === 0) continue;
      const maxG = Math.max(...matching.map((s) => s.weightGrams as number));
      points.push({ label: formatDayShort(w.date), kg: kgFromGrams(maxG) });
    }
    return points;
  }, [workouts, exercise]);

  const openNew = () => {
    setFormInitial(null);
    setFormOpen(true);
  };
  const openEdit = (w: WorkoutLite) => {
    setFormInitial(w);
    setFormOpen(true);
  };

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Treinos na semana" value={String(week.length)} icon={CalendarDays} tone="brand" />
        <StatCard label="Minutos na semana" value={String(weekMin)} icon={Clock} tone="success" />
        <StatCard label="Total registrado" value={String(workouts.length)} icon={Dumbbell} hint="treinos" />
      </div>

      <div className="mb-5 flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus /> Novo treino
        </Button>
      </div>

      {workouts.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Dumbbell className="size-6" />
            </span>
            <p className="font-medium">Registre seu primeiro treino</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Anote os exercícios com séries, reps e carga — e acompanhe sua
              evolução com o tempo. 💪
            </p>
            <Button onClick={openNew} className="mt-1">
              <Plus /> Novo treino
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Feed */}
          <div className="space-y-3 lg:col-span-2">
            {workouts.map((w) => {
              const k = KIND_MAP[w.kind];
              const Icon = k.icon;
              return (
                <Card key={w.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${k.color}1f`, color: k.color }}>
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{w.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDayShort(w.date)} · {k.label}
                        {w.durationMin ? ` · ${w.durationMin} min` : ""} · {nameOf(w.ownerUserId)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => openEdit(w)}>
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>

                  {w.sets.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t pt-3">
                      {w.sets.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{s.exercise}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{setLabel(s)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {w.notes && <p className="mt-2 text-sm text-muted-foreground">{w.notes}</p>}
                </Card>
              );
            })}
          </div>

          {/* Progression */}
          <div>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Progressão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {exercises.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Adicione exercícios com carga pra acompanhar a evolução.
                  </p>
                ) : (
                  <>
                    <Select value={exercise} onChange={(e) => setSelectedEx(e.target.value)} className="mb-3">
                      {exercises.map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </Select>
                    <ProgressChart data={series} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <WorkoutForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        members={members}
        currentUserId={currentUserId}
        defaultDate={today}
        initial={formInitial}
      />
    </div>
  );
}
