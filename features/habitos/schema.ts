import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  target: z.number().int().min(1).max(50),
  ownerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
});

export type HabitInput = z.infer<typeof habitSchema>;
