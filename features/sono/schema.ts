import { z } from "zod";

export const sleepSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  bedtime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de dormir inválida"),
  wake: z.string().regex(/^\d{2}:\d{2}$/, "Hora de acordar inválida"),
  quality: z.number().int().min(1).max(5).nullable(),
  notes: z.string().trim().max(500).nullable(),
  ownerUserId: z.string().min(1, "Escolha de quem é"),
});
export type SleepInput = z.infer<typeof sleepSchema>;
