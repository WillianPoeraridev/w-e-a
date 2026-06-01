"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { askWea } from "../actions";

type Msg = { role: "user" | "wea"; text: string };

const SUGGESTIONS = [
  "Como foi minha semana?",
  "Quanto gastei esse mês?",
  "Como tá meu sono?",
  "Tô perto das minhas metas?",
];

export function Assistant({ enabled }: { enabled: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || loading) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setQ("");
    setLoading(true);
    const ans = await askWea(text);
    setMsgs((m) => [...m, { role: "wea", text: ans }]);
    setLoading(false);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Pergunte ao WeA
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {msgs.length > 0 && (
          <div ref={scrollRef} className="mb-3 max-h-64 space-y-2 overflow-y-auto">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                  {m.text}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <p className="rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="inline size-3.5 animate-spin" /> pensando…
                </p>
              </div>
            )}
          </div>
        )}

        {msgs.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={enabled ? "Pergunte sobre a vida de vocês…" : "Ative a IA pra perguntar (chave grátis)"} />
          <Button type="submit" size="icon" disabled={loading || !q.trim()} aria-label="Enviar">
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
