"use client";

import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleGauge, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { formatKg } from "../lib";
import { exerciseHistory, getProgressionAdvice, type ProgressionEntry } from "../progression";
import type { WorkoutLite } from "../queries";
import type { WorkoutMember } from "./workout-form";

function entriesFromWorkouts(workouts: WorkoutLite[]): ProgressionEntry[] {
  return workouts.flatMap((workout) =>
    workout.sets.map((set) => ({
      date: workout.date,
      ownerUserId: workout.ownerUserId,
      exercise: set.exercise,
      sets: set.sets,
      reps: set.reps,
      weightGrams: set.weightGrams,
      targetRepsMin: set.targetRepsMin,
      targetRepsMax: set.targetRepsMax,
      rir: set.rir,
    })),
  );
}

const TONE = {
  increase: { icon: ArrowUpRight, className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  hold: { icon: Minus, className: "border-primary/20 bg-primary/10 text-primary" },
  recover: { icon: AlertTriangle, className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  setup: { icon: CircleGauge, className: "border-border bg-muted/50 text-muted-foreground" },
};

export function ProgressionCoach({
  workouts,
  members,
  currentUserId,
}: {
  workouts: WorkoutLite[];
  members: WorkoutMember[];
  currentUserId: string;
}) {
  const [owner, setOwner] = useState(currentUserId);
  const [selectedExercise, setSelectedExercise] = useState("");
  const entries = useMemo(() => entriesFromWorkouts(workouts), [workouts]);
  const exercises = useMemo(
    () => [...new Set(entries.filter((entry) => entry.ownerUserId === owner && entry.weightGrams !== null).map((entry) => entry.exercise))]
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [entries, owner],
  );
  const exercise = exercises.includes(selectedExercise) ? selectedExercise : (exercises[0] ?? "");
  const history = exerciseHistory(entries, exercise, owner);
  const advice = getProgressionAdvice(history);
  const latest = [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
  const tone = TONE[advice.tone];
  const Icon = tone.icon;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={owner} onChange={(event) => setOwner(event.target.value)} aria-label="Pessoa">
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>{member.displayName}</option>
          ))}
        </Select>
        <Select value={exercise} onChange={(event) => setSelectedExercise(event.target.value)} aria-label="Exercício" disabled={!exercise}>
          {exercises.length === 0 ? <option>Sem exercícios com carga</option> : exercises.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
      </div>

      {exercise ? (
        <>
          {latest && (
            <p className="text-xs text-muted-foreground">
              Último registro: {latest.sets ?? "—"} séries × {latest.reps ?? "—"} reps · {latest.weightGrams !== null ? formatKg(latest.weightGrams) : "sem carga"}
              {latest.rir !== null ? ` · RIR ${latest.rir}` : " · RIR não registrado"}
            </p>
          )}
          <div className={`rounded-xl border p-3 ${tone.className}`}>
            <div className="flex gap-2.5">
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{advice.title}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{advice.detail}</p>
                {advice.suggestedWeightGrams !== null && advice.tone === "increase" && (
                  <p className="mt-2 text-sm font-semibold tabular-nums">Próxima referência: {formatKg(advice.suggestedWeightGrams)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            A regra só orienta a progressão. Interrompa se houver dor, alteração de técnica ou mal-estar e procure um profissional qualificado quando necessário.
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
          Registre um treino de força com carga para receber uma recomendação individual.
        </p>
      )}
    </div>
  );
}
