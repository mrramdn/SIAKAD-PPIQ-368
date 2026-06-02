import { cache } from "react";
import { CourseStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const getLearnerDashboard = cache(async (userId: string) => {
  const [enrollments, availableCourses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        progress: true,
        status: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        enrollments: { none: { userId } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        _count: { select: { lessons: true, enrollments: true } },
      },
    }),
  ]);

  return { enrollments, availableCourses };
});

export const getAdminOverview = cache(async () => {
  const [totalUsers, totalCourses, totalLessons, totalEnrollments, courses] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.lesson.count({ where: { deletedAt: null } }),
    prisma.enrollment.count(),
    prisma.course.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    }),
  ]);

  return { totalUsers, totalCourses, totalLessons, totalEnrollments, courses };
});
