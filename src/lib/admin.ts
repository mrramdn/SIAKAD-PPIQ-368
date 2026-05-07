import { UserRole } from "@prisma/client";

import { errorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return {
      user: null,
      response: errorResponse("Akses admin diperlukan", [], 403),
    };
  }

  return {
    user: currentUser,
    response: null,
  };
}
