import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { softDeleteFaculty, updateFaculty } from "@/features/education/education.service";
import { idSchema, updateFacultySchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    const input = updateFacultySchema.parse(await request.json());
    return successResponse("Fakultas berhasil diubah", await updateFaculty(idSchema.parse(id), input));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input fakultas tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse("Fakultas tidak ditemukan", [], 404);
      if (error.code === "P2002") return errorResponse("Nama fakultas pada kampus tersebut sudah digunakan", [], 409);
    }
    return errorResponse("Fakultas gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    return successResponse("Fakultas berhasil dinonaktifkan", await softDeleteFaculty(idSchema.parse(id)));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("ID fakultas tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Fakultas tidak ditemukan", [], 404);
    }
    return errorResponse("Fakultas gagal dinonaktifkan", [], 500);
  }
}
