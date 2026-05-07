import { prisma } from "@/lib/prisma";

import type { CreateQuestionInput, UpdateQuestionInput } from "./question.validation";

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value;
}

export function listActiveQuestions() {
  return prisma.riasecQuestion.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      code: true,
      question: true,
      description: true,
      order: true,
    },
  });
}

export function listAdminQuestions() {
  return prisma.riasecQuestion.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      code: true,
      question: true,
      description: true,
      isActive: true,
      order: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export function createQuestion(input: CreateQuestionInput) {
  return prisma.riasecQuestion.create({
    data: {
      code: input.code,
      question: input.question,
      description: emptyToNull(input.description),
      isActive: input.isActive ?? true,
      order: input.order ?? 0,
    },
  });
}

export async function updateQuestion(id: string, input: UpdateQuestionInput) {
  await prisma.riasecQuestion.findUniqueOrThrow({
    where: { id },
    select: { id: true },
  });

  return prisma.riasecQuestion.update({
    where: { id },
    data: {
      code: input.code,
      question: input.question,
      description: input.description === undefined ? undefined : emptyToNull(input.description),
      isActive: input.isActive,
      order: input.order,
    },
  });
}

export async function deactivateQuestion(id: string) {
  await prisma.riasecQuestion.findUniqueOrThrow({
    where: { id },
    select: { id: true },
  });

  return prisma.riasecQuestion.update({
    where: { id },
    data: { isActive: false },
  });
}
