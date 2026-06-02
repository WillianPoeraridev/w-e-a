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
import { createTransaction, updateTransaction } from "../actions";
import type { TxRow } from "../queries";
import type { CategoryLite, MemberLite } from "./types";

export function TransactionForm({
  open,
  onClose,
  categories,
  members,
  currentUserId,
  defaultDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryLite[];
  members: MemberLite[];
  currentUserId: string;
  defaultDate: string;
  initial?: TxRow | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const initialKind = initial?.kind === "income" || initial?.kind === "expense" ? initial.kind : "expense";
  const [kind, setKind] = useState<"income" | "expense">(initialKind);
  const [scope, setScope] = useState<"personal" | "shared">(initial?.scope ?? "shared");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cats = categories.filter((c) => c.kind === kind);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    fd.set("scope", scope);
    try {
      if (editing && initial) {
        fd.set("id", initial.id);
        await updateTransaction(fd);
      } else {
        await createTransaction(fd);
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
      title={editing ? "Editar transação" : "Nova transação"}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Kind segmented */}
        <div className="grid grid-cols-2 gap-2">
          <SegBtn active={kind === "expense"} tone="danger" onClick={() => setKind("expense")}>
            Saída
          </SegBtn>
          <SegBtn active={kind === "income"} tone="success" onClick={() => setKind("income")}>
            Entrada
          </SegBtn>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={initial ? formatAmount(initial.amountCents) : ""}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={initial?.date ?? defaultDate}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            name="description"
            placeholder={kind === "income" ? "Ex: Salário, freela…" : "Ex: Mercado, gasolina…"}
            defaultValue={initial?.description ?? ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select id="categoryId" name="categoryId" defaultValue={initial?.categoryId ?? ""}>
              <option value="">Sem categoria</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payerUserId">{kind === "income" ? "Quem recebeu" : "Quem pagou"}</Label>
            <Select
              id="payerUserId"
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

        {kind === "expense" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="paid"
              defaultChecked={initial ? initial.paid : true}
              className="size-4 rounded border-input"
            />
            Já está pago
          </label>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
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
  tone: "danger" | "success" | "brand";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneRing = {
    danger: "border-destructive bg-destructive/10 text-destructive",
    success: "border-success bg-success/10 text-success",
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
