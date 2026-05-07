import { ZodError } from "zod";

import { listAssessmentMonitoring } from "@/features/admin/monitoring.service";
import { monitoringQuerySchema } from "@/features/admin/monitoring.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const input = monitoringQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await listAssessmentMonitoring(input);

    return successResponse("Data monitoring assessment berhasil diambil", result);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Filter monitoring tidak valid", error.issues, 422);
    }

    return errorResponse("Data monitoring assessment gagal diambil", [], 500);
  }
}
