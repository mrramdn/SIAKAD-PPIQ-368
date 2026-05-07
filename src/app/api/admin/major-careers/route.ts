import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createMajorCareer } from "@/features/education/education.service";
import { createMajorCareerSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const input = createMajorCareerSchema.parse(await request.json());
    return successResponse("Relasi jurusan dan karir berhasil dibuat", await createMajorCareer(input), 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input relasi tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return errorResponse("Relasi jurusan dan karir sudah ada", [], 409);
      if (error.code === "P2003") return errorResponse("Jurusan atau karir tidak ditemukan", [], 404);
    }
    return errorResponse("Relasi jurusan dan karir gagal dibuat", [], 500);
  }
}
