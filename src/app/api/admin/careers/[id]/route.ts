import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { softDeleteCareer, updateCareer } from "@/features/careers/career.service";
import { careerIdSchema, updateCareerSchema } from "@/features/careers/career.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const careerId = careerIdSchema.parse(id);
    const body = await request.json();
    const input = updateCareerSchema.parse(body);
    const career = await updateCareer(careerId, input);

    return successResponse("Karir berhasil diubah", career);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input karir tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return errorResponse("Karir tidak ditemukan", [], 404);
      }

      if (error.code === "P2002") {
        return errorResponse("Nama karir sudah digunakan", [], 409);
      }
    }

    return errorResponse("Karir gagal diubah", [], 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const careerId = careerIdSchema.parse(id);
    const career = await softDeleteCareer(careerId);

    return successResponse("Karir berhasil dinonaktifkan", career);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("ID karir tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("Karir tidak ditemukan", [], 404);
    }

    return errorResponse("Karir gagal dinonaktifkan", [], 500);
  }
}
