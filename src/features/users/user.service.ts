import { prisma } from "@/lib/prisma";

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 5,
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
        },
      },
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  return user;
}
