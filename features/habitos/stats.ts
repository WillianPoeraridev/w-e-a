import { addDaysKey } from "@/lib/dates";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];

export type DayCell = {
  key: string;
  count: number;
  done: boolean;
  isToday: boolean;
  wd: string; // single-letter weekday
};

export type HabitStats = {
  todayCount: number;
  todayDone: boolean;
  streak: number;
  last7: DayCell[];
  doneCount7: number;
};

/**
 * Per-habit stats from a date→count map. "Done" on a day means count >= target.
 * Streak = consecutive done days ending today (or yesterday, so it doesn't read
 * as broken just because today hasn't been checked yet).
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

  return {
    todayCount: get(today),
    todayDone: get(today) >= t,
    streak,
    last7,
    doneCount7: last7.filter((c) => c.done).length,
  };
}
