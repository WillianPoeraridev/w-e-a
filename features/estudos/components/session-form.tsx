"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createSession } from "../actions";
import type { EstudoMember } from "./track-form";

export function SessionForm({
  open,
  onClose,
  members,
  currentUserId,
  defaultDate,
  tracks,
  presetTrackId,
}: {
  open: boolean;
  onClose: () => void;
  members: EstudoMember[];
  currentUserId: string;
  defaultDate: string;
  tracks: { id: string; title: string }[];
  presetTrackId?: string | null;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<string>(currentUserId);
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
      await createSession(fd);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  const targets = [
    ...members.map((m) => ({ value: m.userId, label: m.displayName, color: m.color })),
    { value: "casa", label: "Casa", color: "#6366f1" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Registrar estudo">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minutes">Minutos</Label>
            <Input id="minutes" name="minutes" type="number" min={1} placeholder="30" required autoFocus />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="topic">O que estudou (opcional)</Label>
          <Input id="topic" name="topic" placeholder="Ex: hooks, ponteiros, SQL joins…" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trackId">Trilha (opcional)</Label>
          <Select id="trackId" name="trackId" defaultValue={presetTrackId ?? ""}>
            <option value="">Sem trilha</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </Select>
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

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
