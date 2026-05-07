import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  createRecommendationRule,
  listRecommendationRules,
} from "@/features/recommendations/recommendation.service";
import { createRecommendationRuleSchema } from "@/features/recommendations/recommendation.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const rules = await listRecommendationRules();

  return successResponse("Daftar aturan rekomendasi berhasil diambil", rules);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const input = createRecommendationRuleSchema.parse(await request.json());
    const rule = await createRecommendationRule(input);

    return successResponse("Aturan rekomendasi berhasil dibuat", rule, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input aturan rekomendasi tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return errorResponse("Aturan rekomendasi untuk kode dan karir tersebut sudah ada", [], 409);
      }

      if (error.code === "P2003") {
        return errorResponse("Karir tidak ditemukan", [], 404);
      }
    }

    return errorResponse("Aturan rekomendasi gagal dibuat", [], 500);
  }
}
