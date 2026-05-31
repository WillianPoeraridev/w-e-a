import type { Member } from "@/lib/household";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function MemberAvatar({
  member,
  size = "md",
  className,
}: {
  member: Member;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      title={member.displayName}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ring-card",
        size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        className,
      )}
      style={{ backgroundColor: member.color }}
    >
      {initials(member.displayName)}
    </span>
  );
}

export function MemberAvatars({ members }: { members: Member[] }) {
  return (
    <div className="flex -space-x-2">
      {members.map((m) => (
        <MemberAvatar key={m.userId} member={m} size="sm" />
      ))}
    </div>
  );
}
