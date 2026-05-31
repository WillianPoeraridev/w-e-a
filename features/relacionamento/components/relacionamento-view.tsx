"use client";

import {
  CalendarHeart,
  Gift,
  Heart,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateBR, formatDayShort } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  createGratitude,
  deleteCheckin,
  deleteDateIdea,
  deleteGratitude,
  deleteImportantDate,
  toggleDateIdea,
} from "../actions";
import type {
  CheckinLite,
  DateIdeaLite,
  GratitudeLite,
  ImportantDateLite,
} from "../queries";
import { CheckinForm } from "./checkin-form";
import { DateIdeaForm } from "./dateidea-form";
import { ImportantDateForm } from "./importantdate-form";

const MOODS = ["", "😞", "😕", "😐", "🙂", "😄"];
const KIND_ICON = { anniversary: Heart, birthday: Gift, other: Sparkles };

function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

function occurrence(d: ImportantDateLite, today: string) {
  if (!d.recurring) return { key: d.date, days: diffDays(d.date, today), years: 0 };
  const [oy, om, od] = d.date.split("-").map(Number);
  const ty = Number(today.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  let cand = `${ty}-${pad(om)}-${pad(od)}`;
  if (diffDays(cand, today) < 0) cand = `${ty + 1}-${pad(om)}-${pad(od)}`;
  return { key: cand, days: diffDays(cand, today), years: Number(cand.slice(0, 4)) - oy };
}

function countdownLabel(days: number): string {
  if (days === 0) return "hoje! 🎉";
  if (days === 1) return "amanhã";
  if (days > 0) return `em ${days} dias`;
  return "passou";
}

export function RelacionamentoView({
  checkins,
  gratitude,
  dateIdeas,
  importantDates,
  members,
  currentUserId,
  today,
}: {
  checkins: CheckinLite[];
  gratitude: GratitudeLite[];
  dateIdeas: DateIdeaLite[];
  importantDates: ImportantDateLite[];
  members: { userId: string; displayName: string; color: string }[];
  currentUserId: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  const sortedDates = importantDates
    .map((d) => ({ d, occ: occurrence(d, today) }))
    .sort((a, b) => {
      const ak = a.occ.days >= 0 ? a.occ.days : 1e9 - a.occ.days;
      const bk = b.occ.days >= 0 ? b.occ.days : 1e9 - b.occ.days;
      return ak - bk;
    });

  function sendGratitude() {
    if (!msg.trim()) return;
    const fd = new FormData();
    fd.set("message", msg);
    setMsg("");
    run(() => createGratitude(fd));
  }

  return (
    <div className="space-y-6">
      {/* Datas especiais */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarHeart className="size-4 text-brand-2" /> Datas especiais
          </h2>
          <Button size="sm" variant="outline" onClick={() => setDateOpen(true)}>
            <Plus /> Adicionar
          </Button>
        </div>
        {sortedDates.length === 0 ? (
          <Card className="border-dashed">
            <p className="py-6 text-center text-sm text-muted-foreground">
              Adicione o aniversário de namoro, niveres, datas que importam. 💕
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDates.map(({ d, occ }) => {
              const Icon = KIND_ICON[d.kind];
              const soon = occ.days >= 0 && occ.days <= 7;
              return (
                <Card key={d.id} className="flex items-center gap-3 p-4">
                  <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", soon ? "bg-brand-2/15 text-brand-2" : "bg-secondary text-muted-foreground")}>
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(occ.key)}
                      {d.recurring && occ.years > 0 ? ` · ${occ.years} ano${occ.years > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <Badge variant={soon ? "default" : "secondary"}>{countdownLabel(occ.days)}</Badge>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteImportantDate(d.id))} className="text-muted-foreground/50 hover:text-destructive disabled:opacity-60">
                    <Trash2 className="size-3.5" />
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mural de gratidão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="size-4 text-brand-2" /> Mural de gratidão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-end gap-2">
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={2}
                placeholder="Escreva algo bonito pra ele/ela…"
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button size="icon" disabled={pending || !msg.trim()} onClick={sendGratitude} aria-label="Enviar">
                <Send className="size-4" />
              </Button>
            </div>
            {gratitude.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">As mensagens de carinho aparecem aqui. 💌</p>
            ) : (
              <ul className="space-y-2">
                {gratitude.map((g) => (
                  <li key={g.id} className="group rounded-lg bg-brand-2/5 p-3">
                    <p className="text-sm">{g.message}</p>
                    <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>De <strong>{nameOf(g.authorUserId)}</strong> · {formatDayShort(g.date)}</span>
                      <button type="button" disabled={pending} onClick={() => run(() => deleteGratitude(g.id))} className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                        <Trash2 className="size-3.5" />
                      </button>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Date ideas */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-2" /> Ideias de date
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIdeaOpen(true)}>
              <Plus /> Ideia
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {dateIdeas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Junte ideias de programas a dois. 🥰</p>
            ) : (
              <ul className="space-y-1.5">
                {dateIdeas.map((idea) => (
                  <li key={idea.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => toggleDateIdea(idea.id, !idea.done))}
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-white transition-colors disabled:opacity-60",
                        idea.done ? "border-transparent bg-brand-2" : "border-input text-transparent hover:border-brand-2",
                      )}
                    >
                      <Heart className="size-3 fill-current" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", idea.done && "text-muted-foreground line-through")}>{idea.title}</p>
                      {(idea.category || idea.estimatedCostCents != null) && (
                        <p className="text-xs text-muted-foreground">
                          {[idea.category, idea.estimatedCostCents != null ? formatBRL(idea.estimatedCostCents) : null].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button type="button" disabled={pending} onClick={() => run(() => deleteDateIdea(idea.id))} className="text-muted-foreground/50 hover:text-destructive disabled:opacity-60">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-ins */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Check-ins do casal</CardTitle>
          <Button size="sm" onClick={() => setCheckinOpen(true)}>
            <Plus /> Check-in
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {checkins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Um ritual rápido pra se conectar: humor, gratidão, o que melhorar. 💞
            </p>
          ) : (
            <ul className="space-y-3">
              {checkins.map((c) => (
                <li key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {c.mood ? <span className="text-lg">{MOODS[c.mood]}</span> : null}
                      {nameOf(c.authorUserId)} · {formatDayShort(c.date)}
                    </p>
                    <button type="button" disabled={pending} onClick={() => run(() => deleteCheckin(c.id))} className="text-muted-foreground/50 hover:text-destructive disabled:opacity-60">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-1 text-sm">
                    {c.gratitude && <p><span className="text-muted-foreground">Grato(a):</span> {c.gratitude}</p>}
                    {c.highlight && <p><span className="text-muted-foreground">Destaque:</span> {c.highlight}</p>}
                    {c.improve && <p><span className="text-muted-foreground">Melhorar:</span> {c.improve}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CheckinForm open={checkinOpen} onClose={() => setCheckinOpen(false)} defaultDate={today} />
      <DateIdeaForm open={ideaOpen} onClose={() => setIdeaOpen(false)} />
      <ImportantDateForm open={dateOpen} onClose={() => setDateOpen(false)} />
    </div>
  );
}
