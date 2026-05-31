"use client";

import { Clock, Moon, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDaysKey, formatDayShort } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteSleep } from "../actions";
import { fmtDuration } from "../lib";
import type { SleepLite } from "../queries";
import { SleepChart } from "./sleep-chart";
import { SleepForm, type SleepMember } from "./sleep-form";

function Stars({ q }: { q: number | null }) {
  if (!q) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= q ? "fill-warning text-warning" : "text-muted-foreground/30")} />
      ))}
    </span>
  );
}

export function SonoView({
  logs,
  members,
  currentUserId,
  today,
}: {
  logs: SleepLite[];
  members: SleepMember[];
  currentUserId: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [person, setPerson] = useState<string>(currentUserId);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<SleepLite | null>(null);

  const personLogs = useMemo(() => logs.filter((l) => l.ownerUserId === person), [logs, person]);

  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());
  const weekLogs = personLogs.filter((l) => l.date >= weekStart && l.date <= today);

  const avgDuration = weekLogs.length
    ? Math.round(weekLogs.reduce((a, l) => a + (l.durationMin ?? 0), 0) / weekLogs.length)
    : 0;
  const qualityLogs = weekLogs.filter((l) => l.quality != null);
  const avgQuality = qualityLogs.length
    ? qualityLogs.reduce((a, l) => a + (l.quality ?? 0), 0) / qualityLogs.length
    : 0;

  const chartData = useMemo(() => {
    const since = addDaysKey(today, -13);
    return [...personLogs]
      .filter((l) => l.date >= since && l.durationMin != null)
      .reverse()
      .map((l) => ({ label: formatDayShort(l.date), hours: (l.durationMin ?? 0) / 60 }));
  }, [personLogs, today]);

  const openNew = () => {
    setFormInitial(null);
    setFormOpen(true);
  };
  const openEdit = (l: SleepLite) => {
    setFormInitial(l);
    setFormOpen(true);
  };

  return (
    <div>
      {/* Person toggle + new */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {members.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => setPerson(m.userId)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                person === m.userId ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
              {m.displayName}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus /> Registrar sono
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Média na semana" value={avgDuration ? fmtDuration(avgDuration) : "—"} icon={Clock} tone="brand" />
        <StatCard label="Qualidade média" value={avgQuality ? avgQuality.toFixed(1) : "—"} hint="de 5" icon={Star} tone="warning" />
        <StatCard label="Noites na semana" value={String(weekLogs.length)} icon={Moon} tone="success" />
      </div>

      {/* Chart */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sono · últimas 2 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <SleepChart data={chartData} />
        </CardContent>
      </Card>

      {/* Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {personLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Moon className="size-7 text-primary" />
              <p className="font-medium">Nenhuma noite registrada</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Registre a que horas dormiu e acordou — a duração é calculada
                sozinha. 🌙
              </p>
              <Button size="sm" onClick={openNew} className="mt-1">
                <Plus /> Registrar sono
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {personLogs.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-sm font-semibold leading-none tabular-nums">{fmtDuration(l.durationMin ?? 0)}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{formatDayShort(l.date)}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      {l.bedtime && l.wake ? `${l.bedtime}–${l.wake}` : ""}
                      <Stars q={l.quality} />
                    </p>
                    {l.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => openEdit(l)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await deleteSleep(l.id); router.refresh(); })}
                    className="text-muted-foreground/60 hover:text-destructive disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SleepForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        members={members}
        currentUserId={person}
        defaultDate={today}
        initial={formInitial}
      />
    </div>
  );
}
