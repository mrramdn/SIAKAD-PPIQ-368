import { prisma } from "@/lib/prisma";

import type { CreateCareerInput, UpdateCareerInput } from "./career.validation";

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value;
}

export function listActiveCareers() {
  return prisma.career.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}

export function listAdminCareers() {
  return prisma.career.findMany({
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          recommendations: true,
          majors: true,
        },
      },
    },
  });
}

export function createCareer(input: CreateCareerInput) {
  return prisma.career.create({
    data: {
      name: input.name,
      description: emptyToNull(input.description),
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCareer(id: string, input: UpdateCareerInput) {
  await prisma.career.findUniqueOrThrow({
    where: { id },
    select: { id: true },
  });

  return prisma.career.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description === undefined ? undefined : emptyToNull(input.description),
      isActive: input.isActive,
    },
  });
}

export async function softDeleteCareer(id: string) {
  await prisma.career.findUniqueOrThrow({
    where: { id },
    select: { id: true },
  });

  return prisma.career.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
}
