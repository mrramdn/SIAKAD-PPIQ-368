import { listUserAssessments } from "@/features/assessments/assessment.service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  const assessments = await listUserAssessments(currentUser.id);

  return successResponse("Riwayat assessment berhasil diambil", assessments);
}
