import { UserRole } from "@prisma/client";

import { getAdminUserDetail } from "@/features/users/user.service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return errorResponse("Akses admin diperlukan", [], 403);
  }

  const { id } = await context.params;

  try {
    const user = await getAdminUserDetail(id);

    return successResponse("Detail user berhasil diambil", user);
  } catch {
    return errorResponse("User tidak ditemukan", [], 404);
  }
}
