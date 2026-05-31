import { cn } from "@/lib/utils";

/** Simple determinate progress bar. `value` is 0–100. */
export function Progress({
  value,
  className,
  indicatorColor,
}: {
  value: number;
  className?: string;
  indicatorColor?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%`, backgroundColor: indicatorColor }}
      />
    </div>
  );
}
