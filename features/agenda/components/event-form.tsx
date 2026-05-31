"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { createEvent, deleteEvent, updateEvent } from "../actions";
import type { EventLite } from "../queries";

export type EventMember = { userId: string; displayName: string; color: string };

const SHARED = { label: "Casa", color: "#6366f1" };

function targetFromEvent(e: EventLite | null | undefined): string {
  return e?.ownerUserId ?? "casa";
}

export function EventForm({
  open,
  onClose,
  members,
  defaultDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  members: EventMember[];
  defaultDate: string;
  initial?: EventLite | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [target, setTarget] = useState<string>(targetFromEvent(initial));
  const [allDay, setAllDay] = useState<boolean>(initial?.allDay ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ownership() {
    if (target === "casa") {
      return { ownerUserId: "", scope: "shared", color: SHARED.color };
    }
    const m = members.find((x) => x.userId === target);
    return { ownerUserId: target, scope: "personal", color: m?.color ?? SHARED.color };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const own = ownership();
    fd.set("ownerUserId", own.ownerUserId);
    fd.set("scope", own.scope);
    fd.set("color", own.color);
    fd.set("allDay", allDay ? "true" : "");
    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateEvent(fd);
      } else {
        await createEvent(fd);
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
    if (!initial || !confirm("Excluir este evento?")) return;
    setLoading(true);
    await deleteEvent(initial.id);
    router.refresh();
    onClose();
  }

  const targets = [...members.map((m) => ({ value: m.userId, label: m.displayName, color: m.color })), { value: "casa", label: SHARED.label, color: SHARED.color }];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar evento" : "Novo evento"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" placeholder="Ex: Jantar, médico, reunião…" defaultValue={initial?.title ?? ""} required autoFocus />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Para quem</Label>
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
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={initial?.dateKey ?? defaultDate} required />
          </div>
          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-4 rounded border-input" />
            Dia inteiro
          </label>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Início</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue={initial?.startTime ?? "09:00"} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime">Fim (opcional)</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue={initial?.endTime ?? ""} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Local (opcional)</Label>
          <Input id="location" name="location" placeholder="Onde?" defaultValue={initial?.location ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Notas (opcional)</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Detalhes…"
            defaultValue={initial?.description ?? ""}
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
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
