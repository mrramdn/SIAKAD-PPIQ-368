import { ZodError } from "zod";

import { getUserProfile, updateUserProfile } from "@/features/users/profile.service";
import { updateProfileSchema } from "@/features/users/profile.validation";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  try {
    const profile = await getUserProfile(currentUser.id);

    return successResponse("Profil berhasil diambil", profile);
  } catch {
    return errorResponse("Profil tidak ditemukan", [], 404);
  }
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse("Anda harus login", [], 401);
  }

  try {
    const body = await request.json();
    const input = updateProfileSchema.parse(body);
    const profile = await updateUserProfile(currentUser.id, input);

    return successResponse("Profil berhasil disimpan", profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input profil tidak valid", error.issues, 422);
    }

    return errorResponse("Profil gagal disimpan", [], 500);
  }
}
