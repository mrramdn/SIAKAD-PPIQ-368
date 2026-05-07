import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { softDeleteMajor, updateMajor } from "@/features/education/education.service";
import { idSchema, updateMajorSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    const input = updateMajorSchema.parse(await request.json());
    return successResponse("Jurusan berhasil diubah", await updateMajor(idSchema.parse(id), input));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input jurusan tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse("Jurusan tidak ditemukan", [], 404);
      if (error.code === "P2002") return errorResponse("Nama jurusan pada fakultas tersebut sudah digunakan", [], 409);
    }
    return errorResponse("Jurusan gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;
    return successResponse("Jurusan berhasil dinonaktifkan", await softDeleteMajor(idSchema.parse(id)));
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("ID jurusan tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Jurusan tidak ditemukan", [], 404);
    }
    return errorResponse("Jurusan gagal dinonaktifkan", [], 500);
  }
}
