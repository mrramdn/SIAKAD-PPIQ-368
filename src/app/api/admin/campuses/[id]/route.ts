import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { softDeleteCampus, updateCampus } from "@/features/education/education.service";
import { idSchema, updateCampusSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    const input = updateCampusSchema.parse(await request.json());
    return successResponse("Kampus berhasil diubah", await updateCampus(idSchema.parse(id), input));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input kampus tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse("Kampus tidak ditemukan", [], 404);
      if (error.code === "P2002") return errorResponse("Nama kampus sudah digunakan", [], 409);
    }
    return errorResponse("Kampus gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    return successResponse("Kampus berhasil dinonaktifkan", await softDeleteCampus(idSchema.parse(id)));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("ID kampus tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Kampus tidak ditemukan", [], 404);
    }
    return errorResponse("Kampus gagal dinonaktifkan", [], 500);
  }
}
