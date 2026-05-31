import { z } from "zod";

const uuidOrNull = z
  .string()
  .uuid()
  .nullable()
  .or(z.literal("").transform(() => null));

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  kind: z.enum(["income", "expense"]),
  amountCents: z.number().int().positive("Valor deve ser maior que zero"),
  categoryId: z.string().uuid().nullable(),
  payerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
  description: z.string().trim().max(200).nullable(),
  paid: z.boolean(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  kind: z.enum(["income", "expense"]),
  name: z.string().trim().min(1, "Nome obrigatório").max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  icon: z.string().max(40).nullable(),
});

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(60),
  targetCents: z.number().int().positive(),
  currentCents: z.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});

export const recurringBillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  amountCents: z.number().int().positive(),
  categoryId: z.string().uuid().nullable(),
  dueDay: z.number().int().min(1).max(31),
  payerUserId: z.string().nullable(),
  scope: z.enum(["personal", "shared"]),
  splitKind: z.enum(["none", "equal", "income"]),
});

export { uuidOrNull };
