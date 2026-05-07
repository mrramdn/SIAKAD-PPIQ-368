import { z } from "zod";

const optionalText = z.string().trim().max(120).optional().or(z.literal(""));

export const updateProfileSchema = z.object({
  gender: optionalText,
  institutionName: optionalText,
  grade: optionalText,
  initialInterest: z.string().trim().max(500).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
