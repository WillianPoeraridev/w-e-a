import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  Heart,
  Home,
  ListChecks,
  type LucideIcon,
  Moon,
  Target,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  available: boolean;
  /** Show in the mobile bottom bar. */
  primary?: boolean;
  description?: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Hoje", icon: Home, available: true, primary: true, description: "Seu dia em um olhar" },
  { href: "/financas", label: "Finanças", icon: Wallet, available: true, primary: true, description: "Orçamento do casal" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, available: true, primary: true, description: "Calendário compartilhado" },
  { href: "/metas", label: "Metas", icon: Target, available: false, description: "Os 3 pilares e objetivos" },
  { href: "/habitos", label: "Hábitos", icon: ListChecks, available: true, primary: true, description: "Rotina diária" },
  { href: "/treino", label: "Treino", icon: Dumbbell, available: false, description: "Registro e progresso" },
  { href: "/sono", label: "Sono", icon: Moon, available: false, description: "Qualidade e tendências" },
  { href: "/estudos", label: "Estudos", icon: BookOpen, available: false, description: "Trilhas e foco" },
  { href: "/relacionamento", label: "Nós", icon: Heart, available: false, description: "Check-ins e gratidão" },
];

export const PRIMARY_NAV = NAV.filter((n) => n.primary);

export function navLabel(pathname: string): string {
  const exact = NAV.find((n) => n.href === pathname);
  if (exact) return exact.label;
  const nested = NAV.find((n) => n.href !== "/" && pathname.startsWith(n.href));
  return nested?.label ?? "WeA";
}
