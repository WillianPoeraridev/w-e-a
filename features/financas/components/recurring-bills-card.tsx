"use client";

import { CheckCircle2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, sumCents } from "@/lib/money";
import { generateMonthBills } from "../actions";
import { ConfirmDeleteBillModal } from "./confirm-delete-bill-modal";
import { RecurringBillForm, type RecurringBillLite } from "./recurring-bill-form";
import type { CategoryLite, MemberLite } from "./types";

export type BillLite = {
  id: string;
  name: string;
  amountCents: number;
  dueDay: number;
  payerUserId: string | null;
  scope: "personal" | "shared";
  splitKind: "none" | "equal" | "income";
  categoryId: string | null;
  categoryColor: string | null;
};

export function RecurringBillsCard({
  bills,
  generatedIds,
  month,
  members,
  categories,
  currentUserId,
}: {
  bills: BillLite[];
  generatedIds: string[];
  month: string;
  members: MemberLite[];
  categories: CategoryLite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BillLite | null>(null);
  const [deleting, setDeleting] = useState<BillLite | null>(null);
  const done = new Set(generatedIds);
  const pending = bills.filter((b) => !done.has(b.id));
  const total = sumCents(bills.map((b) => b.amountCents));

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(b: BillLite) {
    setEditing(b);
    setFormOpen(true);
  }

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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onGenerate} disabled={loading || pending.length === 0}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Lançar mês
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus /> Nova
          </Button>
        </div>
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
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => openEdit(b)}
                    aria-label={`Editar ${b.name}`}
                    title="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleting(b)}
                    aria-label={`Excluir ${b.name}`}
                    title="Excluir (pede confirmação com senha)"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {msg && <p className="mt-3 text-center text-xs text-muted-foreground">{msg}</p>}
      </CardContent>

      <RecurringBillForm
        // `key` muda a cada alvo (criar/editar) — React remonta o componente
        // e reinicia o estado interno (scope, splitKind, error).
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        categories={categories}
        members={members}
        currentUserId={currentUserId}
        initial={editing as RecurringBillLite | null}
      />

      <ConfirmDeleteBillModal
        // Mesma estratégia de `key` para resetar senha/erro entre alvos.
        key={deleting?.id ?? "closed"}
        open={deleting !== null}
        billId={deleting?.id ?? null}
        billName={deleting?.name ?? ""}
        onClose={() => setDeleting(null)}
        onDeleted={() => router.refresh()}
      />
    </Card>
  );
}
