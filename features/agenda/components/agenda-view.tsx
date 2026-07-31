"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Flag,
  Heart,
  type LucideIcon,
  Moon,
  Pencil,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toggleTransactionPaid } from "@/features/financas/actions";
import {
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from "@/features/calendar/types";
import { addDaysKey, formatDayShort, shiftMonth } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteEvent } from "../actions";
import { WEEKDAYS, type GridDay } from "../calendar";
import type { EventLite } from "../queries";
import { EventForm, type EventMember } from "./event-form";

const SOURCE_ICON: Record<CalendarSource, LucideIcon> = {
  holiday: Flag,
  special: Heart,
  bill: Wallet,
  workout: Dumbbell,
  study: BookOpen,
  sleep: Moon,
  goal: Target,
};

function prettyDay(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const label = format(new Date(y, m - 1, d), "EEEE, d 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sortDayEvents(a: EventLite, b: EventLite) {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

export function AgendaView({
  monthKey,
  label,
  gridDays,
  events,
  items,
  upcoming,
  members,
  today,
}: {
  monthKey: string;
  label: string;
  gridDays: GridDay[];
  events: EventLite[];
  items: CalendarItem[];
  upcoming: EventLite[];
  members: EventMember[];
  today: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"month" | "week">("month");
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<EventLite | null>(null);
  const [formDate, setFormDate] = useState(today);
  const [busy, setBusy] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, EventLite[]>();
    for (const ev of events) {
      const list = map.get(ev.dateKey) ?? [];
      list.push(ev);
      map.set(ev.dateKey, list);
    }
    for (const list of map.values()) list.sort(sortDayEvents);
    return map;
  }, [events]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const list = map.get(it.dateKey) ?? [];
      list.push(it);
      map.set(it.dateKey, list);
    }
    return map;
  }, [items]);

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  const openNew = (date: string) => {
    setFormInitial(null);
    setFormDate(date);
    setFormOpen(true);
  };
  const openEdit = (ev: EventLite) => {
    setFormInitial(ev);
    setFormDate(ev.dateKey);
    setFormOpen(true);
  };
  const goMonth = (delta: number) => {
    router.push(`/agenda?m=${shiftMonth(monthKey, delta)}`);
    router.refresh();
  };
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    await fn();
    router.refresh();
    setBusy(false);
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysKey(today, i)), [today]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div>
        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => goMonth(-1)}>
              <ChevronLeft />
            </Button>
            <span className="min-w-40 text-center text-sm font-medium tabular-nums">{label}</span>
            <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => goMonth(1)}>
              <ChevronRight />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border bg-card p-1">
              {(["month", "week"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn("rounded-md px-3 py-1 text-sm font-medium transition-colors", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {v === "month" ? "Mês" : "Semana"}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => openNew(today)}>
              <Plus /> Evento
            </Button>
          </div>
        </div>

        {view === "month" ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-7 border-b bg-secondary/40 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2 capitalize">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {gridDays.map((d) => {
                const evs = byDay.get(d.key) ?? [];
                const its = itemsByDay.get(d.key) ?? [];
                const total = evs.length + its.length;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDayKey(d.key)}
                    className={cn(
                      "flex min-h-16 flex-col gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50 sm:min-h-28",
                      !d.inMonth && "bg-secondary/20 text-muted-foreground",
                      d.isWeekend && d.inMonth && "bg-secondary/10",
                    )}
                  >
                    <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-xs font-medium", d.isToday && "bg-primary text-primary-foreground")}>
                      {d.day}
                    </span>

                    <div className="hidden flex-col gap-1 sm:flex">
                      {its.slice(0, 2).map((it) => {
                        const Icon = SOURCE_ICON[it.source];
                        return (
                          <span key={it.id} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${it.color}1f`, color: it.color }}>
                            <Icon className="size-2.5 shrink-0" />
                            <span className="truncate">{it.title}</span>
                          </span>
                        );
                      })}
                      {evs.slice(0, Math.max(0, 3 - Math.min(its.length, 2))).map((ev) => (
                        <span
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                          className="flex cursor-pointer items-center gap-1 truncate rounded bg-secondary/70 px-1 py-0.5 text-[11px] hover:bg-secondary"
                        >
                          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                          {ev.startTime && <span className="shrink-0 tabular-nums text-muted-foreground">{ev.startTime}</span>}
                          <span className="truncate">{ev.title}</span>
                        </span>
                      ))}
                      {total > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{total - 3} mais</span>}
                    </div>

                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {its.slice(0, 3).map((it) => (
                        <span key={it.id} className="size-1.5 rounded-full" style={{ backgroundColor: it.color }} />
                      ))}
                      {evs.slice(0, 3).map((ev) => (
                        <span key={ev.id} className="size-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week / list view */
          <div className="space-y-2">
            {weekDays.map((key) => {
              const evs = byDay.get(key) ?? [];
              const its = itemsByDay.get(key) ?? [];
              return (
                <div key={key} className="rounded-xl border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className={cn("text-sm font-medium capitalize", key === today && "text-primary")}>{prettyDay(key)}</p>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openNew(key)}>
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  {evs.length + its.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nada neste dia.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {its.map((it) => <ItemRow key={it.id} item={it} busy={busy} onPay={(txId) => act(() => toggleTransactionPaid(txId, true))} />)}
                      {evs.map((ev) => (
                        <li key={ev.id} className="flex items-center gap-2 text-sm">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: ev.color }} />
                          <button onClick={() => openEdit(ev)} className="flex-1 text-left hover:underline">
                            {ev.startTime ? `${ev.startTime} · ` : ""}{ev.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {members.map((m) => (
            <span key={m.userId} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} /> {m.displayName}
            </span>
          ))}
          {(Object.keys(SOURCE_META) as CalendarSource[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: SOURCE_META[s].color }} /> {SOURCE_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Próximos eventos</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada agendado por enquanto.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((ev) => (
              <li key={ev.id}>
                <button onClick={() => openEdit(ev)} className="flex w-full items-start gap-2 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-accent/50">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDayShort(ev.dateKey)}{ev.allDay ? " · dia inteiro" : ` · ${ev.startTime}`} · {nameOf(ev.ownerUserId)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Day detail */}
      <Modal open={Boolean(dayKey)} onClose={() => setDayKey(null)} title={dayKey ? prettyDay(dayKey) : ""}>
        <div className="flex flex-col gap-2">
          {dayKey && (itemsByDay.get(dayKey) ?? []).map((it) => (
            <ItemRow key={it.id} item={it} busy={busy} onPay={(txId) => act(() => toggleTransactionPaid(txId, true))} boxed />
          ))}
          {dayKey && (byDay.get(dayKey) ?? []).map((ev) => (
            <div key={ev.id} className="flex items-center gap-2 rounded-lg border p-2.5">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ev.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ev.allDay ? "Dia inteiro" : `${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ""}`}
                  {ev.location ? ` · ${ev.location}` : ""} · {nameOf(ev.ownerUserId)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => { setDayKey(null); openEdit(ev); }}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => act(() => deleteEvent(ev.id))}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {dayKey && (byDay.get(dayKey) ?? []).length === 0 && (itemsByDay.get(dayKey) ?? []).length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nenhum evento neste dia.</p>
          )}
          <Button onClick={() => { const d = dayKey; setDayKey(null); if (d) openNew(d); }}>
            <Plus /> Adicionar evento
          </Button>
        </div>
      </Modal>

      <EventForm open={formOpen} onClose={() => setFormOpen(false)} members={members} defaultDate={formDate} initial={formInitial} />
    </div>
  );
}

function ItemRow({
  item,
  busy,
  onPay,
  boxed,
}: {
  item: CalendarItem;
  busy: boolean;
  onPay: (txId: string) => void;
  boxed?: boolean;
}) {
  const Icon = SOURCE_ICON[item.source];
  const inner = (
    <>
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${item.color}22`, color: item.color }}>
        <Icon className="size-3" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {item.amountCents != null && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatBRL(item.amountCents)}</span>}
      {item.source === "bill" && item.txId && item.paid === false && (
        <button type="button" disabled={busy} onClick={(e) => { e.preventDefault(); onPay(item.txId as string); }} className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning disabled:opacity-60">
          marcar paga
        </button>
      )}
      {item.source === "bill" && item.paid && <CheckCircle2 className="size-3.5 shrink-0 text-success" />}
      {item.href && <ExternalLink className="size-3 shrink-0 text-muted-foreground/60" />}
    </>
  );
  const cls = cn("flex items-center gap-2 text-sm", boxed && "rounded-lg border p-2.5");
  return item.href ? (
    <Link href={item.href} className={cn(cls, "hover:bg-accent/40")}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
