import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { deactivateQuestion, updateQuestion } from "@/features/riasec/question.service";
import { questionIdSchema, updateQuestionSchema } from "@/features/riasec/question.validation";
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
    const questionId = questionIdSchema.parse(id);
    const body = await request.json();
    const input = updateQuestionSchema.parse(body);
    const question = await updateQuestion(questionId, input);

    return successResponse("Pertanyaan berhasil diubah", question);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input pertanyaan tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return errorResponse("Pertanyaan tidak ditemukan", [], 404);
      }

      if (error.code === "P2002") {
        return errorResponse("Pertanyaan dengan kode tersebut sudah ada", [], 409);
      }
    }

    return errorResponse("Pertanyaan gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const questionId = questionIdSchema.parse(id);
    const question = await deactivateQuestion(questionId);

    return successResponse("Pertanyaan berhasil dinonaktifkan", question);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("ID pertanyaan tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Pertanyaan tidak ditemukan", [], 404);
    }

    return errorResponse("Pertanyaan gagal dinonaktifkan", [], 500);
  }
}
