"use client";

import {
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Flame,
  Pencil,
  Play,
  Plus,
  Rss,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDaysKey, formatDayShort } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteFeed, deleteSession, toggleFeedRead } from "../actions";
import type { FeedLite, SessionLite, TrackLite } from "../queries";
import { FeedForm } from "./feed-form";
import { SessionForm } from "./session-form";
import { TrackForm, type EstudoMember } from "./track-form";

function fmtMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h}h${String(mm).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${mm}min`;
}

function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const STATUS = {
  planned: { label: "A fazer", variant: "secondary" as const },
  in_progress: { label: "Estudando", variant: "default" as const },
  done: { label: "Concluída", variant: "success" as const },
};

export function EstudosView({
  tracks,
  sessions,
  feed,
  members,
  currentUserId,
  today,
}: {
  tracks: TrackLite[];
  sessions: SessionLite[];
  feed: FeedLite[];
  members: EstudoMember[];
  currentUserId: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [trackForm, setTrackForm] = useState<{ open: boolean; initial: TrackLite | null }>({ open: false, initial: null });
  const [sessionForm, setSessionForm] = useState<{ open: boolean; track: string | null }>({ open: false, track: null });
  const [feedOpen, setFeedOpen] = useState(false);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.userId === id)?.displayName ?? "—" : "Casa";

  // Stats
  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());
  const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= today);
  const weekMin = weekSessions.reduce((a, s) => a + s.minutes, 0);
  const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);

  const studiedByTrack = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) if (s.trackId) map.set(s.trackId, (map.get(s.trackId) ?? 0) + s.minutes);
    return map;
  }, [sessions]);

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => s.date));
    let n = 0;
    let cursor = days.has(today) ? today : addDaysKey(today, -1);
    while (days.has(cursor)) {
      n++;
      cursor = addDaysKey(cursor, -1);
    }
    return n;
  }, [sessions, today]);

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Esta semana" value={fmtMin(weekMin)} icon={Clock} tone="brand" />
        <StatCard label="Sessões/semana" value={String(weekSessions.length)} icon={BookOpen} tone="success" />
        <StatCard label="Sequência" value={`${streak}`} hint="dias seguidos" icon={Flame} tone="warning" />
        <StatCard label="Total estudado" value={fmtMin(totalMin)} icon={Clock} />
      </div>

      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setTrackForm({ open: true, initial: null })}>
          <Plus /> Nova trilha
        </Button>
        <Button size="sm" onClick={() => setSessionForm({ open: true, track: null })}>
          <Play /> Registrar estudo
        </Button>
      </div>

      {/* Trilhas */}
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Trilhas</h2>
      {tracks.length === 0 ? (
        <Card className="mb-6 border-dashed">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BookOpen className="size-7 text-primary" />
            <p className="font-medium">Crie sua primeira trilha</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Um curso, um roadmap, um objetivo de estudo. Ex.: &quot;Lógica de
              programação&quot; pra Angélica do zero, ou &quot;System Design&quot; pro Willian.
            </p>
            <Button size="sm" onClick={() => setTrackForm({ open: true, initial: null })} className="mt-1">
              <Plus /> Nova trilha
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {tracks.map((t) => {
            const studied = studiedByTrack.get(t.id) ?? 0;
            const st = STATUS[t.status];
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{t.title}</h3>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {nameOf(t.ownerUserId)}
                      {t.provider ? ` · ${t.provider}` : ""}
                      {t.totalHours ? ` · ${t.totalHours}h` : ""}
                    </p>
                  </div>
                  {t.url && (
                    <a href={withProtocol(t.url)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" title="Abrir link">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => setTrackForm({ open: true, initial: t })}>
                    <Pencil className="size-3.5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{fmtMin(studied)} estudados</span>
                    <span className="font-semibold tabular-nums">{t.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${t.progress}%` }} />
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => setSessionForm({ open: true, track: t.id })}>
                  <Play className="size-3" /> Estudar agora
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sessões recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Sessões recentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {sessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sessão registrada ainda.</p>
            ) : (
              <ul className="divide-y">
                {sessions.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                      {fmtMin(s.minutes)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{s.topic || s.trackTitle || "Estudo"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDayShort(s.date)}
                        {s.trackTitle ? ` · ${s.trackTitle}` : ""} · {nameOf(s.ownerUserId)}
                      </p>
                    </div>
                    <button type="button" disabled={pending} onClick={() => run(() => deleteSession(s.id))} className="text-muted-foreground/60 hover:text-destructive disabled:opacity-60">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Radar */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rss className="size-4 text-primary" /> Radar de tech
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setFeedOpen(true)}>
              <Plus /> Salvar
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {feed.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Guarde aqui artigos, vídeos e novidades pra ler depois. 📰
              </p>
            ) : (
              <ul className="space-y-2">
                {feed.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => toggleFeedRead(f.id, !f.read))}
                      title={f.read ? "Lido" : "Marcar como lido"}
                      className={cn(
                        "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-60",
                        f.read ? "border-transparent bg-success text-white" : "border-input text-transparent hover:border-primary",
                      )}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <a href={withProtocol(f.url)} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1 text-sm font-medium hover:underline", f.read && "text-muted-foreground")}>
                        <span className="truncate">{f.title}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                      {(f.source || f.tags) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {[f.source, f.tags].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button type="button" disabled={pending} onClick={() => run(() => deleteFeed(f.id))} className="text-muted-foreground/60 hover:text-destructive disabled:opacity-60">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <TrackForm
        open={trackForm.open}
        onClose={() => setTrackForm({ open: false, initial: null })}
        members={members}
        currentUserId={currentUserId}
        initial={trackForm.initial}
      />
      <SessionForm
        open={sessionForm.open}
        onClose={() => setSessionForm({ open: false, track: null })}
        members={members}
        currentUserId={currentUserId}
        defaultDate={today}
        tracks={tracks.map((t) => ({ id: t.id, title: t.title }))}
        presetTrackId={sessionForm.track}
      />
      <FeedForm open={feedOpen} onClose={() => setFeedOpen(false)} />
    </div>
  );
}
