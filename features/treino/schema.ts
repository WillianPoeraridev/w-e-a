import { z } from "zod";

export const workoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  kind: z.enum(["strength", "cardio", "mobility", "sport", "other"]),
  durationMin: z.number().int().min(0).max(1000).nullable(),
  ownerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
  notes: z.string().trim().max(1000).nullable(),
});
export type WorkoutInput = z.infer<typeof workoutSchema>;

export const exerciseSchema = z.object({
  exercise: z.string().trim().min(1).max(80),
  sets: z.number().int().min(0).max(100).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  weightGrams: z.number().int().min(0).max(100_000_000).nullable(),
  targetRepsMin: z.number().int().min(1).max(100).nullable(),
  targetRepsMax: z.number().int().min(1).max(100).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
}).superRefine((exercise, ctx) => {
  if (
    exercise.targetRepsMin !== null &&
    exercise.targetRepsMax !== null &&
    exercise.targetRepsMin > exercise.targetRepsMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetRepsMax"],
      message: "O máximo da faixa deve ser maior ou igual ao mínimo.",
    });
  }
});
export const exercisesSchema = z.array(exerciseSchema).max(60);
export type ExerciseInput = z.infer<typeof exerciseSchema>;
