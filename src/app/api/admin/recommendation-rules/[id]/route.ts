import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  softDeleteRecommendationRule,
  updateRecommendationRule,
} from "@/features/recommendations/recommendation.service";
import {
  recommendationRuleIdSchema,
  updateRecommendationRuleSchema,
} from "@/features/recommendations/recommendation.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const ruleId = recommendationRuleIdSchema.parse(id);
    const input = updateRecommendationRuleSchema.parse(await request.json());
    const rule = await updateRecommendationRule(ruleId, input);

    return successResponse("Aturan rekomendasi berhasil diubah", rule);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input aturan rekomendasi tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return errorResponse("Aturan rekomendasi tidak ditemukan", [], 404);
      }

      if (error.code === "P2002") {
        return errorResponse("Aturan rekomendasi untuk kode dan karir tersebut sudah ada", [], 409);
      }

      if (error.code === "P2003") {
        return errorResponse("Karir tidak ditemukan", [], 404);
      }
    }

    return errorResponse("Aturan rekomendasi gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const ruleId = recommendationRuleIdSchema.parse(id);
    const rule = await softDeleteRecommendationRule(ruleId);

    return successResponse("Aturan rekomendasi berhasil dinonaktifkan", rule);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("ID aturan rekomendasi tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Aturan rekomendasi tidak ditemukan", [], 404);
    }

    return errorResponse("Aturan rekomendasi gagal dinonaktifkan", [], 500);
  }
}
