"use client";

import { ArrowDownLeft, ArrowUpRight, HandCoins, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayShort } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { toggleTransactionPaid } from "../actions";
import type { TxRow } from "../queries";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { TransactionForm } from "./transaction-form";
import type { CategoryLite, MemberLite } from "./types";

export function TransactionsCard({
  rows,
  categories,
  members,
  currentUserId,
  defaultDate,
}: {
  rows: TxRow[];
  categories: CategoryLite[];
  members: MemberLite[];
  currentUserId: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TxRow | null>(null);

  const nameOf = (userId: string | null) =>
    userId ? members.find((m) => m.userId === userId)?.displayName ?? "—" : "Casa";

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(tx: TxRow) {
    setEditing(tx);
    setFormOpen(true);
  }
  function openDelete(tx: TxRow) {
    setDeleting(tx);
  }

  async function onTogglePaid(tx: TxRow) {
    setBusy(tx.id);
    await toggleTransactionPaid(tx.id, !tx.paid);
    router.refresh();
    setBusy(null);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Transações do mês</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus /> Nova
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda. Comece adicionando uma entrada ou saída. 👆
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((tx) => {
              const income = tx.kind === "income";
              const settlement = tx.kind === "settlement";
              return (
                <li key={tx.id} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                      income
                        ? "bg-success/12 text-success"
                        : settlement
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive",
                    )}
                    style={!settlement && tx.categoryColor ? { backgroundColor: `${tx.categoryColor}1f`, color: tx.categoryColor } : undefined}
                  >
                    {income ? (
                      <ArrowDownLeft className="size-4" />
                    ) : settlement ? (
                      <HandCoins className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.description || tx.categoryName || (income ? "Entrada" : settlement ? "Acerto" : "Saída")}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDayShort(tx.date)}</span>
                      {tx.categoryName && <span>· {tx.categoryName}</span>}
                      <span>· {nameOf(tx.payerUserId)}</span>
                      {tx.scope === "personal" && <span>· pessoal</span>}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        income ? "text-success" : settlement ? "text-primary" : "text-foreground",
                      )}
                    >
                      {income ? "+" : settlement ? "" : "−"}
                      {formatBRL(tx.amountCents)}
                    </span>
                    {tx.kind === "expense" && (
                      <button
                        onClick={() => onTogglePaid(tx)}
                        disabled={busy === tx.id}
                        className="disabled:opacity-50"
                      >
                        <Badge variant={tx.paid ? "success" : "warning"}>
                          {tx.paid ? "pago" : "pendente"}
                        </Badge>
                      </button>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center">
                    {!settlement && (
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(tx)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => openDelete(tx)}
                      disabled={busy === tx.id || (deleting?.id === tx.id)}
                      title="Excluir (pede confirmação com senha)"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        members={members}
        currentUserId={currentUserId}
        defaultDate={defaultDate}
        initial={editing}
      />

      <ConfirmDeleteModal
        // `key` muda a cada alvo, então o React remonta o componente e o
        // estado interno (senha/erro) é reiniciado sem precisar de useEffect.
        key={deleting?.id ?? "closed"}
        open={deleting !== null}
        txId={deleting?.id ?? null}
        txDescription={
          deleting
            ? deleting.description ||
              deleting.categoryName ||
              (deleting.kind === "income"
                ? "Entrada"
                : deleting.kind === "settlement"
                  ? "Acerto"
                  : "Saída")
            : ""
        }
        onClose={() => setDeleting(null)}
        onDeleted={() => router.refresh()}
      />
    </Card>
  );
}
