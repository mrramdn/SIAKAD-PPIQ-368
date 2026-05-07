import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createQuestion, listAdminQuestions } from "@/features/riasec/question.service";
import { createQuestionSchema } from "@/features/riasec/question.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const questions = await listAdminQuestions();

  return successResponse("Daftar pertanyaan berhasil diambil", questions);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const input = createQuestionSchema.parse(body);
    const question = await createQuestion(input);

    return successResponse("Pertanyaan berhasil dibuat", question, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input pertanyaan tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Pertanyaan dengan kode tersebut sudah ada", [], 409);
    }

    return errorResponse("Pertanyaan gagal dibuat", [], 500);
  }
}
