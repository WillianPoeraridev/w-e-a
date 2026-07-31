export type ProgressionEntry = {
  date: string;
  exercise: string;
  ownerUserId: string | null;
  sets: number | null;
  reps: number | null;
  weightGrams: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  rir: number | null;
};

export type ProgressionAdvice = {
  tone: "increase" | "hold" | "recover" | "setup";
  title: string;
  detail: string;
  targetRepsMin: number;
  targetRepsMax: number;
  suggestedWeightGrams: number | null;
};

const DEFAULT_REP_RANGE = { min: 8, max: 12 };

function sameExercise(a: string, b: string) {
  return a.trim().localeCompare(b.trim(), "pt-BR", { sensitivity: "base" }) === 0;
}

function suggestedIncrease(weightGrams: number) {
  // Suggest 2.5% and round to 0.1 kg. The UI caps the practical recommendation at 5%.
  return Math.round((weightGrams * 1.025) / 100) * 100;
}

function suggestedReduction(weightGrams: number) {
  return Math.max(0, Math.round((weightGrams * 0.95) / 100) * 100);
}

/**
 * Double progression for hypertrophy-focused strength work.
 * A load rises only after two comparable sessions at the top of the rep range,
 * with 1–3 reps in reserve. This avoids turning every good day into a load jump.
 */
export function getProgressionAdvice(entries: ProgressionEntry[]): ProgressionAdvice {
  const history = entries
    .filter((entry) => entry.weightGrams !== null && entry.reps !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = history.at(-1);
  const range = {
    min: latest?.targetRepsMin ?? DEFAULT_REP_RANGE.min,
    max: latest?.targetRepsMax ?? DEFAULT_REP_RANGE.max,
  };

  if (!latest || latest.weightGrams === null || latest.reps === null) {
    return {
      tone: "setup",
      title: "Defina a referência",
      detail: `Registre carga, repetições e RIR. A faixa inicial sugerida é ${range.min}–${range.max} reps.`,
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: null,
    };
  }

  if (latest.rir === null) {
    return {
      tone: "setup",
      title: "Falta registrar o RIR",
      detail: "Mantenha a carga e registre quantas repetições ainda caberiam na última série. Sem isso, o app não sugere aumentar peso.",
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: latest.weightGrams,
    };
  }

  const previous = history.at(-2);
  const repeatedBreakdown =
    latest.reps < range.min &&
    previous?.reps !== null &&
    previous?.reps !== undefined &&
    previous.reps < range.min;

  if (repeatedBreakdown) {
    return {
      tone: "recover",
      title: "Reduza e reconstrua",
      detail: `Foram duas sessões abaixo de ${range.min} reps. Reduza cerca de 5%, preserve a técnica e volte pelo início da faixa.`,
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: suggestedReduction(latest.weightGrams),
    };
  }

  if (latest.rir === 0) {
    return {
      tone: "recover",
      title: "Segure a carga",
      detail: "A última série chegou à falha. Repita a carga e busque terminar com 1–3 RIR; não aumente o peso agora.",
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: latest.weightGrams,
    };
  }

  const qualifiesForIncrease = (entry: ProgressionEntry | undefined) =>
    entry?.reps !== null &&
    entry?.reps !== undefined &&
    entry.reps >= range.max &&
    entry.rir !== null &&
    entry.rir !== undefined &&
    entry.rir >= 1 &&
    entry.rir <= 3 &&
    entry.weightGrams === latest.weightGrams;

  if (qualifiesForIncrease(latest) && qualifiesForIncrease(previous)) {
    const nextWeight = suggestedIncrease(latest.weightGrams);
    const gainPct = ((nextWeight / latest.weightGrams - 1) * 100).toFixed(1).replace(".", ",");
    return {
      tone: "increase",
      title: "Pronto para progredir",
      detail: `Duas sessões no topo da faixa com 1–3 RIR. Use o menor incremento disponível (sugestão: +${gainPct}%) e recomece em ${range.min} reps. Não ultrapasse 5% de uma vez.`,
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: nextWeight,
    };
  }

  if (latest.reps < range.max) {
    return {
      tone: "hold",
      title: "Acumule repetições",
      detail: `Mantenha a carga e tente ${Math.min(range.max, latest.reps + 1)} reps por série na próxima sessão, terminando com 1–3 RIR.`,
      targetRepsMin: range.min,
      targetRepsMax: range.max,
      suggestedWeightGrams: latest.weightGrams,
    };
  }

  return {
    tone: "hold",
    title: "Confirme antes de subir",
    detail: "Você atingiu o topo da faixa. Repita a carga mais uma sessão com 1–3 RIR antes de aumentar o peso.",
    targetRepsMin: range.min,
    targetRepsMax: range.max,
    suggestedWeightGrams: latest.weightGrams,
  };
}

export function exerciseHistory(
  entries: ProgressionEntry[],
  exercise: string,
  ownerUserId: string | null,
) {
  return entries.filter(
    (entry) => entry.ownerUserId === ownerUserId && sameExercise(entry.exercise, exercise),
  );
}
