import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Título obrigatório").max(120),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    allDay: z.boolean(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    ownerUserId: z.string().nullable(),
    scope: z.enum(["personal", "shared"]),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    description: z.string().trim().max(500).nullable(),
    location: z.string().trim().max(120).nullable(),
  })
  .refine((v) => v.allDay || Boolean(v.startTime), {
    message: "Informe o horário de início",
    path: ["startTime"],
  });

export type EventInput = z.infer<typeof eventSchema>;
