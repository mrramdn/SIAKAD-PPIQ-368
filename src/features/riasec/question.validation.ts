import { RiasecCode } from "@prisma/client";
import { z } from "zod";

export const questionIdSchema = z.uuid("ID pertanyaan tidak valid");

export const createQuestionSchema = z.object({
  code: z.enum(RiasecCode),
  question: z.string().trim().min(5, "Pertanyaan minimal 5 karakter").max(500),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Minimal satu field harus diisi",
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
