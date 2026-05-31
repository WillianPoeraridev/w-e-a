import { BrandMark, BrandWordmark } from "@/components/brand";
import { BottomNav, Sidebar } from "@/components/app-shell/nav";
import { MemberAvatars } from "@/components/app-shell/member-avatars";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { requireHousehold } from "@/lib/household";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireHousehold();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandWordmark />
        </div>
        <Sidebar />
        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <MemberAvatars members={ctx.members} />
            <span className="text-xs text-muted-foreground">{ctx.me.displayName}</span>
          </div>
          <SignOutButton className="w-full justify-start" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
          <BrandMark />
          <MemberAvatars members={ctx.members} />
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
