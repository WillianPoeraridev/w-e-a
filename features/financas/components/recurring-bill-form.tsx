"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/money";
import { createRecurringBill, updateRecurringBill } from "../actions";
import type { CategoryLite, MemberLite } from "./types";

/** Minimal bill shape, only the fields the form needs. */
export type RecurringBillLite = {
  id: string;
  name: string;
  amountCents: number;
  categoryId: string | null;
  dueDay: number;
  payerUserId: string | null;
  scope: "personal" | "shared";
  splitKind: "none" | "equal" | "income";
};

export function RecurringBillForm({
  open,
  onClose,
  categories,
  members,
  currentUserId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryLite[];
  members: MemberLite[];
  currentUserId: string;
  initial?: RecurringBillLite | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [scope, setScope] = useState<"personal" | "shared">(initial?.scope ?? "shared");
  const [splitKind, setSplitKind] = useState<"none" | "equal" | "income">(initial?.splitKind ?? "equal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contas fixas são só SAÍDAS, então filtramos só as categorias de despesa.
  const cats = categories.filter((c) => c.kind === "expense");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("scope", scope);
    fd.set("splitKind", splitKind);
    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateRecurringBill(fd);
      } else {
        await createRecurringBill(fd);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar conta fixa" : "Nova conta fixa"}
      description="Contas fixas são lançadas todo mês a partir do botão “Lançar mês”."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bill-name">Nome</Label>
          <Input
            id="bill-name"
            name="name"
            placeholder="Ex: Aluguel, Internet, Pensão…"
            defaultValue={initial?.name ?? ""}
            required
            autoFocus
            maxLength={60}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-amount">Valor (R$)</Label>
            <Input
              id="bill-amount"
              name="amount"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={initial ? formatAmount(initial.amountCents) : ""}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-dueDay">Dia do vencimento</Label>
            <Input
              id="bill-dueDay"
              name="dueDay"
              type="number"
              min={1}
              max={31}
              defaultValue={initial?.dueDay ?? 10}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-categoryId">Categoria</Label>
            <Select
              id="bill-categoryId"
              name="categoryId"
              defaultValue={initial?.categoryId ?? ""}
            >
              <option value="">Sem categoria</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-payerUserId">Quem paga</Label>
            <Select
              id="bill-payerUserId"
              name="payerUserId"
              defaultValue={initial?.payerUserId ?? currentUserId}
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
              <option value="">Casa</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SegBtn active={scope === "shared"} tone="brand" onClick={() => setScope("shared")}>
            Compartilhado
          </SegBtn>
          <SegBtn active={scope === "personal"} tone="brand" onClick={() => setScope("personal")}>
            Pessoal
          </SegBtn>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Como dividir (split)</Label>
          <div className="grid grid-cols-3 gap-2">
            <SegBtn active={splitKind === "equal"} tone="brand" onClick={() => setSplitKind("equal")}>
              50/50
            </SegBtn>
            <SegBtn active={splitKind === "income"} tone="brand" onClick={() => setSplitKind("income")}>
              Proporcional
            </SegBtn>
            <SegBtn active={splitKind === "none"} tone="brand" onClick={() => setSplitKind("none")}>
              Sem split
            </SegBtn>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {editing ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SegBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "brand";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneRing = {
    brand: "border-primary bg-primary/10 text-primary",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active ? toneRing : "border-input text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
