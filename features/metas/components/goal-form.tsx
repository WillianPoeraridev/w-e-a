"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createGoal, deleteGoal, updateGoal } from "../actions";
import { PILLARS } from "../pillars";
import type { GoalWithMilestones } from "../queries";

export type GoalMember = { userId: string; displayName: string; color: string };

const STATUSES = [
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "done", label: "Concluída" },
] as const;

export function GoalForm({
  open,
  onClose,
  members,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  members: GoalMember[];
  initial?: GoalWithMilestones | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [target, setTarget] = useState<string>(initial?.ownerUserId ?? "casa");
  const [status, setStatus] = useState<string>(initial?.status ?? "active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    fd.set("ownerUserId", own.ownerUserId);
    fd.set("scope", own.scope);
    fd.set("status", status);
    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateGoal(fd);
      } else {
        await createGoal(fd);
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
    if (!initial || !confirm("Excluir esta meta e suas etapas?")) return;
    setLoading(true);
    await deleteGoal(initial.id);
    router.refresh();
    onClose();
  }

  const targets = [
    ...members.map((m) => ({ value: m.userId, label: m.displayName, color: m.color })),
    { value: "casa", label: "Casa", color: "#6366f1" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar meta" : "Nova meta"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Meta</Label>
          <Input id="title" name="title" placeholder="Ex: Guardar R$10k, ler 12 livros…" defaultValue={initial?.title ?? ""} required autoFocus />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Por quê / detalhes…"
            defaultValue={initial?.description ?? ""}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pillar">Pilar</Label>
            <Select id="pillar" name="pillar" defaultValue={initial?.pillar ?? ""}>
              <option value="">Geral</option>
              {PILLARS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetDate">Prazo (opcional)</Label>
            <Input id="targetDate" name="targetDate" type="date" defaultValue={initial?.targetDate ?? ""} />
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

        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  status === s.value ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="progress">Progresso: ignorado se a meta tiver etapas</Label>
          <Input id="progress" name="progress" type="number" min={0} max={100} defaultValue={initial?.manualProgress ?? 0} />
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
              {editing ? "Salvar" : "Criar meta"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
