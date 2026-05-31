"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { createDateIdea } from "../actions";

export function DateIdeaForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createDateIdea(new FormData(e.currentTarget));
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova ideia de date">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="di-title">Ideia</Label>
          <Input id="di-title" name="title" placeholder="Ex: Piquenique no parque, cinema…" required autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="di-cat">Categoria (opcional)</Label>
            <Input id="di-cat" name="category" placeholder="Comida, passeio, casa…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="di-cost">Custo estimado (R$)</Label>
            <Input id="di-cost" name="cost" inputMode="decimal" placeholder="0,00" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="di-desc">Detalhes (opcional)</Label>
          <textarea
            id="di-desc"
            name="description"
            rows={2}
            placeholder="Onde, quando, por quê…"
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
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
