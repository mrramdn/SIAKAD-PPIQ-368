import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createMajor, listMajors } from "@/features/education/education.service";
import { createMajorSchema } from "@/features/education/education.validation";
import { requireAdmin } from "@/lib/admin";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  return successResponse("Daftar jurusan berhasil diambil", await listMajors());
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const input = createMajorSchema.parse(await request.json());
    return successResponse("Jurusan berhasil dibuat", await createMajor(input), 201);
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("Input jurusan tidak valid", error.issues, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Nama jurusan pada fakultas tersebut sudah digunakan", [], 409);
    }
    return errorResponse("Jurusan gagal dibuat", [], 500);
  }
}
