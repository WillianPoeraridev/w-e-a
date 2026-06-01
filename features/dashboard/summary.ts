import { unstable_cache } from "next/cache";
import { fmtDuration } from "@/features/sono/lib";
import { aiEnabled, gemini } from "@/lib/ai";
import { todaySP } from "@/lib/dates";
import type { HouseholdContext } from "@/lib/household";
import { formatBRL } from "@/lib/money";
import type { DailyDigest } from "./digest";

function facts(d: DailyDigest): string {
  const f: string[] = [];
  f.push(`Sobra do mês: ${formatBRL(d.finance.balance)}; a pagar: ${formatBRL(d.finance.pending)}; projeção após pagar tudo: ${formatBRL(d.finance.projection)}.`);
  f.push(`Hábitos hoje: ${d.habitsDone}/${d.habits.length}.`);
  if (d.sleepLast?.durationMin != null) f.push(`Última noite: ${fmtDuration(d.sleepLast.durationMin)}${d.sleepLast.quality ? ` (qualidade ${d.sleepLast.quality}/5)` : ""}.`);
  f.push(`Treinos na semana: ${d.workoutsWeek}. Estudo na semana: ${d.studyWeekMin} min (sequência ${d.studyStreak}d).`);
  if (d.goalsActive) f.push(`Metas ativas: ${d.goalsActive} (média ${d.goalsAvg}%).`);
  if (d.nextDate) f.push(`Próxima data do casal: ${d.nextDate.title} em ${d.nextDate.days} dia(s).`);
  if (d.nextEvent) f.push(`Próximo evento: ${d.nextEvent.title}${d.nextEvent.time ? ` às ${d.nextEvent.time}` : ""}.`);
  return f.join("\n");
}

/** Deterministic briefing — always available, used as fallback. */
export function localSummary(d: DailyDigest, name: string): string {
  const p: string[] = [`${name}, seu dia em um olhar:`];
  if (d.finance.pending > 0) p.push(`💸 ${formatBRL(d.finance.pending)} em contas a pagar este mês.`);
  p.push(d.finance.balance >= 0 ? `Sobra positiva (${formatBRL(d.finance.balance)}).` : `⚠️ Mês no vermelho (${formatBRL(d.finance.balance)}).`);
  if (d.habits.length) p.push(d.habitsDone === d.habits.length ? `✅ Todos os ${d.habits.length} hábitos de hoje feitos!` : `${d.habitsDone}/${d.habits.length} hábitos feitos hoje.`);
  if (d.sleepLast?.durationMin != null) p.push(d.sleepLast.durationMin >= 420 ? `😴 Dormiu ${fmtDuration(d.sleepLast.durationMin)}.` : `😴 Dormiu só ${fmtDuration(d.sleepLast.durationMin)} — descanse mais.`);
  if (d.studyStreak >= 2) p.push(`📚 ${d.studyStreak} dias seguidos estudando.`);
  if (d.nextDate) p.push(d.nextDate.days === 0 ? `💕 Hoje é ${d.nextDate.title}!` : `💕 Faltam ${d.nextDate.days}d pra ${d.nextDate.title}.`);
  return p.join(" ");
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const SYSTEM =
  "Você é o WeA, assistente caloroso e direto que escreve em pt-BR do Brasil. Escreva um briefing curto (2 a 4 frases), motivador e específico, com no máximo 2 emojis. Use SÓ os dados fornecidos — nunca invente números.";

/** AI (Gemini) summary, cached once per day; falls back to localSummary. */
export async function getDailySummary(
  ctx: HouseholdContext,
  digest: DailyDigest,
  name: string,
): Promise<{ text: string; source: "ai" | "local" }> {
  const fallback = localSummary(digest, name);
  if (!aiEnabled()) return { text: fallback, source: "local" };

  const f = facts(digest);
  const prompt = `Pessoa: ${name}.\nDados de hoje:\n${f}\n\nEscreva o briefing do dia pra essa pessoa.`;
  const text = await unstable_cache(
    async () => (await gemini(prompt, { system: SYSTEM, maxTokens: 300 })) ?? fallback,
    ["daily-summary", ctx.householdId, todaySP(), hash(f + name)],
    { revalidate: 21_600, tags: [`summary-${ctx.householdId}`] },
  )();
  return { text, source: "ai" };
}
