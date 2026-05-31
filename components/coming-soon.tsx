import { Sparkles } from "lucide-react";
import { NAV } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** Placeholder for modules whose schema exists but UI lands in a later phase. */
export function ComingSoon({ href }: { href: string }) {
  const item = NAV.find((n) => n.href === href);
  const Icon = item?.icon ?? Sparkles;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-primary">
          <Icon className="size-7" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{item?.label}</h2>
          {item?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        <Badge variant="secondary">
          <Sparkles className="size-3" /> Em breve
        </Badge>
        <p className="max-w-sm text-sm text-muted-foreground">
          O banco de dados deste módulo já está pronto. A tela chega nas próximas
          sessões — degrau por degrau. 🚀
        </p>
      </CardContent>
    </Card>
  );
}
