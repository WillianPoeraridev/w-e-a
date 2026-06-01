"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { regenerateSummary } from "../actions";

export function AiSummaryCard({
  text,
  source,
  greeting,
  dateLabel,
  name,
}: {
  text: string;
  source: "ai" | "local";
  greeting: string;
  dateLabel: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-brand-2/10 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting}, {name} 👋
          </h1>
        </div>
        {source === "ai" && (
          <button
            onClick={() => start(async () => { await regenerateSummary(); router.refresh(); })}
            disabled={pending}
            title="Atualizar resumo"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("size-4", pending && "animate-spin")} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed">{text}</p>
      </div>

      <span className="mt-2 inline-block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {source === "ai" ? "✨ resumo por IA" : "resumo local"}
      </span>
    </section>
  );
}
