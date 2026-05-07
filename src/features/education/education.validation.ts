import { z } from "zod";

const optionalText = z.string().trim().max(160).optional().or(z.literal(""));

export const idSchema = z.uuid("ID tidak valid");

export const createCampusSchema = z.object({
  name: z.string().trim().min(2).max(160),
  city: optionalText,
  province: optionalText,
  website: z.url("Website tidak valid").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateCampusSchema = createCampusSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Minimal satu field harus diisi",
});

export const createFacultySchema = z.object({
  campusId: z.uuid("ID kampus tidak valid"),
  name: z.string().trim().min(2).max(160),
  isActive: z.boolean().optional(),
});

export const updateFacultySchema = createFacultySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Minimal satu field harus diisi",
});

export const createMajorSchema = z.object({
  facultyId: z.uuid("ID fakultas tidak valid"),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateMajorSchema = createMajorSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Minimal satu field harus diisi",
});

export const createMajorCareerSchema = z.object({
  majorId: z.uuid("ID jurusan tidak valid"),
  careerId: z.uuid("ID karir tidak valid"),
});

export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type CreateMajorInput = z.infer<typeof createMajorSchema>;
export type UpdateMajorInput = z.infer<typeof updateMajorSchema>;
export type CreateMajorCareerInput = z.infer<typeof createMajorCareerSchema>;
