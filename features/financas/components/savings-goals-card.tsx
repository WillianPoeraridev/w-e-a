"use client";

import { Plus, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import {
  contributeSavings,
  createSavingsGoal,
  deleteSavingsGoal,
} from "../actions";

type GoalLite = {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  color: string;
  deadline: string | null;
};

export function SavingsGoalsCard({ goals }: { goals: GoalLite[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [contributeFor, setContributeFor] = useState<GoalLite | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-success" /> Metas de poupança
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus /> Meta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {goals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Crie sua primeira meta — reserva, viagem, sonho a dois. ✨
          </p>
        ) : (
          goals.map((g) => {
            const pct = g.targetCents > 0 ? Math.min(100, (g.currentCents / g.targetCents) * 100) : 0;
            return (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{g.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setContributeFor(g)}>
                      <Plus className="size-3" /> aporte
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        if (!confirm("Excluir esta meta?")) return;
                        await deleteSavingsGoal(g.id);
                        router.refresh();
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <p className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{formatBRL(g.currentCents)}</span>
                  <span>{Math.round(pct)}% de {formatBRL(g.targetCents)}</span>
                </p>
              </div>
            );
          })
        )}
      </CardContent>

      <CreateGoalModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ContributeModal goal={contributeFor} onClose={() => setContributeFor(null)} />
    </Card>
  );
}

function CreateGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Nova meta de poupança">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await createSavingsGoal(new FormData(e.currentTarget));
            router.refresh();
            onClose();
          } finally {
            setLoading(false);
          }
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-name">Nome</Label>
          <Input id="g-name" name="name" placeholder="Reserva de emergência" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="g-target">Alvo (R$)</Label>
            <Input id="g-target" name="target" inputMode="decimal" placeholder="10.000,00" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="g-current">Já guardado (R$)</Label>
            <Input id="g-current" name="current" inputMode="decimal" placeholder="0,00" defaultValue="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="g-color">Cor</Label>
            <input id="g-color" name="color" type="color" defaultValue="#10b981" className="h-10 w-full rounded-md border border-input bg-card" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="g-deadline">Prazo (opcional)</Label>
            <Input id="g-deadline" name="deadline" type="date" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>Criar meta</Button>
        </div>
      </form>
    </Modal>
  );
}

function ContributeModal({ goal, onClose }: { goal: GoalLite | null; onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function move(sign: 1 | -1) {
    const cents = parseBRLToCents(amount);
    if (!cents) return;
    setLoading(true);
    try {
      if (goal) await contributeSavings(goal.id, sign * cents);
      router.refresh();
      setAmount("");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={Boolean(goal)} onClose={onClose} title={goal ? `Aporte · ${goal.name}` : ""}>
      <div className="flex flex-col gap-4">
        {goal && (
          <p className="text-sm text-muted-foreground">
            Atual: <strong className="text-foreground">{formatBRL(goal.currentCents)}</strong> de {formatBRL(goal.targetCents)}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-amount">Valor (R$)</Label>
          <Input id="c-amount" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => move(-1)} disabled={loading || !amount}>Retirar</Button>
          <Button onClick={() => move(1)} disabled={loading || !amount}>Adicionar</Button>
        </div>
      </div>
    </Modal>
  );
}
