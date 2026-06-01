import { z } from "zod";

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  description: z.string().trim().max(1000).nullable(),
  pillar: z.enum(["tempo_dinheiro", "relacionamento", "carreira"]).nullable(),
  status: z.enum(["active", "done", "paused"]),
  ownerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  progress: z.number().int().min(0).max(100),
  linkedMetric: z
    .enum(["savings_total", "workouts_week", "study_week_min", "habit_streak"])
    .nullable(),
  targetValue: z.number().int().min(0).nullable(),
  linkedRef: z.string().nullable(),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const milestoneSchema = z.object({
  title: z.string().trim().min(1).max(160),
});
