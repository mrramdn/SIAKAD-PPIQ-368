import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { registerUser } from "@/features/auth/auth.service";
import { registerSchema } from "@/features/auth/auth.validation";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const user = await registerUser(input);

    return successResponse("Registrasi berhasil", user, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Input registrasi tidak valid", error.issues, 422);
    }

    if (error instanceof Error && error.message === "Email sudah terdaftar") {
      return errorResponse(error.message, [], 409);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Email sudah terdaftar", [], 409);
    }

    return errorResponse("Registrasi gagal", [], 500);
  }
}
