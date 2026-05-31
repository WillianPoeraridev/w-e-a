"use client";

import { Plus, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { createCategory, deleteCategory } from "../actions";
import type { CategoryLite } from "./types";

export function CategoryManager({ categories }: { categories: CategoryLite[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Tags /> Categorias
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Categorias">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await createCategory(new FormData(e.currentTarget));
              router.refresh();
              e.currentTarget.reset();
            } finally {
              setLoading(false);
            }
          }}
          className="mb-5 grid grid-cols-[1fr_auto_auto_auto] items-end gap-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Nova categoria</Label>
            <Input id="cat-name" name="name" placeholder="Nome" required />
          </div>
          <Select name="kind" defaultValue="expense" className="w-28">
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </Select>
          <input name="color" type="color" defaultValue="#6366f1" className="h-10 w-12 rounded-md border border-input bg-card" />
          <Button type="submit" size="icon" disabled={loading} aria-label="Adicionar">
            <Plus />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-5">
          <CatColumn title="Saídas" items={expense} onDelete={async (id) => { await deleteCategory(id); router.refresh(); }} />
          <CatColumn title="Entradas" items={income} onDelete={async (id) => { await deleteCategory(id); router.refresh(); }} />
        </div>
      </Modal>
    </>
  );
}

function CatColumn({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: CategoryLite[];
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-1">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-sm">
            <span className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="flex-1 truncate">{c.name}</span>
            <button
              onClick={() => { if (confirm(`Excluir "${c.name}"?`)) onDelete(c.id); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma</li>}
      </ul>
    </div>
  );
}
