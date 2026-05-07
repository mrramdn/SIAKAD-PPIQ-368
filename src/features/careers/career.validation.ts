import { z } from "zod";

export const careerIdSchema = z.uuid("ID karir tidak valid");

export const createCareerSchema = z.object({
  name: z.string().trim().min(2, "Nama karir minimal 2 karakter").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateCareerSchema = createCareerSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Minimal satu field harus diisi",
});

export type CreateCareerInput = z.infer<typeof createCareerSchema>;
export type UpdateCareerInput = z.infer<typeof updateCareerSchema>;
