"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { upsertSleep } from "../actions";
import { QUALITY_LABELS } from "../lib";
import type { SleepLite } from "../queries";

export type SleepMember = { userId: string; displayName: string; color: string };

export function SleepForm({
  open,
  onClose,
  members,
  currentUserId,
  defaultDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  members: SleepMember[];
  currentUserId: string;
  defaultDate: string;
  initial?: SleepLite | null;
}) {
  const router = useRouter();
  const [owner, setOwner] = useState<string>(initial?.ownerUserId ?? currentUserId);
  const [quality, setQuality] = useState<number | null>(initial?.quality ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("ownerUserId", owner);
    fd.set("quality", quality ? String(quality) : "");
    try {
      await upsertSleep(fd);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar noite" : "Registrar sono"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>De quem</Label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => setOwner(m.userId)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  owner === m.userId ? "border-primary bg-primary/10" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.displayName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Acordou no dia</Label>
          <Input id="date" name="date" type="date" defaultValue={initial?.date ?? defaultDate} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bedtime">Dormiu às</Label>
            <Input id="bedtime" name="bedtime" type="time" defaultValue={initial?.bedtime ?? "23:00"} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wake">Acordou às</Label>
            <Input id="wake" name="wake" type="time" defaultValue={initial?.wake ?? "07:00"} required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Qualidade</Label>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuality((q) => (q === n ? null : n))}
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      quality && n <= quality ? "fill-warning text-warning" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            {quality && <span className="text-sm text-muted-foreground">{QUALITY_LABELS[quality]}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Acordei no meio da noite, sonhei…"
            defaultValue={initial?.notes ?? ""}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
