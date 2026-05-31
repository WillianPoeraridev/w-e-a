"use client";

import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { createWorkout, deleteWorkout, updateWorkout } from "../actions";
import { WORKOUT_KINDS } from "../kinds";
import { gramsFromKg, kgFromGrams } from "../lib";
import type { WorkoutLite } from "../queries";

export type WorkoutMember = { userId: string; displayName: string; color: string };

type Row = { exercise: string; sets: string; reps: string; weight: string };

function rowsFromInitial(w: WorkoutLite | null | undefined): Row[] {
  if (!w || w.sets.length === 0) return [{ exercise: "", sets: "", reps: "", weight: "" }];
  return w.sets.map((s) => ({
    exercise: s.exercise,
    sets: s.sets?.toString() ?? "",
    reps: s.reps?.toString() ?? "",
    weight: s.weightGrams != null ? String(kgFromGrams(s.weightGrams)) : "",
  }));
}

export function WorkoutForm({
  open,
  onClose,
  members,
  currentUserId,
  defaultDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  members: WorkoutMember[];
  currentUserId: string;
  defaultDate: string;
  initial?: WorkoutLite | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [kind, setKind] = useState<string>(initial?.kind ?? "strength");
  const [target, setTarget] = useState<string>(initial?.ownerUserId ?? currentUserId);
  const [rows, setRows] = useState<Row[]>(rowsFromInitial(initial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { exercise: "", sets: "", reps: "", weight: "" }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  function ownership() {
    if (target === "casa") return { ownerUserId: "", scope: "shared" };
    return { ownerUserId: target, scope: "personal" };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const own = ownership();
    fd.set("kind", kind);
    fd.set("ownerUserId", own.ownerUserId);
    fd.set("scope", own.scope);

    const exercises = rows
      .filter((r) => r.exercise.trim())
      .map((r) => ({
        exercise: r.exercise.trim(),
        sets: r.sets ? Number(r.sets) : null,
        reps: r.reps ? Number(r.reps) : null,
        weightGrams: r.weight ? gramsFromKg(Number(r.weight)) : null,
      }));
    fd.set("exercises", JSON.stringify(exercises));

    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateWorkout(fd);
      } else {
        await createWorkout(fd);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!initial || !confirm("Excluir este treino?")) return;
    setLoading(true);
    await deleteWorkout(initial.id);
    router.refresh();
    onClose();
  }

  const targets = [
    ...members.map((m) => ({ value: m.userId, label: m.displayName, color: m.color })),
    { value: "casa", label: "Casa", color: "#6366f1" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar treino" : "Novo treino"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Treino</Label>
          <Input id="title" name="title" placeholder="Ex: Peito e tríceps, corrida 5k…" defaultValue={initial?.title ?? ""} required autoFocus />
        </div>

        {/* Kind */}
        <div className="flex flex-wrap gap-2">
          {WORKOUT_KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                  kind === k.key ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-3.5" /> {k.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={initial?.date ?? defaultDate} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="durationMin">Duração (min)</Label>
            <Input id="durationMin" name="durationMin" type="number" min={0} placeholder="60" defaultValue={initial?.durationMin ?? ""} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>De quem</Label>
          <div className="grid grid-cols-3 gap-2">
            {targets.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTarget(t.value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  target === t.value ? "border-primary bg-primary/10" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-2">
          <Label>Exercícios</Label>
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Exercício"
                value={r.exercise}
                onChange={(e) => setRow(i, { exercise: e.target.value })}
                className="h-9 min-w-[120px] flex-1"
              />
              <Input type="number" min={0} placeholder="séries" value={r.sets} onChange={(e) => setRow(i, { sets: e.target.value })} className="h-9 w-16" />
              <span className="text-xs text-muted-foreground">×</span>
              <Input type="number" min={0} placeholder="reps" value={r.reps} onChange={(e) => setRow(i, { reps: e.target.value })} className="h-9 w-16" />
              <Input type="number" min={0} step="0.5" placeholder="kg" value={r.weight} onChange={(e) => setRow(i, { weight: e.target.value })} className="h-9 w-20" />
              <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground/60 hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addRow}>
            <Plus /> Exercício
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Como foi o treino…"
            defaultValue={initial?.notes ?? ""}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {editing ? (
            <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={onDelete} disabled={loading}>
              <Trash2 className="size-4" /> Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {editing ? "Salvar" : "Registrar"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
