"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { createCheckin } from "../actions";

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

function Field({ id, label, placeholder }: { id: string; label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        name={id}
        rows={2}
        placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

export function CheckinForm({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
}) {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("mood", mood ? String(mood) : "");
    try {
      await createCheckin(fd);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Check-in do casal" description="Um momento rápido de conexão. 💞">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Como você está?</Label>
            <div className="flex gap-1">
              {MOODS.map((emoji, i) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setMood((m) => (m === i + 1 ? null : i + 1))}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border text-lg transition-colors",
                    mood === i + 1 ? "border-primary bg-primary/10" : "border-input hover:bg-accent",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Field id="gratitude" label="Sou grato(a) por…" placeholder="Algo que ela/ele fez, um momento…" />
        <Field id="highlight" label="Melhor momento" placeholder="O que mais marcou" />
        <Field id="improve" label="O que podemos melhorar" placeholder="Com leveza e carinho" />

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Salvar check-in
          </Button>
        </div>
      </form>
    </Modal>
  );
}
