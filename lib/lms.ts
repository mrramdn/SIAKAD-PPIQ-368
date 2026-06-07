import { cache } from "react";
import {
  AttendanceStatus,
  CourseStatus,
  EnrollmentStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
// Bars shown on the dashboard activity chart (Mon–Sat).
const WEEK_BARS = [1, 2, 3, 4, 5, 6] as const;

export function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.round(hr / 24);
  if (day === 1) return "kemarin";
  if (day < 7) return `${day} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date);
}

function isStudent(user: Pick<AuthUser, "role">) {
  return user.role === UserRole.STUDENT;
}

/* -------------------------------------------------------------------------- */
/*                                  dashboard                                 */
/* -------------------------------------------------------------------------- */

export const getDashboardData = cache(async (user: AuthUser) => {
  const todayDow = new Date().getDay();

  const [schedule, deadlines, attendanceForWeek, recentGradeItems, recentLessons, recentSessions, recentVerified] =
    await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { dayOfWeek: todayDow, course: { deletedAt: null } },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          room: true,
          course: { select: { id: true, title: true, createdBy: { select: { name: true } } } },
        },
      }),
      prisma.gradeItem.findMany({
        where: {
          dueAt: { gte: new Date() },
          ...(isStudent(user) ? { course: { enrollments: { some: { userId: user.id } } } } : {}),
        },
        orderBy: { dueAt: "asc" },
        take: 4,
        select: { id: true, title: true, dueAt: true, course: { select: { title: true } } },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          ...(isStudent(user) ? { userId: user.id } : {}),
          attendanceSession: { heldAt: { gte: new Date(Date.now() - 28 * 864e5) } },
        },
        select: { status: true, attendanceSession: { select: { heldAt: true } } },
      }),
      prisma.gradeItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, createdAt: true, course: { select: { title: true, createdBy: { select: { name: true } } } } },
      }),
      prisma.lesson.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, createdAt: true, course: { select: { title: true, createdBy: { select: { name: true } } } } },
      }),
      prisma.attendanceSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, createdAt: true, course: { select: { title: true } } },
      }),
      prisma.user.findMany({
        where: { status: UserStatus.VERIFIED, verifiedAt: { not: null } },
        orderBy: { verifiedAt: "desc" },
        take: 3,
        select: { name: true, verifiedAt: true },
      }),
    ]);

  // Weekly activity buckets (Mon–Sat) from attendance.
  const buckets = new Map<number, number>();
  for (const rec of attendanceForWeek) {
    const dow = rec.attendanceSession.heldAt.getDay();
    buckets.set(dow, (buckets.get(dow) ?? 0) + 1);
  }
  const weekData = WEEK_BARS.map((dow) => ({ l: WEEKDAY_LABELS[dow], v: buckets.get(dow) ?? 0 }));
  const maxVal = Math.max(0, ...weekData.map((d) => d.v));
  const weeklyActivity = weekData.map((d) => ({ ...d, hot: d.v > 0 && d.v === maxVal }));

  // Activity feed: merge recent records.
  type FeedItem = { who: string; text: string; at: Date; tag: string };
  const feedRaw: FeedItem[] = [
    ...recentGradeItems.map((g) => ({
      who: g.course.createdBy?.name ?? "Pengajar",
      text: `menambahkan komponen nilai "${g.title}" di ${g.course.title}`,
      at: g.createdAt,
      tag: "Nilai",
    })),
    ...recentLessons.map((l) => ({
      who: l.course.createdBy?.name ?? "Pengajar",
      text: `mengunggah materi "${l.title}" di ${l.course.title}`,
      at: l.createdAt,
      tag: "Materi",
    })),
    ...recentSessions.map((s) => ({
      who: "Operator",
      text: `membuat sesi absensi "${s.title}" di ${s.course.title}`,
      at: s.createdAt,
      tag: "Absensi",
    })),
    ...recentVerified.map((u) => ({
      who: "Admin",
      text: `memverifikasi akun ${u.name}`,
      at: u.verifiedAt as Date,
      tag: "Sistem",
    })),
  ];
  const activity = feedRaw.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 5);

  // Role-specific stats + "continue learning".
  let stats: { label: string; value: string; delta?: string; up?: boolean; tone: string; icon: string }[] = [];
  let continueLearning: {
    id: string;
    title: string;
    progress: number;
    lessons: number;
    done: number;
  }[] = [];

  if (isStudent(user)) {
    const [enrollments, gradeRecords, attendanceRecords] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { enrolledAt: "desc" },
        select: { progress: true, course: { select: { id: true, title: true, _count: { select: { lessons: true } } } } },
      }),
      prisma.gradeRecord.findMany({ where: { userId: user.id }, select: { score: true, gradeItem: { select: { maxScore: true } } } }),
      prisma.attendanceRecord.findMany({ where: { userId: user.id }, select: { status: true } }),
    ]);

    const avgGrade = gradeRecords.length
      ? Math.round(gradeRecords.reduce((s, r) => s + (r.score / r.gradeItem.maxScore) * 100, 0) / gradeRecords.length)
      : 0;
    const present = attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const attRate = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : 0;
    const totalLessons = enrollments.reduce((s, e) => s + e.course._count.lessons, 0);
    const doneLessons = enrollments.reduce((s, e) => s + Math.round((e.progress / 100) * e.course._count.lessons), 0);

    stats = [
      { label: "Rata-rata Nilai", value: String(avgGrade || "-"), tone: "var(--primary)", icon: "award", up: true, delta: avgGrade >= 75 ? "tuntas" : undefined },
      { label: "Kehadiran", value: `${attRate}%`, tone: "var(--green)", icon: "check2", up: true },
      { label: "Materi Selesai", value: `${doneLessons}/${totalLessons}`, tone: "var(--violet)", icon: "book", up: true },
      { label: "Kelas Diikuti", value: String(enrollments.length), tone: "var(--amber)", icon: "doc", up: true },
    ];
    continueLearning = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      progress: e.progress,
      lessons: e.course._count.lessons,
      done: Math.round((e.progress / 100) * e.course._count.lessons),
    }));
  } else {
    const [students, pending, courses, allEnrollments, attendanceRecords] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.STUDENT, status: UserStatus.VERIFIED } }),
      prisma.user.count({ where: { status: UserStatus.PENDING } }),
      prisma.course.findMany({
        where: { deletedAt: null, status: CourseStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          _count: { select: { lessons: true } },
          enrollments: { select: { progress: true } },
        },
      }),
      prisma.enrollment.count(),
      prisma.attendanceRecord.findMany({ select: { status: true } }),
    ]);

    const present = attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const attRate = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : 0;

    stats = [
      { label: "Siswa Aktif", value: String(students), tone: "var(--primary)", icon: "users", up: true },
      { label: "Menunggu Verifikasi", value: String(pending), tone: "var(--amber)", icon: "award", up: false, delta: pending ? "perlu tinjauan" : undefined },
      { label: "Kelas Berjalan", value: String(courses.length), tone: "var(--violet)", icon: "book", up: true },
      { label: "Rata Kehadiran", value: `${attRate}%`, tone: "var(--green)", icon: "check2", up: true },
    ];
    continueLearning = courses.map((c) => {
      const avg = c.enrollments.length ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / c.enrollments.length) : 0;
      return { id: c.id, title: c.title, progress: avg, lessons: c._count.lessons, done: Math.round((avg / 100) * c._count.lessons) };
    });
  }

  return {
    stats,
    continueLearning,
    weeklyActivity,
    schedule: schedule.map((s) => ({
      id: s.id,
      time: s.startTime,
      title: s.course.title,
      room: s.room ?? "-",
      teacher: s.course.createdBy?.name ?? "-",
    })),
    deadlines: deadlines.map((d) => ({
      id: d.id,
      title: d.title,
      course: d.course.title,
      due: d.dueAt ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d.dueAt) : "-",
    })),
    activity: activity.map((a) => ({ who: a.who, text: a.text, when: formatRelative(a.at), tag: a.tag })),
  };
});

/* -------------------------------------------------------------------------- */
/*                              learning (courses)                            */
/* -------------------------------------------------------------------------- */

export const getLearningOverview = cache(async (user: AuthUser) => {
  if (isStudent(user)) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, course: { deletedAt: null } },
      orderBy: { enrolledAt: "desc" },
      select: {
        progress: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            createdBy: { select: { name: true } },
            _count: { select: { lessons: true, enrollments: true } },
          },
        },
      },
    });
    return enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      teacher: e.course.createdBy?.name ?? "Pengajar",
      lessons: e.course._count.lessons,
      students: e.course._count.enrollments,
      progress: e.progress,
    }));
  }

  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      createdBy: { select: { name: true } },
      enrollments: { select: { progress: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    teacher: c.createdBy?.name ?? "Pengajar",
    lessons: c._count.lessons,
    students: c._count.enrollments,
    progress: c.enrollments.length ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / c.enrollments.length) : 0,
  }));
});

/** Student-facing course view (lessons + own progress). */
export const getStudentCourseView = cache(async (courseId: string, userId: string) => {
  const [course, enrollment] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        createdBy: { select: { name: true } },
        _count: { select: { enrollments: true } },
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: { id: true, title: true, type: true, duration: true, description: true, content: true },
        },
      },
    }),
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { progress: true } }),
  ]);
  return { course, progress: enrollment?.progress ?? 0 };
});

/* -------------------------------------------------------------------------- */
/*                        admin/teacher course management                     */
/* -------------------------------------------------------------------------- */

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
        createdBy: { select: { name: true } },
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: { id: true, title: true, description: true, type: true, duration: true, order: true },
        },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          orderBy: { user: { name: "asc" } },
          select: {
            id: true,
            progress: true,
            user: { select: { id: true, name: true, email: true, profile: { select: { studentNumber: true, className: true } } } },
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

/* -------------------------------------------------------------------------- */
/*                                  gradebook                                  */
/* -------------------------------------------------------------------------- */

async function courseTabsFor(user: AuthUser) {
  if (isStudent(user)) {
    const rows = await prisma.enrollment.findMany({
      where: { userId: user.id, course: { deletedAt: null } },
      orderBy: { course: { title: "asc" } },
      select: { course: { select: { id: true, title: true } } },
    });
    return rows.map((r) => r.course);
  }
  return prisma.course.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } });
}

export const getGradebook = cache(async (user: AuthUser, courseId?: string) => {
  const courses = await courseTabsFor(user);
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = !isStudent(user);

  if (!activeCourseId) {
    return { courses, activeCourseId: null, columns: [], rows: [], canEdit };
  }

  const course = await prisma.course.findUnique({
    where: { id: activeCourseId },
    select: {
      gradeItems: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, maxScore: true, records: { select: { userId: true, score: true } } } },
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE, ...(isStudent(user) ? { userId: user.id } : {}) },
        orderBy: { user: { name: "asc" } },
        select: { user: { select: { id: true, name: true, profile: { select: { studentNumber: true } } } } },
      },
    },
  });

  const columns = (course?.gradeItems ?? []).map((g) => ({ id: g.id, title: g.title, maxScore: g.maxScore }));
  const rows = (course?.enrollments ?? []).map((e) => {
    const scores = (course?.gradeItems ?? []).map((g) => {
      const rec = g.records.find((r) => r.userId === e.user.id);
      return rec ? Math.round((rec.score / g.maxScore) * 100) : null;
    });
    const present = scores.filter((s): s is number => s !== null);
    const avg = present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : 0;
    return {
      studentId: e.user.id,
      name: e.user.name,
      studentNumber: e.user.profile?.studentNumber ?? "-",
      scores,
      avg,
    };
  });

  return { courses, activeCourseId, columns, rows, canEdit };
});

/* -------------------------------------------------------------------------- */
/*                                 attendance                                  */
/* -------------------------------------------------------------------------- */

export const getAttendanceBoard = cache(async (user: AuthUser, courseId?: string) => {
  const courses = await courseTabsFor(user);
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = !isStudent(user);

  if (!activeCourseId) {
    return { courses, activeCourseId: null, sessions: [], rows: [], canEdit };
  }

  const course = await prisma.course.findUnique({
    where: { id: activeCourseId },
    select: {
      attendanceSessions: {
        orderBy: { heldAt: "asc" },
        select: { id: true, title: true, heldAt: true, records: { select: { userId: true, status: true } } },
      },
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE, ...(isStudent(user) ? { userId: user.id } : {}) },
        orderBy: { user: { name: "asc" } },
        select: { user: { select: { id: true, name: true, profile: { select: { studentNumber: true } } } } },
      },
    },
  });

  const sessions = (course?.attendanceSessions ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(s.heldAt),
  }));
  const rows = (course?.enrollments ?? []).map((e) => {
    const marks = (course?.attendanceSessions ?? []).map((s) => {
      const rec = s.records.find((r) => r.userId === e.user.id);
      return rec ? rec.status : null;
    });
    return { studentId: e.user.id, name: e.user.name, studentNumber: e.user.profile?.studentNumber ?? "-", marks };
  });

  return { courses, activeCourseId, sessions, rows, canEdit };
});

/* -------------------------------------------------------------------------- */
/*                              users management                              */
/* -------------------------------------------------------------------------- */

export const getManagedUsers = cache(async () => {
  return prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      profile: { select: { studentNumber: true, className: true, phone: true } },
    },
  });
});

/* -------------------------------------------------------------------------- */
/*                                  profile                                    */
/* -------------------------------------------------------------------------- */

export const getProfile = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: { select: { studentNumber: true, className: true, phone: true, address: true } },
    },
  });
});
