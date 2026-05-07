import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createCareer, listAdminCareers } from "@/features/careers/career.service";
import { createCareerSchema } from "@/features/careers/career.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const careers = await listAdminCareers();

  return successResponse("Daftar karir berhasil diambil", careers);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const input = createCareerSchema.parse(body);
    const career = await createCareer(input);

    return successResponse("Karir berhasil dibuat", career, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input karir tidak valid", error.issues, 422);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Nama karir sudah digunakan", [], 409);
    }

    return errorResponse("Karir gagal dibuat", [], 500);
  }
}
