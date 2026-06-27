import { cache } from "react";
import {
  AttendanceStatus,
  CourseStatus,
  EducationLevel,
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

/* -------------------------------------------------------------------------- */
/*                                  dashboard                                 */
/* -------------------------------------------------------------------------- */

export const getDashboardData = cache(async (user: AuthUser) => {
  void user;
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
        },
        orderBy: { dueAt: "asc" },
        take: 4,
        select: { id: true, title: true, dueAt: true, course: { select: { title: true } } },
      }),
      prisma.attendanceRecord.findMany({
        where: {
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

  const [students, pending, courses, attendanceRecords] = await Promise.all([
    prisma.studentProfile.count(),
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
    prisma.attendanceRecord.findMany({ select: { status: true } }),
  ]);

  const present = attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const attRate = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : 0;

  stats = [
    { label: "Santri Aktif", value: String(students), tone: "var(--primary)", icon: "users", up: true },
    { label: "Menunggu Verifikasi", value: String(pending), tone: "var(--amber)", icon: "award", up: false, delta: pending ? "perlu tinjauan" : undefined },
    { label: "Kelas Berjalan", value: String(courses.length), tone: "var(--teal)", icon: "book", up: true },
    { label: "Rata Kehadiran", value: `${attRate}%`, tone: "var(--green)", icon: "check2", up: true },
  ];
  continueLearning = courses.map((c) => {
    const avg = c.enrollments.length ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / c.enrollments.length) : 0;
    return { id: c.id, title: c.title, progress: avg, lessons: c._count.lessons, done: Math.round((avg / 100) * c._count.lessons) };
  });

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
  void user;
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
          orderBy: { student: { name: "asc" } },
          select: {
            id: true,
            progress: true,
            student: { select: { id: true, name: true, studentNumber: true, className: true } },
          },
        },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, studentNumber: true, className: true },
    }),
  ]);
  return { course, verifiedStudents };
});

/* -------------------------------------------------------------------------- */
/*                                  gradebook                                  */
/* -------------------------------------------------------------------------- */

async function courseTabsFor() {
  return prisma.course.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } });
}

export const getGradebook = cache(async (user: AuthUser, courseId?: string) => {
  const courses = await courseTabsFor();
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;

  if (!activeCourseId) {
    return { courses, activeCourseId: null, columns: [], rows: [], canEdit };
  }

  const course = await prisma.course.findUnique({
    where: { id: activeCourseId },
    select: {
      gradeItems: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, maxScore: true, records: { select: { studentId: true, score: true } } } },
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE },
        orderBy: { student: { name: "asc" } },
        select: { student: { select: { id: true, name: true, studentNumber: true } } },
      },
    },
  });

  const columns = (course?.gradeItems ?? []).map((g) => ({ id: g.id, title: g.title, maxScore: g.maxScore }));
  const rows = (course?.enrollments ?? []).map((e) => {
    const scores = (course?.gradeItems ?? []).map((g) => {
      const rec = g.records.find((r) => r.studentId === e.student.id);
      return rec ? Math.round((rec.score / g.maxScore) * 100) : null;
    });
    const present = scores.filter((s): s is number => s !== null);
    const avg = present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : 0;
    return {
      studentId: e.student.id,
      name: e.student.name,
      studentNumber: e.student.studentNumber,
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
  const courses = await courseTabsFor();
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;

  if (!activeCourseId) {
    return { courses, activeCourseId: null, sessions: [], rows: [], canEdit };
  }

  const course = await prisma.course.findUnique({
    where: { id: activeCourseId },
    select: {
      attendanceSessions: {
        orderBy: { heldAt: "asc" },
        select: { id: true, title: true, heldAt: true, records: { select: { studentId: true, status: true } } },
      },
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE },
        orderBy: { student: { name: "asc" } },
        select: { student: { select: { id: true, name: true, studentNumber: true } } },
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
      const rec = s.records.find((r) => r.studentId === e.student.id);
      return rec ? rec.status : null;
    });
    return { studentId: e.student.id, name: e.student.name, studentNumber: e.student.studentNumber, marks };
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
    },
  });
});

/* -------------------------------------------------------------------------- */
/*                              parent (wali santri)                          */
/* -------------------------------------------------------------------------- */

function rate(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

/** Summary cards for each child linked to a parent. */
export const getParentChildren = cache(async (parentId: string) => {
  const children = await prisma.studentProfile.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      level: true,
      className: true,
      studentNumber: true,
      gradeRecords: { select: { score: true, gradeItem: { select: { maxScore: true } } } },
      attendanceRecords: { select: { status: true } },
      _count: { select: { enrollments: true } },
    },
  });

  return children.map((c) => {
    const grades = c.gradeRecords;
    const avg = grades.length
      ? Math.round(grades.reduce((s, r) => s + (r.score / r.gradeItem.maxScore) * 100, 0) / grades.length)
      : 0;
    const att = c.attendanceRecords;
    const present = att.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    return {
      childId: c.id,
      name: c.name,
      level: c.level,
      className: c.className,
      studentNumber: c.studentNumber,
      courses: c._count.enrollments,
      avg,
      attRate: rate(present, att.length),
    };
  });
});

/** Full report for one child, only if it belongs to the requesting parent. */
export const getChildDetail = cache(async (parentId: string, childId: string) => {
  const profile = await prisma.studentProfile.findFirst({
    where: { id: childId, parentId },
    select: {
      id: true,
      name: true,
      level: true,
      className: true,
      studentNumber: true,
      phone: true,
    },
  });
  if (!profile) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: childId, course: { deletedAt: null } },
    orderBy: { course: { title: "asc" } },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          createdBy: { select: { name: true } },
          gradeItems: {
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, maxScore: true, records: { where: { studentId: childId }, select: { score: true } } },
          },
          attendanceSessions: {
            orderBy: { heldAt: "asc" },
            select: { id: true, title: true, heldAt: true, records: { where: { studentId: childId }, select: { status: true } } },
          },
        },
      },
    },
  });

  let gradeSum = 0;
  let gradeCount = 0;
  let attPresent = 0;
  let attTotal = 0;

  const courses = enrollments.map((e) => {
    const grades = e.course.gradeItems.map((g) => {
      const rec = g.records[0];
      const value = rec ? Math.round((rec.score / g.maxScore) * 100) : null;
      if (value !== null) {
        gradeSum += value;
        gradeCount += 1;
      }
      return { id: g.id, title: g.title, value };
    });
    const present = grades.filter((g) => g.value !== null);
    const courseAvg = present.length ? Math.round(present.reduce((s, g) => s + (g.value as number), 0) / present.length) : 0;

    const marks = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>;
    for (const s of e.course.attendanceSessions) {
      const rec = s.records[0];
      if (rec) {
        marks[rec.status] += 1;
        attTotal += 1;
        if (rec.status === AttendanceStatus.PRESENT) attPresent += 1;
      }
    }
    const courseAttTotal = marks.PRESENT + marks.LATE + marks.ABSENT + marks.EXCUSED;

    return {
      id: e.course.id,
      title: e.course.title,
      teacher: e.course.createdBy?.name ?? "Pengajar",
      grades,
      courseAvg,
      marks,
      attRate: rate(marks.PRESENT, courseAttTotal),
    };
  });

  return {
    child: {
      id: profile.id,
      name: profile.name,
      level: profile.level,
      className: profile.className,
      studentNumber: profile.studentNumber,
    },
    overall: { avg: gradeCount ? Math.round(gradeSum / gradeCount) : 0, attRate: rate(attPresent, attTotal) },
    courses,
  };
});

/* -------------------------------------------------------------------------- */
/*                          announcements (informasi)                         */
/* -------------------------------------------------------------------------- */

/** levels null = staff view (all). Otherwise only matching levels + global (null). */
export const getAnnouncements = cache(async (levels: EducationLevel[] | null) => {
  const where = levels ? { OR: [{ level: null }, { level: { in: levels } }] } : {};
  return prisma.announcement.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      level: true,
      pinned: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
});

/** Distinct levels of a parent's children, for filtering their announcements. */
export const getParentLevels = cache(async (parentId: string) => {
  const rows = await prisma.studentProfile.findMany({ where: { parentId }, select: { level: true } });
  const set = new Set(rows.map((r) => r.level));
  return [...set];
});

/* -------------------------------------------------------------------------- */
/*                           admissions (pendaftaran)                         */
/* -------------------------------------------------------------------------- */

export const getAdmissions = cache(async () => {
  return prisma.admission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      childName: true,
      level: true,
      gender: true,
      birthPlace: true,
      birthDate: true,
      previousSchool: true,
      parentName: true,
      parentPhone: true,
      parentEmail: true,
      address: true,
      note: true,
      status: true,
      createdAt: true,
    },
  });
});
