import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const assessments = await prisma.assessmentResult.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      dominantCode: true,
      realisticScore: true,
      investigativeScore: true,
      artisticScore: true,
      socialScore: true,
      enterprisingScore: true,
      conventionalScore: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return successResponse("Data assessment berhasil diambil", assessments);
}
