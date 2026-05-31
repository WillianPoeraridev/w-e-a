"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { createFeed } from "../actions";

export function FeedForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createFeed(new FormData(e.currentTarget));
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Salvar no radar">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-title">Título</Label>
          <Input id="f-title" name="title" placeholder="Ex: React 20 lançado" required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-url">Link</Label>
          <Input id="f-url" name="url" placeholder="https://…" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-source">Fonte (opcional)</Label>
            <Input id="f-source" name="source" placeholder="blog, X, newsletter…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-tags">Tags (opcional)</Label>
            <Input id="f-tags" name="tags" placeholder="react, ia, carreira" />
          </div>
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
