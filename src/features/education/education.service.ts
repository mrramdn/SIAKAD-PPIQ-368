import { prisma } from "@/lib/prisma";

import type {
  CreateCampusInput,
  CreateFacultyInput,
  CreateMajorCareerInput,
  CreateMajorInput,
  UpdateCampusInput,
  UpdateFacultyInput,
  UpdateMajorInput,
} from "./education.validation";

function emptyToNull(value: string | undefined) {
  return value ? value : null;
}

export function listCampuses() {
  return prisma.campus.findMany({
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { faculties: true } } },
  });
}

export function createCampus(input: CreateCampusInput) {
  return prisma.campus.create({
    data: {
      name: input.name,
      city: emptyToNull(input.city),
      province: emptyToNull(input.province),
      website: emptyToNull(input.website),
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCampus(id: string, input: UpdateCampusInput) {
  await prisma.campus.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.campus.update({
    where: { id },
    data: {
      name: input.name,
      city: input.city === undefined ? undefined : emptyToNull(input.city),
      province: input.province === undefined ? undefined : emptyToNull(input.province),
      website: input.website === undefined ? undefined : emptyToNull(input.website),
      isActive: input.isActive,
    },
  });
}

export async function softDeleteCampus(id: string) {
  await prisma.campus.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.campus.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
}

export function listFaculties() {
  return prisma.faculty.findMany({
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    include: {
      campus: { select: { id: true, name: true } },
      _count: { select: { majors: true } },
    },
  });
}

export function createFaculty(input: CreateFacultyInput) {
  return prisma.faculty.create({
    data: { campusId: input.campusId, name: input.name, isActive: input.isActive ?? true },
  });
}

export async function updateFaculty(id: string, input: UpdateFacultyInput) {
  await prisma.faculty.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.faculty.update({
    where: { id },
    data: { campusId: input.campusId, name: input.name, isActive: input.isActive },
  });
}

export async function softDeleteFaculty(id: string) {
  await prisma.faculty.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.faculty.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
}

export function listMajors() {
  return prisma.major.findMany({
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    include: {
      faculty: { select: { id: true, name: true, campus: { select: { id: true, name: true } } } },
      careers: { include: { career: { select: { id: true, name: true } } } },
    },
  });
}

export function createMajor(input: CreateMajorInput) {
  return prisma.major.create({
    data: {
      facultyId: input.facultyId,
      name: input.name,
      description: emptyToNull(input.description),
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateMajor(id: string, input: UpdateMajorInput) {
  await prisma.major.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.major.update({
    where: { id },
    data: {
      facultyId: input.facultyId,
      name: input.name,
      description: input.description === undefined ? undefined : emptyToNull(input.description),
      isActive: input.isActive,
    },
  });
}

export async function softDeleteMajor(id: string) {
  await prisma.major.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.major.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
}

export function createMajorCareer(input: CreateMajorCareerInput) {
  return prisma.majorCareer.create({ data: input, include: { major: true, career: true } });
}

export async function deleteMajorCareer(id: string) {
  await prisma.majorCareer.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.majorCareer.delete({ where: { id } });
}
