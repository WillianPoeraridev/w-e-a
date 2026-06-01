"use client";

import { CalendarRange, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { weeklyReview } from "../actions";

export function WeeklyReview() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    const r = await weeklyReview();
    setText(r.text);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4 text-primary" /> Revisão da semana
        </CardTitle>
        {text && (
          <Button size="sm" variant="ghost" onClick={gen} disabled={loading}>
            Atualizar
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {text ? (
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{text}</span>
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <p className="text-sm text-muted-foreground">Como foi a semana de vocês + 1 foco pra próxima.</p>
            <Button size="sm" onClick={gen} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} Gerar revisão ✨
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
