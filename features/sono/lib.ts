/** Minutes slept from bedtime→wake "HH:mm" (handles crossing midnight). */
export function durationFromTimes(bedtime: string, wake: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let d = wh * 60 + wm - (bh * 60 + bm);
  if (d <= 0) d += 1440;
  return d;
}

/** 450 -> "7h30". */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}min`;
}

export const QUALITY_LABELS = ["", "Péssima", "Ruim", "Ok", "Boa", "Ótima"];
