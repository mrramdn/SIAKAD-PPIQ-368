import { RiasecCode, UserRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { MonitoringQueryInput } from "./monitoring.validation";

const riasecCodes: RiasecCode[] = ["R", "I", "A", "S", "E", "C"];

function buildAssessmentWhere(input: MonitoringQueryInput): Prisma.AssessmentResultWhereInput {
  return {
    userId: input.userId,
    dominantCode: input.dominantCode ? { contains: input.dominantCode.toUpperCase() } : undefined,
    createdAt:
      input.from || input.to
        ? {
            gte: input.from ? new Date(input.from) : undefined,
            lte: input.to ? new Date(input.to) : undefined,
          }
        : undefined,
  };
}

export async function getAdminDashboardSummary() {
  const [totalUsers, totalAdmins, totalAssessments, latestAssessments, activeQuestions, activeCareers] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.USER } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.assessmentResult.count(),
    prisma.assessmentResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        dominantCode: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.riasecQuestion.count({ where: { isActive: true } }),
    prisma.career.count({ where: { isActive: true, deletedAt: null } }),
  ]);

  const distributionEntries = await Promise.all(
    riasecCodes.map(async (code) => [
      code,
      await prisma.assessmentResult.count({ where: { dominantCode: { contains: code } } }),
    ] as const),
  );

  return {
    totals: {
      users: totalUsers,
      admins: totalAdmins,
      assessments: totalAssessments,
      activeQuestions,
      activeCareers,
    },
    riasecDistribution: Object.fromEntries(distributionEntries),
    latestAssessments,
  };
}

export async function listAssessmentMonitoring(input: MonitoringQueryInput) {
  const where = buildAssessmentWhere(input);
  const skip = (input.page - 1) * input.limit;

  const [total, assessments] = await Promise.all([
    prisma.assessmentResult.count({ where }),
    prisma.assessmentResult.findMany({
      where,
      skip,
      take: input.limit,
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
        summary: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    }),
  ]);

  return {
    meta: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
    data: assessments,
  };
}
