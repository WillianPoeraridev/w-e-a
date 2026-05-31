import { z } from "zod";

export const trackSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  description: z.string().trim().max(1000).nullable(),
  provider: z.string().trim().max(80).nullable(),
  url: z.string().trim().max(500).nullable(),
  status: z.enum(["planned", "in_progress", "done"]),
  progress: z.number().int().min(0).max(100),
  totalHours: z.number().int().min(0).max(100000).nullable(),
  ownerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
});
export type TrackInput = z.infer<typeof trackSchema>;

export const sessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  minutes: z.number().int().min(1, "Minutos > 0").max(1440),
  topic: z.string().trim().max(160).nullable(),
  trackId: z.string().uuid().nullable(),
  ownerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
});
export type SessionInput = z.infer<typeof sessionSchema>;

export const feedSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  url: z.string().trim().min(1, "Link obrigatório").max(500),
  source: z.string().trim().max(80).nullable(),
  tags: z.string().trim().max(120).nullable(),
});
export type FeedInput = z.infer<typeof feedSchema>;
