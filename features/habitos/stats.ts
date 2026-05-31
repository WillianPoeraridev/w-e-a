import { addDaysKey } from "@/lib/dates";

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export type DayCell = {
  key: string;
  count: number;
  done: boolean;
  isToday: boolean;
  wd: string; // 3-letter weekday
};

export type HabitStats = {
  todayCount: number;
  todayDone: boolean;
  streak: number;
  bestStreak: number;
  last7: DayCell[];
  doneCount7: number;
};

/**
 * Per-habit stats from a date→count map. "Done" on a day means count >= target.
 * Streak = consecutive done days ending today (or yesterday, so it doesn't read
 * as broken just because today hasn't been checked yet). bestStreak = the longest
 * consecutive run ever recorded.
 */
export function computeHabitStats(
  countByDate: Map<string, number>,
  target: number,
  today: string,
): HabitStats {
  const t = Math.max(1, target);
  const get = (k: string) => countByDate.get(k) ?? 0;

  const last7: DayCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = addDaysKey(today, -i);
    const count = get(key);
    const [y, m, d] = key.split("-").map(Number);
    last7.push({
      key,
      count,
      done: count >= t,
      isToday: i === 0,
      wd: WD[new Date(y, m - 1, d).getDay()],
    });
  }

  let streak = 0;
  let cursor = get(today) >= t ? today : addDaysKey(today, -1);
  while (get(cursor) >= t) {
    streak++;
    cursor = addDaysKey(cursor, -1);
  }

  // Longest consecutive run of done days, ever.
  const doneDays = [...countByDate.entries()]
    .filter(([, c]) => c >= t)
    .map(([k]) => k)
    .sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of doneDays) {
    run = prev && addDaysKey(prev, 1) === k ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = k;
  }

  return {
    todayCount: get(today),
    todayDone: get(today) >= t,
    streak,
    bestStreak,
    last7,
    doneCount7: last7.filter((c) => c.done).length,
  };
}
