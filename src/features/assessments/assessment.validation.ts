import { z } from "zod";

export const assessmentIdSchema = z.uuid("ID assessment tidak valid");

export const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.uuid("ID pertanyaan tidak valid"),
        score: z.number().int().min(1).max(5),
      }),
    )
    .min(1, "Jawaban assessment wajib diisi"),
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
