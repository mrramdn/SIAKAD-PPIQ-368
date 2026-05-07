import { RiasecCode } from "@prisma/client";
import { z } from "zod";

export const recommendationRuleIdSchema = z.uuid("ID aturan rekomendasi tidak valid");

export const recommendationAssessmentIdSchema = z.uuid("ID assessment tidak valid");

export const createRecommendationRuleSchema = z.object({
  riasecCode: z.enum(RiasecCode),
  careerId: z.uuid("ID karir tidak valid"),
  priority: z.number().int().min(0).optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateRecommendationRuleSchema = createRecommendationRuleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export type CreateRecommendationRuleInput = z.infer<typeof createRecommendationRuleSchema>;
export type UpdateRecommendationRuleInput = z.infer<typeof updateRecommendationRuleSchema>;
