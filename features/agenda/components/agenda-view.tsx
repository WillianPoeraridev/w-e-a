"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Flag, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDayShort, monthKeyOf, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteEvent } from "../actions";
import { WEEKDAYS, type GridDay } from "../calendar";
import type { Holiday } from "../holidays";
import type { EventLite } from "../queries";
import { EventForm, type EventMember } from "./event-form";

const SHARED_COLOR = "#6366f1";

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
  upcoming,
  members,
  holidays,
  today,
}: {
  monthKey: string;
  label: string;
  gridDays: GridDay[];
  events: EventLite[];
  upcoming: EventLite[];
  members: EventMember[];
  holidays: Holiday[];
  today: string;
}) {
  const router = useRouter();
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<EventLite | null>(null);
  const [formDate, setFormDate] = useState(today);

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

  const holidaysByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const h of holidays) {
      const list = map.get(h.key) ?? [];
      list.push(h.name);
      map.set(h.key, list);
    }
    return map;
  }, [holidays]);

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
  const goToday = () => {
    router.push(`/agenda?m=${monthKeyOf()}`);
    router.refresh();
  };
  const removeEvent = async (id: string) => {
    if (!confirm("Excluir este evento?")) return;
    await deleteEvent(id);
    router.refresh();
  };

  const dayEvents = dayKey ? byDay.get(dayKey) ?? [] : [];
  const dayHolidays = dayKey ? holidaysByDay.get(dayKey) ?? [] : [];

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
            <Button variant="ghost" size="sm" onClick={goToday}>
              Hoje
            </Button>
          </div>
          <Button size="sm" onClick={() => openNew(today)}>
            <Plus /> Novo evento
          </Button>
        </div>

        {/* Calendar */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-7 border-b bg-secondary/40 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 capitalize">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((d) => {
              const evs = byDay.get(d.key) ?? [];
              const hols = holidaysByDay.get(d.key) ?? [];
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
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      d.isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {d.day}
                  </span>

                  <div className="hidden flex-col gap-1 sm:flex">
                    {hols.map((name) => (
                      <span
                        key={name}
                        title={name}
                        className="flex items-center gap-1 truncate rounded bg-emerald-500/10 px-1 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        <Flag className="size-2.5 shrink-0" />
                        <span className="truncate">{name}</span>
                      </span>
                    ))}
                    {evs.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(ev);
                        }}
                        className="flex cursor-pointer items-center gap-1 truncate rounded bg-secondary/70 px-1 py-0.5 text-[11px] hover:bg-secondary"
                      >
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                        {ev.startTime && (
                          <span className="shrink-0 tabular-nums text-muted-foreground">{ev.startTime}</span>
                        )}
                        <span className="truncate">{ev.title}</span>
                      </span>
                    ))}
                    {evs.length > 3 && (
                      <span className="px-1 text-[11px] text-muted-foreground">+{evs.length - 3} mais</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {hols.length > 0 && <span className="size-1.5 rounded-full bg-emerald-500" />}
                    {evs.slice(0, 4).map((ev) => (
                      <span key={ev.id} className="size-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {members.map((m) => (
            <span key={m.userId} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              {m.displayName}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: SHARED_COLOR }} />
            Casa
          </span>
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
                <button
                  onClick={() => openEdit(ev)}
                  className="flex w-full items-start gap-2 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDayShort(ev.dateKey)}
                      {ev.allDay ? " · dia inteiro" : ` · ${ev.startTime}`} · {nameOf(ev.ownerUserId)}
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
        <div className="flex flex-col gap-3">
          {dayHolidays.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              <Flag className="size-4 shrink-0" /> Feriado · {name}
            </div>
          ))}
          {dayEvents.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Nenhum evento neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((ev) => (
                <li key={ev.id} className="flex items-center gap-2 rounded-lg border p-2.5">
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
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeEvent(ev.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            onClick={() => {
              const d = dayKey;
              setDayKey(null);
              if (d) openNew(d);
            }}
          >
            <Plus /> Adicionar evento
          </Button>
        </div>
      </Modal>

      {/* Create / edit */}
      <EventForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        members={members}
        defaultDate={formDate}
        initial={formInitial}
      />
    </div>
  );
}
