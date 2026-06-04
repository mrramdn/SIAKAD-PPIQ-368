import { cache } from "react";
import { CourseStatus, UserRole, UserStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const getLearnerDashboard = cache(async (userId: string) => {
  const [enrollments, availableCourses, attendanceRecords, gradeRecords] = await Promise.all([
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
    prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { attendanceSession: { heldAt: "desc" } },
      take: 8,
      select: {
        id: true,
        status: true,
        note: true,
        attendanceSession: {
          select: {
            title: true,
            heldAt: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
    prisma.gradeRecord.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        score: true,
        feedback: true,
        gradeItem: {
          select: {
            title: true,
            maxScore: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  return { enrollments, availableCourses, attendanceRecords, gradeRecords };
});

export const getAdminOverview = cache(async () => {
  const [totalUsers, pendingUsers, totalCourses, totalLessons, totalEnrollments, courses] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.PENDING } }),
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

  return { totalUsers, pendingUsers, totalCourses, totalLessons, totalEnrollments, courses };
});

export const getAdminUsers = cache(async () => {
  return prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      profile: {
        select: { studentNumber: true, className: true, phone: true },
      },
    },
  });
});

export const getStudents = cache(async () => {
  return prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      profile: {
        select: { studentNumber: true, className: true, phone: true, address: true },
      },
      _count: { select: { enrollments: true, attendanceRecords: true, gradeRecords: true } },
    },
  });
});

export const getAdminCourses = cache(async () => {
  return prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      createdAt: true,
      _count: { select: { lessons: true, enrollments: true, attendanceSessions: true, gradeItems: true } },
    },
  });
});

export const getCourseManagement = cache(async (courseId: string) => {
  const [course, verifiedStudents] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, description: true, order: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { user: { name: "asc" } },
          select: {
            id: true,
            progress: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { studentNumber: true, className: true } },
              },
            },
          },
        },
        attendanceSessions: {
          orderBy: { heldAt: "desc" },
          select: {
            id: true,
            title: true,
            heldAt: true,
            records: {
              orderBy: { user: { name: "asc" } },
              select: {
                id: true,
                status: true,
                note: true,
                user: { select: { id: true, name: true, profile: { select: { className: true, studentNumber: true } } } },
              },
            },
          },
        },
        gradeItems: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            maxScore: true,
            records: {
              orderBy: { user: { name: "asc" } },
              select: {
                id: true,
                score: true,
                feedback: true,
                user: { select: { id: true, name: true, profile: { select: { className: true, studentNumber: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.STUDENT, status: UserStatus.VERIFIED },
      orderBy: { name: "asc" },
      select: { id: true, name: true, profile: { select: { studentNumber: true, className: true } } },
    }),
  ]);

  return { course, verifiedStudents };
});
