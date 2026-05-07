import { ZodError } from "zod";

import { getAssessmentRecommendations } from "@/features/recommendations/recommendation.service";
import { recommendationAssessmentIdSchema } from "@/features/recommendations/recommendation.validation";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  try {
    const { assessmentId } = await context.params;
    const validAssessmentId = recommendationAssessmentIdSchema.parse(assessmentId);
    const recommendations = await getAssessmentRecommendations(validAssessmentId, currentUser);

    return successResponse("Rekomendasi berhasil diambil", recommendations);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("ID assessment tidak valid", error.issues, 422);
    }

    if (error instanceof Error && error.message === "Assessment tidak dapat diakses") {
      return errorResponse(error.message, [], 403);
    }

    return errorResponse("Assessment tidak ditemukan", [], 404);
  }
}
