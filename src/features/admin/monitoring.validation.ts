import { z } from "zod";

export const monitoringQuerySchema = z.object({
  userId: z.uuid("ID user tidak valid").optional(),
  dominantCode: z.string().trim().min(1).max(6).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type MonitoringQueryInput = z.infer<typeof monitoringQuerySchema>;
