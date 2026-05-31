import { cn } from "@/lib/utils";

/** The W&A heart mark used across auth + nav. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-white shadow-sm",
        className,
      )}
    >
      W&A
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="text-lg font-semibold tracking-tight">WeA</span>
    </span>
  );
}
