import { listActiveQuestions } from "@/features/riasec/question.service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  const questions = await listActiveQuestions();

  return successResponse("Pertanyaan aktif berhasil diambil", questions);
}
