"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, sumCents } from "@/lib/money";
import { generateMonthBills } from "../actions";
import type { MemberLite } from "./types";

type BillLite = {
  id: string;
  name: string;
  amountCents: number;
  dueDay: number;
  payerUserId: string | null;
  scope: "personal" | "shared";
  categoryColor: string | null;
};

export function RecurringBillsCard({
  bills,
  generatedIds,
  month,
  members,
}: {
  bills: BillLite[];
  generatedIds: string[];
  month: string;
  members: MemberLite[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const done = new Set(generatedIds);
  const pending = bills.filter((b) => !done.has(b.id));
  const total = sumCents(bills.map((b) => b.amountCents));

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  async function onGenerate() {
    setLoading(true);
    setMsg(null);
    const res = await generateMonthBills(month);
    router.refresh();
    setMsg(
      res.generated === 0
        ? "Tudo já lançado neste mês ✓"
        : `${res.generated} conta(s) lançada(s) ✓`,
    );
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Contas fixas</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBRL(total)} / mês · {pending.length} a lançar
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onGenerate} disabled={loading || pending.length === 0}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Lançar mês
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {bills.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma conta fixa cadastrada.
          </p>
        ) : (
          <ul className="divide-y">
            {bills.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: b.categoryColor ?? "#9ca3af" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    dia {b.dueDay} · {nameOf(b.payerUserId)}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatBRL(b.amountCents)}</span>
                {done.has(b.id) ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Badge variant="warning">a lançar</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
        {msg && <p className="mt-3 text-center text-xs text-muted-foreground">{msg}</p>}
      </CardContent>
    </Card>
  );
}
