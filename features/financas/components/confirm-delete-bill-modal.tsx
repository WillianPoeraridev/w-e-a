"use client";

import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { confirmAndDeleteRecurringBill } from "../actions";

/**
 * Confirmação destrutiva com re-autenticação para contas fixas.
 * Espelha `ConfirmDeleteModal` (de transações) — mesma camada de segurança.
 * A `key` no pai reinicia o estado entre alvos sem precisar de useEffect.
 */
export function ConfirmDeleteBillModal({
  open,
  billId,
  billName,
  onClose,
  onDeleted,
}: {
  open: boolean;
  billId: string | null;
  billName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!billId) return;
    if (password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await confirmAndDeleteRecurringBill({ id: billId, password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Excluir conta fixa"
      description="Confirme sua senha para continuar. Lançamentos já gerados nos meses anteriores não serão afetados."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-foreground/80">
            Você está prestes a excluir a conta fixa{" "}
            <span className="font-medium text-foreground">
              “{billName || "esta conta"}”
            </span>
            . Lançamentos já gerados do mês corrente permanecem no histórico.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-bill-password">Sua senha</Label>
          <div className="relative">
            <Input
              id="confirm-bill-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              required
              minLength={8}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              disabled={loading}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
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
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
