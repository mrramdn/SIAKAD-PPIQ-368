import { getAdminUserDetail } from "@/features/users/user.service";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await context.params;

  try {
    const user = await getAdminUserDetail(id);

    return successResponse("Detail user berhasil diambil", user);
  } catch {
    return errorResponse("User tidak ditemukan", [], 404);
  }
}
