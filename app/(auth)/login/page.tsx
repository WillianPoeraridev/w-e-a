import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl shadow-brand/10 backdrop-blur-xl">
      <CardHeader className="gap-2 px-6 pb-6 pt-7 sm:px-8">
        <CardTitle className="text-2xl">Que bom ter você de volta</CardTitle>
        <CardDescription className="leading-relaxed">
          Entre para continuar cuidando do que construímos juntos.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </CardContent>
    </Card>
  );
}
