"use server";

import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { fmtDuration } from "@/features/sono/lib";
import { getSleepLogs } from "@/features/sono/queries";
import { aiEnabled, gemini } from "@/lib/ai";
import { addDaysKey, todaySP } from "@/lib/dates";
import { requireHousehold } from "@/lib/household";
import { formatBRL } from "@/lib/money";
import { getDailyDigest, type DailyDigest } from "./digest";

/** Force a fresh AI daily summary on the next render. */
export async function regenerateSummary() {
  const ctx = await requireHousehold();
  updateTag(`summary-${ctx.householdId}`);
  revalidatePath("/");
}

// ── Weekly review ────────────────────────────────────────────────────────────

const SYSTEM_WEEKLY =
  "Você é o WeA, assistente do casal, em pt-BR do Brasil. Faça uma revisão semanal calorosa e específica (3 a 5 frases): 1-2 pontos positivos, 1 atenção e 1 foco pra próxima semana. Aponte correlações quando fizer sentido. Use só os dados fornecidos.";

export async function weeklyReview(): Promise<{ text: string; source: "ai" | "local" }> {
  const ctx = await requireHousehold();
  const today = todaySP();
  const digest = await getDailyDigest(ctx, today);

  const [ty, tm, td] = today.split("-").map(Number);
  const weekStart = addDaysKey(today, -new Date(ty, tm - 1, td).getDay());
  const sleep = await getSleepLogs(ctx.householdId);
  const wk = sleep.filter((s) => s.ownerUserId === ctx.userId && s.date >= weekStart && s.durationMin != null);
  const avgSleep = wk.length ? Math.round(wk.reduce((a, s) => a + (s.durationMin ?? 0), 0) / wk.length) : 0;
  const habitPct = digest.habits.length
    ? Math.round((digest.habits.reduce((a, h) => a + h.stats.doneCount7, 0) / (digest.habits.length * 7)) * 100)
    : 0;

  const f = `Semana: ${digest.workoutsWeek} treinos; ${digest.studyWeekMin} min de estudo (sequência ${digest.studyStreak}d); sono médio ${avgSleep ? fmtDuration(avgSleep) : "sem registro"}; hábitos cumpridos ${habitPct}% da semana; sobra do mês ${formatBRL(digest.finance.balance)}; metas ativas ${digest.goalsActive} (média ${digest.goalsAvg}%).`;
  const fallback = `Resumo da semana: ${digest.workoutsWeek} treino(s), ${Math.round(digest.studyWeekMin / 60)}h de estudo, sono médio ${avgSleep ? fmtDuration(avgSleep) : "—"}, hábitos ${habitPct}% e sobra ${formatBRL(digest.finance.balance)}. Foco pra próxima: manter a constância. 💪`;

  if (!aiEnabled()) return { text: fallback, source: "local" };
  const prompt = `Dados da semana do casal:\n${f}\n\nEscreva a revisão semanal.`;
  const text = await unstable_cache(
    async () => (await gemini(prompt, { system: SYSTEM_WEEKLY, maxTokens: 420 })) ?? fallback,
    ["weekly", ctx.householdId, weekStart],
    { revalidate: 86_400, tags: [`weekly-${ctx.householdId}`] },
  )();
  return { text, source: "ai" };
}

// ── Assistente "Pergunte ao WeA" ─────────────────────────────────────────────

function assistantContext(d: DailyDigest): string {
  const l: string[] = [];
  l.push(`FINANÇAS (${d.monthLabel}): entradas ${formatBRL(d.finance.income)}, saídas ${formatBRL(d.finance.expense)}, sobra ${formatBRL(d.finance.balance)}, a pagar ${formatBRL(d.finance.pending)}, projeção pós-contas ${formatBRL(d.finance.projection)}, guardado ${formatBRL(d.finance.savingsTotal)} de ${formatBRL(d.finance.savingsTarget)}.`);
  if (d.topExpenseCategories.length) l.push(`Gastos por categoria no mês: ${d.topExpenseCategories.map((c) => `${c.name} ${formatBRL(c.total)}`).join(", ")}.`);
  l.push(`HÁBITOS hoje ${d.habitsDone}/${d.habits.length}: ${d.habits.map((h) => `${h.name} (${h.stats.todayDone ? "feito" : "pendente"}, sequência ${h.stats.streak}d)`).join("; ") || "nenhum"}.`);
  if (d.sleepLast?.durationMin != null) l.push(`SONO última noite: ${fmtDuration(d.sleepLast.durationMin)}${d.sleepLast.quality ? ` (qualidade ${d.sleepLast.quality}/5)` : ""}.`);
  l.push(`TREINO: ${d.workoutsWeek} na semana. ESTUDO: ${d.studyWeekMin} min na semana, sequência ${d.studyStreak}d.`);
  if (d.goalsActive) l.push(`METAS ativas (${d.goalsActive}): ${d.topGoals.map((g) => `${g.title} ${g.progress}%`).join(", ")}.`);
  if (d.nextDate) l.push(`Próxima data do casal: ${d.nextDate.title} em ${d.nextDate.days} dia(s).`);
  if (d.nextEvent) l.push(`Próximo evento: ${d.nextEvent.title}${d.nextEvent.time ? ` às ${d.nextEvent.time}` : ""} (${d.nextEvent.dateKey}).`);
  return l.join("\n");
}

export async function askWea(question: string): Promise<string> {
  const ctx = await requireHousehold();
  const q = question.trim().slice(0, 500);
  if (!q) return "Manda a pergunta. 🙂";
  if (!aiEnabled()) {
    return "Pra eu responder com IA, pegue uma chave grátis em aistudio.google.com/apikey e coloque GEMINI_API_KEY no .env.local. Sem ela, dá pra ver tudo nos módulos. 🙂";
  }
  const today = todaySP();
  const digest = await getDailyDigest(ctx, today);
  const prompt = `Hoje é ${today}. Contexto com os dados reais do casal:\n${assistantContext(digest)}\n\nPergunta: ${q}\n\nResponda em pt-BR, curto e direto, baseado SÓ no contexto. Se o dado não estiver no contexto, diga gentilmente que ainda não está registrado.`;
  const ans = await gemini(prompt, {
    system: "Você é o WeA, assistente pessoal do casal Willian & Angélica. Responda em pt-BR, conciso, gentil e útil, usando apenas os dados fornecidos.",
    temperature: 0.3,
    maxTokens: 500,
  });
  return ans ?? "Não consegui responder agora — tenta de novo daqui a pouco.";
}
