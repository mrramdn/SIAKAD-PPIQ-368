import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { deleteMajorCareer } from "@/features/education/education.service";
import { idSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    return successResponse("Relasi jurusan dan karir berhasil dihapus", await deleteMajorCareer(idSchema.parse(id)));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("ID relasi tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Relasi jurusan dan karir tidak ditemukan", [], 404);
    }
    return errorResponse("Relasi jurusan dan karir gagal dihapus", [], 500);
  }
}
