"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { createImportantDate } from "../actions";

const KINDS = [
  { value: "anniversary", label: "Aniversário 💕" },
  { value: "birthday", label: "Niver 🎂" },
  { value: "other", label: "Outro ✨" },
] as const;

export function ImportantDateForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<string>("anniversary");
  const [recurring, setRecurring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    fd.set("recurring", recurring ? "true" : "");
    try {
      await createImportantDate(fd);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Data especial">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="id-title">O que é</Label>
          <Input id="id-title" name="title" placeholder="Ex: Aniversário de namoro, niver da Angélica…" required autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="id-date">Data</Label>
            <Input id="id-date" name="date" type="date" required />
          </div>
          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="size-4 rounded border-input" />
            Todo ano
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  kind === k.value ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="id-notes">Notas (opcional)</Label>
          <Input id="id-notes" name="notes" placeholder="Algo pra lembrar…" />
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
