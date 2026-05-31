import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHousehold, getSession } from "@/lib/household";
import { createHouseholdAction } from "./actions";

export const metadata = { title: "Criar sua casa" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (await getHousehold()) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <BrandWordmark />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Vamos montar a casa de vocês</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createHouseholdAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="householdName">Nome da casa</Label>
                <Input id="householdName" name="householdName" defaultValue="Casa W&A" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="displayName">Seu nome de exibição</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={session.user.name}
                  required
                />
              </div>
              <fieldset className="flex flex-col gap-2">
                <Label>Sua cor</Label>
                <div className="flex gap-3">
                  {[
                    { c: "#6366f1", n: "Índigo" },
                    { c: "#ec4899", n: "Rosa" },
                    { c: "#10b981", n: "Verde" },
                    { c: "#f59e0b", n: "Âmbar" },
                  ].map((opt, i) => (
                    <label key={opt.c} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={opt.c}
                        defaultChecked={i === 0}
                        className="peer sr-only"
                      />
                      <span
                        className="block size-9 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-card transition peer-checked:ring-foreground"
                        style={{ backgroundColor: opt.c }}
                        title={opt.n}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button type="submit" className="mt-1">
                Criar e entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
