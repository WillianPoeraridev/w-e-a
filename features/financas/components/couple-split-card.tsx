import { ArrowRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAmount, formatBRL } from "@/lib/money";
import { createSplitSettlement } from "../actions";
import type { CoupleSplit } from "../queries";

/** Shows shared-expense fairness: who paid vs fair share, and the settlement. */
export function CoupleSplitCard({
  split,
  month,
  defaultDate,
}: {
  split: CoupleSplit;
  month: string;
  defaultDate: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="size-4 text-primary" /> Divisão do casal
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-3 text-xs text-muted-foreground">
          Gastos compartilhados do mês: <strong>{formatBRL(split.total)}</strong>
        </p>

        <div className="space-y-3">
          {split.members.map((m) => (
            <div key={m.userId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  pagou {formatBRL(m.paid)} / justo {formatBRL(m.fairShare)}
                </span>
              </div>
              {m.settled !== 0 && (
                <p className="mb-1 text-right text-xs text-muted-foreground">
                  acerto {m.settled > 0 ? "+" : "-"}{formatBRL(Math.abs(m.settled))}
                </p>
              )}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${split.total > 0 ? Math.min(100, (m.paid / split.total) * 100) : 0}%`,
                    backgroundColor: m.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-center text-sm">
          {split.settlement ? (
            <form action={createSplitSettlement} className="flex flex-col items-center gap-3">
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="fromUserId" value={split.settlement.fromUserId} />
              <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
                <strong>{split.settlement.fromName}</strong>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <strong>{split.settlement.toName}</strong>
                <span className="font-semibold text-primary">
                  {formatBRL(split.settlement.amount)}
                </span>
              </span>
              <div className="grid w-full grid-cols-2 gap-2 text-left">
                <div className="space-y-1">
                  <Label htmlFor="split-amount" className="text-xs">
                    Valor
                  </Label>
                  <Input
                    id="split-amount"
                    name="amount"
                    inputMode="decimal"
                    defaultValue={formatAmount(split.settlement.amount)}
                    className="h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="split-date" className="text-xs">
                    Data
                  </Label>
                  <Input
                    id="split-date"
                    name="date"
                    type="date"
                    defaultValue={defaultDate}
                    className="h-8"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm" variant="secondary" className="h-8">
                Registrar acerto
              </Button>
            </form>
          ) : (
            <span className="text-muted-foreground">Contas equilibradas — ninguém deve nada. 💚</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
