"use client";

import { Loader2, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createDateIdea, suggestDateIdeas, type DateSuggestion } from "../actions";

export function DateSuggestions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [ideas, setIdeas] = useState<DateSuggestion[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    setLoading(true);
    const r = await suggestDateIdeas();
    setEnabled(r.enabled);
    setIdeas(r.ideas);
    setLoading(false);
  }

  async function add(i: DateSuggestion) {
    setAdding(i.title);
    const fd = new FormData();
    fd.set("title", i.title);
    fd.set("category", i.category);
    fd.set("cost", i.cost);
    await createDateIdea(fd);
    router.refresh();
    setIdeas((list) => list.filter((x) => x !== i));
    setAdding(null);
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={load} title="Sugerir com IA">
        <Sparkles /> Sugerir
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ideias de date ✨" description="Sugeridas pela IA — toque pra adicionar.">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="inline size-4 animate-spin" /> pensando em ideias…
          </p>
        ) : !enabled ? (
          <p className="py-4 text-sm text-muted-foreground">
            Ative a IA (chave grátis do Google AI Studio em <span className="font-mono">GEMINI_API_KEY</span>) pra eu sugerir ideias. 💡
          </p>
        ) : ideas.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Não consegui agora — tenta de novo. 🙂</p>
        ) : (
          <ul className="space-y-2">
            {ideas.map((i, idx) => (
              <li key={idx} className="flex items-center gap-2 rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[i.category, i.cost ? `R$ ${i.cost}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={adding === i.title} onClick={() => add(i)}>
                  <Plus /> Adicionar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
