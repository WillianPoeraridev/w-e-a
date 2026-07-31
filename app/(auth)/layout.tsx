import { Heart } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--brand)/0.16),transparent_27%),radial-gradient(circle_at_88%_84%,hsl(var(--brand-2)/0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/10 bg-card/35 shadow-[0_0_90px_hsl(var(--brand)/0.08)]" />

      <main className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center sm:mb-8">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <Heart className="size-3.5 fill-current" aria-hidden="true" />
            Willian &amp; Angélica
          </p>
          <h1 className="max-w-sm text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Nossa vida, nossos planos, nossa história.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Juntos, todos os dias.
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
