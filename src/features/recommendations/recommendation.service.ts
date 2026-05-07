import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { CreateRecommendationRuleInput, UpdateRecommendationRuleInput } from "./recommendation.validation";

function emptyToNull(value: string | undefined) {
  return value ? value : null;
}

function getRiasecCodes(dominantCode: string) {
  return [...new Set(dominantCode.split(""))];
}

function sortByDominantCode(codes: string[]) {
  const rank = new Map(codes.map((code, index) => [code, index]));

  return (left: { riasecCode: string; priority: number }, right: { riasecCode: string; priority: number }) => {
    const leftRank = rank.get(left.riasecCode) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.riasecCode) ?? Number.MAX_SAFE_INTEGER;

    return leftRank - rightRank || left.priority - right.priority;
  };
}

export async function getAssessmentRecommendations(assessmentId: string, currentUser: { id: string; role: UserRole }) {
  const assessment = await prisma.assessmentResult.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      userId: true,
      dominantCode: true,
      realisticScore: true,
      investigativeScore: true,
      artisticScore: true,
      socialScore: true,
      enterprisingScore: true,
      conventionalScore: true,
    },
  });

  if (!assessment) {
    throw new Error("Assessment tidak ditemukan");
  }

  if (currentUser.role !== UserRole.ADMIN && assessment.userId !== currentUser.id) {
    throw new Error("Assessment tidak dapat diakses");
  }

  const riasecCodes = getRiasecCodes(assessment.dominantCode);
  const rules = await prisma.recommendationRule.findMany({
    where: {
      riasecCode: { in: riasecCodes },
      isActive: true,
      deletedAt: null,
      career: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      career: {
        include: {
          majors: {
            include: {
              major: {
                include: {
                  faculty: {
                    include: {
                      campus: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const sortedRules = rules.toSorted(sortByDominantCode(riasecCodes));
  const careers = sortedRules.map((rule) => ({
    id: rule.career.id,
    name: rule.career.name,
    description: rule.career.description,
    riasecCode: rule.riasecCode,
    priority: rule.priority,
    note: rule.note,
  }));
  const majorMap = new Map<string, { id: string; name: string; description: string | null; career: string; faculty: string; campus: string }>();

  for (const rule of sortedRules) {
    for (const relation of rule.career.majors) {
      const { major } = relation;

      if (!major.isActive || major.deletedAt || !major.faculty.isActive || major.faculty.deletedAt) {
        continue;
      }

      if (!major.faculty.campus.isActive || major.faculty.campus.deletedAt) {
        continue;
      }

      majorMap.set(major.id, {
        id: major.id,
        name: major.name,
        description: major.description,
        career: rule.career.name,
        faculty: major.faculty.name,
        campus: major.faculty.campus.name,
      });
    }
  }

  if (careers.length > 0) {
    return {
      dominantCode: assessment.dominantCode,
      scores: {
        R: assessment.realisticScore,
        I: assessment.investigativeScore,
        A: assessment.artisticScore,
        S: assessment.socialScore,
        E: assessment.enterprisingScore,
        C: assessment.conventionalScore,
      },
      careers,
      majors: [...majorMap.values()],
      fallback: false,
    };
  }

  const fallbackCareers = await prisma.career.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    take: 5,
    select: { id: true, name: true, description: true },
  });

  return {
    dominantCode: assessment.dominantCode,
    scores: {
      R: assessment.realisticScore,
      I: assessment.investigativeScore,
      A: assessment.artisticScore,
      S: assessment.socialScore,
      E: assessment.enterprisingScore,
      C: assessment.conventionalScore,
    },
    careers: fallbackCareers.map((career) => ({ ...career, riasecCode: null, priority: 0, note: "Fallback umum" })),
    majors: [],
    fallback: true,
  };
}

export function listRecommendationRules() {
  return prisma.recommendationRule.findMany({
    orderBy: [{ deletedAt: "asc" }, { riasecCode: "asc" }, { priority: "asc" }],
    include: {
      career: { select: { id: true, name: true, description: true, isActive: true, deletedAt: true } },
    },
  });
}

export function createRecommendationRule(input: CreateRecommendationRuleInput) {
  return prisma.recommendationRule.create({
    data: {
      riasecCode: input.riasecCode,
      careerId: input.careerId,
      priority: input.priority ?? 0,
      note: emptyToNull(input.note),
      isActive: input.isActive ?? true,
    },
    include: { career: true },
  });
}

export async function updateRecommendationRule(id: string, input: UpdateRecommendationRuleInput) {
  await prisma.recommendationRule.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.recommendationRule.update({
    where: { id },
    data: {
      riasecCode: input.riasecCode,
      careerId: input.careerId,
      priority: input.priority,
      note: input.note === undefined ? undefined : emptyToNull(input.note),
      isActive: input.isActive,
    },
    include: { career: true },
  });
}

export async function softDeleteRecommendationRule(id: string) {
  await prisma.recommendationRule.findUniqueOrThrow({ where: { id }, select: { id: true } });

  return prisma.recommendationRule.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
    include: { career: true },
  });
}
