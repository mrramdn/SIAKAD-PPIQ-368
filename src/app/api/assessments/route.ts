import { ZodError } from "zod";

import { submitAssessment } from "@/features/assessments/assessment.service";
import { submitAssessmentSchema } from "@/features/assessments/assessment.validation";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  try {
    const body = await request.json();
    const input = submitAssessmentSchema.parse(body);
    const result = await submitAssessment(currentUser.id, input);

    return successResponse("Hasil assessment berhasil dibuat", result, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input assessment tidak valid", error.issues, 422);
    }

    if (error instanceof Error) {
      return errorResponse(error.message, [], 400);
    }

    return errorResponse("Assessment gagal dibuat", [], 500);
  }
}
