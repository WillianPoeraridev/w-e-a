import {
  Activity,
  Dumbbell,
  HeartPulse,
  type LucideIcon,
  MoreHorizontal,
  Trophy,
} from "lucide-react";
import type { WorkoutKind } from "./lib";

export const WORKOUT_KINDS = [
  { key: "strength", label: "Força", icon: Dumbbell, color: "#6366f1" },
  { key: "cardio", label: "Cardio", icon: HeartPulse, color: "#ef4444" },
  { key: "mobility", label: "Mobilidade", icon: Activity, color: "#10b981" },
  { key: "sport", label: "Esporte", icon: Trophy, color: "#f59e0b" },
  { key: "other", label: "Outro", icon: MoreHorizontal, color: "#9ca3af" },
] as const satisfies ReadonlyArray<{
  key: WorkoutKind;
  label: string;
  icon: LucideIcon;
  color: string;
}>;

export const KIND_MAP = Object.fromEntries(
  WORKOUT_KINDS.map((k) => [k.key, k]),
) as Record<WorkoutKind, (typeof WORKOUT_KINDS)[number]>;
