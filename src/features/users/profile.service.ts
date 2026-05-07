import { prisma } from "@/lib/prisma";

import type { UpdateProfileInput } from "./profile.validation";

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value;
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  return user;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true },
  });

  return prisma.userProfile.upsert({
    where: { userId },
    update: {
      gender: emptyToNull(input.gender),
      institutionName: emptyToNull(input.institutionName),
      grade: emptyToNull(input.grade),
      initialInterest: emptyToNull(input.initialInterest),
    },
    create: {
      userId,
      gender: emptyToNull(input.gender),
      institutionName: emptyToNull(input.institutionName),
      grade: emptyToNull(input.grade),
      initialInterest: emptyToNull(input.initialInterest),
    },
  });
}
