import { Briefcase, HeartHandshake, type LucideIcon, Target } from "lucide-react";

/** The owner's three absolute life focuses — goals hang off these pillars. */
export const PILLARS = [
  {
    key: "tempo_dinheiro",
    label: "Gestão & Disciplina",
    short: "Tempo, dinheiro, treino e estudos",
    icon: Target,
    color: "#6366f1",
  },
  {
    key: "relacionamento",
    label: "Relacionamento",
    short: "Leve, romântico e crescendo juntos",
    icon: HeartHandshake,
    color: "#ec4899",
  },
  {
    key: "carreira",
    label: "Carreira & Crescimento",
    short: "Evoluir educacional e profissionalmente",
    icon: Briefcase,
    color: "#10b981",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  short: string;
  icon: LucideIcon;
  color: string;
}>;

export type PillarKey = (typeof PILLARS)[number]["key"];

export const PILLAR_MAP = Object.fromEntries(
  PILLARS.map((p) => [p.key, p]),
) as Record<PillarKey, (typeof PILLARS)[number]>;
