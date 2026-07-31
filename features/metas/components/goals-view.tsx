"use client";

import {
  Check,
  CircleCheckBig,
  Flag,
  Pencil,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  addMilestone,
  deleteMilestone,
  setGoalStatus,
  toggleMilestone,
} from "../actions";
import { PILLARS } from "../pillars";
import type { GoalWithMilestones } from "../queries";
import { GoalForm, type GoalMember } from "./goal-form";

const NONE = "__none__";
const GROUPS = [
  ...PILLARS.map((p) => ({ key: p.key as string, label: p.label, short: p.short, icon: p.icon, color: p.color })),
  { key: NONE, label: "Outras metas", short: "Sem pilar definido", icon: Sparkles, color: "#9ca3af" },
];

function daysUntil(dateKey: string, today: string): number {
  const [ty, tm, td] = dateKey.split("-").map(Number);
  const [cy, cm, cd] = today.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(cy, cm - 1, cd)) / 86400000);
}

const STATUS_BADGE = {
  active: { label: "Ativa", variant: "default" as const },
  paused: { label: "Pausada", variant: "warning" as const },
  done: { label: "Concluída", variant: "success" as const },
};

export function GoalsView({
  goals,
  members,
  habits,
  today,
}: {
  goals: GoalWithMilestones[];
  members: GoalMember[];
  habits: { id: string; title: string }[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<GoalWithMilestones | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  const byPillar = useMemo(() => {
    const map = new Map<string, GoalWithMilestones[]>();
    for (const g of goals) {
      const k = g.pillar ?? NONE;
      const list = map.get(k) ?? [];
      list.push(g);
      map.set(k, list);
    }
    return map;
  }, [goals]);

  const active = goals.filter((g) => g.status === "active").length;
  const done = goals.filter((g) => g.status === "done").length;

  const openNew = () => {
    setFormInitial(null);
    setFormOpen(true);
  };
  const openEdit = (g: GoalWithMilestones) => {
    setFormInitial(g);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{active}</span> ativa(s) ·{" "}
          <span className="font-medium text-foreground">{done}</span> concluída(s)
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus /> Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="size-6" />
            </span>
            <p className="font-medium">Defina seus objetivos</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Organize por pilar (Gestão, Relacionamento, Carreira), quebre em
              etapas e avance degrau por degrau. 🎯
            </p>
            <Button onClick={openNew} className="mt-1">
              <Plus /> Criar meta
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-7">
          {GROUPS.map((g) => {
            const list = byPillar.get(g.key) ?? [];
            if (list.length === 0) return null;
            const Icon = g.icon;
            const avg = Math.round(list.reduce((a, x) => a + x.progress, 0) / list.length);
            return (
              <section key={g.key}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${g.color}1f`, color: g.color }}>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold leading-tight">{g.label}</h2>
                    <p className="text-xs text-muted-foreground">{g.short}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">{avg}%</span>
                </div>
                <div className="space-y-3">
                  {list.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      color={g.color}
                      ownerName={nameOf(goal.ownerUserId)}
                      today={today}
                      pending={pending}
                      run={run}
                      onEdit={() => openEdit(goal)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} members={members} habits={habits} initial={formInitial} />
    </div>
  );
}

function GoalCard({
  goal,
  color,
  ownerName,
  today,
  pending,
  run,
  onEdit,
}: {
  goal: GoalWithMilestones;
  color: string;
  ownerName: string;
  today: string;
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
  onEdit: () => void;
}) {
  const [newStep, setNewStep] = useState("");
  const badge = STATUS_BADGE[goal.status];
  const isDone = goal.status === "done";

  let deadline: { text: string; tone: "muted" | "warn" | "over" } | null = null;
  if (goal.targetDate && !isDone) {
    const d = daysUntil(goal.targetDate, today);
    if (d < 0) deadline = { text: `atrasada ${-d}d`, tone: "over" };
    else if (d === 0) deadline = { text: "vence hoje", tone: "warn" };
    else if (d <= 14) deadline = { text: `faltam ${d}d`, tone: "warn" };
    else deadline = { text: `até ${formatDateBR(goal.targetDate)}`, tone: "muted" };
  } else if (goal.targetDate) {
    deadline = { text: `até ${formatDateBR(goal.targetDate)}`, tone: "muted" };
  }

  const addStep = () => {
    const t = newStep.trim();
    if (!t) return;
    setNewStep("");
    run(() => addMilestone(goal.id, t));
  };

  return (
    <Card className={cn("p-4", isDone && "opacity-75")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-medium", isDone && "line-through")}>{goal.title}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="text-xs text-muted-foreground">{ownerName}</span>
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {!isDone && (
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-success" title="Concluir" onClick={() => run(() => setGoalStatus(goal.id, "done"))}>
              <CircleCheckBig className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
            {goal.isAuto && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-px text-[10px] font-medium text-primary">🔗 auto</span>
            )}
            {goal.isAuto ? goal.autoLabel : goal.total > 0 ? `${goal.doneCount}/${goal.total} etapas` : "progresso"}
          </span>
          <span className="font-semibold tabular-nums">{goal.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full transition-all" style={{ width: `${goal.progress}%`, backgroundColor: color }} />
        </div>
      </div>

      {deadline && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs",
            deadline.tone === "over" && "text-destructive",
            deadline.tone === "warn" && "text-warning",
            deadline.tone === "muted" && "text-muted-foreground",
          )}
        >
          <Flag className="size-3" /> {deadline.text}
        </p>
      )}

      {/* Milestones (degraus) */}
      <div className="mt-3 space-y-1.5">
        {goal.milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => toggleMilestone(m.id, !m.done))}
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-60",
                m.done ? "border-transparent text-white" : "border-input text-transparent hover:border-primary",
              )}
              style={m.done ? { backgroundColor: color } : undefined}
            >
              <Check className="size-3.5" />
            </button>
            <span className={cn("flex-1 text-sm", m.done && "text-muted-foreground line-through")}>{m.title}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteMilestone(m.id))}
              className="text-muted-foreground/60 hover:text-destructive disabled:opacity-60"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-0.5">
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
            <Plus className="size-3" />
          </span>
          <Input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStep();
              }
            }}
            placeholder="Adicionar etapa…"
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {newStep.trim() && (
            <Button size="sm" variant="ghost" className="h-7" disabled={pending} onClick={addStep}>
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
