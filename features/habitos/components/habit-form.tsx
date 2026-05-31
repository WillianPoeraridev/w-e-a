"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { createHabit, deleteHabit, updateHabit } from "../actions";
import type { HabitWithStats } from "../queries";

export type HabitMember = { userId: string; displayName: string; color: string };

export function HabitForm({
  open,
  onClose,
  members,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  members: HabitMember[];
  initial?: HabitWithStats | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [target, setTarget] = useState<string>(initial?.ownerUserId ?? "casa");
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
    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateHabit(fd);
      } else {
        await createHabit(fd);
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
    if (!initial || !confirm("Excluir este hábito e seu histórico?")) return;
    setLoading(true);
    await deleteHabit(initial.id);
    router.refresh();
    onClose();
  }

  const targets = [
    ...members.map((m) => ({ value: m.userId, label: m.displayName, color: m.color })),
    { value: "casa", label: "Casa", color: "#6366f1" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar hábito" : "Novo hábito"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Hábito</Label>
          <Input id="name" name="name" placeholder="Ex: Beber água, treinar, ler…" defaultValue={initial?.name ?? ""} required autoFocus />
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target">Vezes por dia</Label>
            <Input id="target" name="target" type="number" min={1} max={50} defaultValue={initial?.target ?? 1} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="color">Cor</Label>
            <input id="color" name="color" type="color" defaultValue={initial?.color ?? "#6366f1"} className="h-10 w-full rounded-md border border-input bg-card" />
          </div>
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
              {editing ? "Salvar" : "Criar hábito"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
