import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createFaculty, listFaculties } from "@/features/education/education.service";
import { createFacultySchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  return successResponse("Daftar fakultas berhasil diambil", await listFaculties());
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const input = createFacultySchema.parse(await request.json());
    return successResponse("Fakultas berhasil dibuat", await createFaculty(input), 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input fakultas tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Nama fakultas pada kampus tersebut sudah digunakan", [], 409);
    }
    return errorResponse("Fakultas gagal dibuat", [], 500);
  }
}
