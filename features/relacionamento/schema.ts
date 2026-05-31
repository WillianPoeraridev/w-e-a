import { z } from "zod";

export const checkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mood: z.number().int().min(1).max(5).nullable(),
  gratitude: z.string().trim().max(500).nullable(),
  highlight: z.string().trim().max(500).nullable(),
  improve: z.string().trim().max(500).nullable(),
});

export const gratitudeSchema = z.object({
  message: z.string().trim().min(1, "Escreva algo").max(500),
});

export const dateIdeaSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  description: z.string().trim().max(500).nullable(),
  category: z.string().trim().max(40).nullable(),
  estimatedCostCents: z.number().int().min(0).nullable(),
});

export const importantDateSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  recurring: z.boolean(),
  kind: z.enum(["anniversary", "birthday", "other"]),
  notes: z.string().trim().max(500).nullable(),
});
