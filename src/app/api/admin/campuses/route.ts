import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createCampus, listCampuses } from "@/features/education/education.service";
import { createCampusSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  return successResponse("Daftar kampus berhasil diambil", await listCampuses());
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const input = createCampusSchema.parse(await request.json());
    return successResponse("Kampus berhasil dibuat", await createCampus(input), 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input kampus tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Nama kampus sudah digunakan", [], 409);
    }
    return errorResponse("Kampus gagal dibuat", [], 500);
  }
}
