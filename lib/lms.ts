import { cache } from "react";
import {
  AttendanceStatus,
  CourseStatus,
  EducationLevel,
  EnrollmentStatus,
  ReportCardStatus,
  Semester,
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
/*                          periode (semester + tahun ajaran)                 */
/* -------------------------------------------------------------------------- */

export type Period = { semester: Semester; academicYear: string };

/** Juli-Desember = GANJIL tahun ajaran berjalan; Januari-Juni = GENAP tahun ajaran sebelumnya. */
export function getCurrentPeriod(now = new Date()): Period {
  const year = now.getFullYear();
  const isFirstHalfOfSchoolYear = now.getMonth() >= 6;
  return isFirstHalfOfSchoolYear
    ? { semester: Semester.GANJIL, academicYear: `${year}/${year + 1}` }
    : { semester: Semester.GENAP, academicYear: `${year - 1}/${year}` };
}

export function formatPeriod(period: Period) {
  return `Semester ${period.semester === Semester.GANJIL ? "Ganjil" : "Genap"} ${period.academicYear}`;
}

/* -------------------------------------------------------------------------- */
/*                                  dashboard                                 */
/* -------------------------------------------------------------------------- */

export const getDashboardData = cache(async (user: AuthUser) => {
  void user;
  const todayDow = new Date().getDay();
  const weekStart = new Date(Date.now() - 28 * 864e5);

  const [schedule, deadlines, attendanceSessionsForWeek, recentGradeItems, recentLessons, recentSessions, recentVerified] =
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
      prisma.attendanceSession.findMany({
        where: { heldAt: { gte: weekStart }, course: { deletedAt: null } },
        select: { heldAt: true, _count: { select: { records: true } } },
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
  for (const session of attendanceSessionsForWeek) {
    const dow = session.heldAt.getDay();
    buckets.set(dow, (buckets.get(dow) ?? 0) + session._count.records);
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
      who: "Administrasi",
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

  const [students, pending, courses, attendanceGroups] = await Promise.all([
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
      },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const attendanceTotal = attendanceGroups.reduce((sum, group) => sum + group._count.status, 0);
  const present = attendanceGroups.find((group) => group.status === AttendanceStatus.PRESENT)?._count.status ?? 0;
  const attRate = attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0;
  const courseIds = courses.map((course) => course.id);
  const progressGroups = courseIds.length
    ? await prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds }, status: EnrollmentStatus.ACTIVE },
        _avg: { progress: true },
      })
    : [];
  const avgProgressByCourse = new Map(progressGroups.map((group) => [group.courseId, Math.round(group._avg.progress ?? 0)]));

  stats = [
    { label: "Santri Aktif", value: String(students), tone: "var(--primary)", icon: "users", up: true },
    { label: "Menunggu Verifikasi", value: String(pending), tone: "var(--amber)", icon: "award", up: false, delta: pending ? "perlu tinjauan" : undefined },
    { label: "Kelas Berjalan", value: String(courses.length), tone: "var(--teal)", icon: "book", up: true },
    { label: "Rata Kehadiran", value: `${attRate}%`, tone: "var(--green)", icon: "check2", up: true },
  ];
  continueLearning = courses.map((c) => {
    const avg = avgProgressByCourse.get(c.id) ?? 0;
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
      _count: { select: { lessons: true, enrollments: true } },
    },
  });
  const courseIds = courses.map((course) => course.id);
  const progressGroups = courseIds.length
    ? await prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds }, status: EnrollmentStatus.ACTIVE },
        _avg: { progress: true },
      })
    : [];
  const avgProgressByCourse = new Map(progressGroups.map((group) => [group.courseId, Math.round(group._avg.progress ?? 0)]));

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    teacher: c.createdBy?.name ?? "Pengajar",
    lessons: c._count.lessons,
    students: c._count.enrollments,
    progress: avgProgressByCourse.get(c.id) ?? 0,
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
      where: { enrollments: { none: { courseId, status: EnrollmentStatus.ACTIVE } } },
      orderBy: { name: "asc" },
      take: 200,
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
  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;

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
  const recordsByGradeItem = new Map(
    (course?.gradeItems ?? []).map((g) => [g.id, new Map(g.records.map((record) => [record.studentId, record.score]))]),
  );
  const rows = (course?.enrollments ?? []).map((e) => {
    const scores = (course?.gradeItems ?? []).map((g) => {
      const score = recordsByGradeItem.get(g.id)?.get(e.student.id);
      return score === undefined ? null : Math.round((score / g.maxScore) * 100);
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
  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;

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
  const recordsBySession = new Map(
    (course?.attendanceSessions ?? []).map((s) => [s.id, new Map(s.records.map((record) => [record.studentId, record.status]))]),
  );
  const rows = (course?.enrollments ?? []).map((e) => {
    const marks = (course?.attendanceSessions ?? []).map((s) => {
      return recordsBySession.get(s.id)?.get(e.student.id) ?? null;
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
    take: 200,
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
      _count: { select: { enrollments: true } },
    },
  });
  const childIds = children.map((child) => child.id);
  const [gradeRecords, attendanceGroups] = childIds.length
    ? await Promise.all([
        prisma.gradeRecord.findMany({
          where: { studentId: { in: childIds } },
          select: { studentId: true, score: true, gradeItem: { select: { maxScore: true } } },
        }),
        prisma.attendanceRecord.groupBy({
          by: ["studentId", "status"],
          where: { studentId: { in: childIds } },
          _count: { status: true },
        }),
      ])
    : [[], []];
  const gradesByChild = new Map<string, typeof gradeRecords>();
  for (const record of gradeRecords) {
    const rows = gradesByChild.get(record.studentId) ?? [];
    rows.push(record);
    gradesByChild.set(record.studentId, rows);
  }
  const attendanceByChild = new Map<string, { present: number; total: number }>();
  for (const group of attendanceGroups) {
    const current = attendanceByChild.get(group.studentId) ?? { present: 0, total: 0 };
    current.total += group._count.status;
    if (group.status === AttendanceStatus.PRESENT) current.present += group._count.status;
    attendanceByChild.set(group.studentId, current);
  }

  return children.map((c) => {
    const grades = gradesByChild.get(c.id) ?? [];
    const avg = grades.length
      ? Math.round(grades.reduce((s, r) => s + (r.score / r.gradeItem.maxScore) * 100, 0) / grades.length)
      : 0;
    const att = attendanceByChild.get(c.id) ?? { present: 0, total: 0 };
    return {
      childId: c.id,
      name: c.name,
      level: c.level,
      className: c.className,
      studentNumber: c.studentNumber,
      courses: c._count.enrollments,
      avg,
      attRate: rate(att.present, att.total),
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
/*                            schedule (penjadwalan)                          */
/* -------------------------------------------------------------------------- */

const DAY_NAMES = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** Papan jadwal per hari (dayOfWeek 0 = Ahad, mengikuti Date.getDay()). */
export const getScheduleBoard = cache(async (level?: EducationLevel) => {
  const [slots, courses] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { course: { deletedAt: null, ...(level ? { level } : {}) } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        room: true,
        course: { select: { id: true, title: true, level: true, createdBy: { select: { name: true } } } },
      },
    }),
    prisma.course.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true, level: true },
    }),
  ]);

  const days = DAY_NAMES.map((label, dayOfWeek) => ({
    dayOfWeek,
    label,
    slots: slots
      .filter((s) => s.dayOfWeek === dayOfWeek)
      .map((s) => ({
        id: s.id,
        startTime: s.startTime,
        room: s.room ?? "-",
        courseId: s.course.id,
        courseTitle: s.course.title,
        level: s.course.level,
        teacher: s.course.createdBy?.name ?? "-",
      })),
  }));

  return { days, courses };
});

/* -------------------------------------------------------------------------- */
/*                                rapor (staff)                               */
/* -------------------------------------------------------------------------- */

/** Rekap nilai + absensi per mapel untuk satu santri pada satu periode. */
export async function computeReportEntries(studentId: string, period: Period) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, course: { deletedAt: null } },
    orderBy: { course: { title: "asc" } },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          gradeItems: {
            where: { semester: period.semester, academicYear: period.academicYear },
            select: { maxScore: true, records: { where: { studentId }, select: { score: true } } },
          },
          attendanceSessions: {
            where: { semester: period.semester, academicYear: period.academicYear },
            select: { records: { where: { studentId }, select: { status: true } } },
          },
        },
      },
    },
  });

  return enrollments.map(({ course }) => {
    const values = course.gradeItems
      .filter((g) => g.records.length > 0)
      .map((g) => Math.round((g.records[0].score / g.maxScore) * 100));
    const finalScore = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

    const marks = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>;
    for (const session of course.attendanceSessions) {
      const rec = session.records[0];
      if (rec) marks[rec.status] += 1;
    }

    return {
      courseId: course.id,
      courseTitle: course.title,
      finalScore,
      present: marks.PRESENT,
      late: marks.LATE,
      absent: marks.ABSENT,
      excused: marks.EXCUSED,
    };
  });
}

/** Daftar santri satu kelas + status rapor mereka pada periode itu. */
export const getReportBoard = cache(async (period: Period, className?: string) => {
  const classRows = await prisma.studentProfile.findMany({
    distinct: ["className"],
    orderBy: { className: "asc" },
    select: { className: true },
  });
  const classes = classRows.map((row) => row.className);
  const activeClass = className && classes.includes(className) ? className : classes[0] ?? null;

  if (!activeClass) {
    return { classes, activeClass: null, students: [] };
  }

  const students = await prisma.studentProfile.findMany({
    where: { className: activeClass },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      studentNumber: true,
      level: true,
      reportCards: {
        where: { semester: period.semester, academicYear: period.academicYear },
        select: { id: true, status: true, publishedAt: true },
      },
    },
  });

  return {
    classes,
    activeClass,
    students: students.map((s) => ({
      studentId: s.id,
      name: s.name,
      studentNumber: s.studentNumber,
      level: s.level,
      reportCard: s.reportCards[0] ?? null,
    })),
  };
});

/** Detail satu rapor untuk staf (semua status) berikut barisnya. */
export const getReportCardDetail = cache(async (reportCardId: string) => {
  return prisma.reportCard.findUnique({
    where: { id: reportCardId },
    select: {
      id: true,
      semester: true,
      academicYear: true,
      homeroomNote: true,
      status: true,
      publishedAt: true,
      createdBy: { select: { name: true } },
      student: { select: { id: true, name: true, studentNumber: true, className: true, level: true } },
      entries: {
        orderBy: { courseTitle: "asc" },
        select: { id: true, courseTitle: true, finalScore: true, present: true, late: true, absent: true, excused: true },
      },
    },
  });
});

/** Rapor PUBLISHED milik satu anak, hanya jika anak itu milik wali peminta. */
export const getChildReportCards = cache(async (parentId: string, childId: string) => {
  const child = await prisma.studentProfile.findFirst({
    where: { id: childId, parentId },
    select: { id: true },
  });
  if (!child) return null;

  return prisma.reportCard.findMany({
    where: { studentId: childId, status: ReportCardStatus.PUBLISHED },
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }],
    select: {
      id: true,
      semester: true,
      academicYear: true,
      homeroomNote: true,
      publishedAt: true,
      entries: {
        orderBy: { courseTitle: "asc" },
        select: { id: true, courseTitle: true, finalScore: true, present: true, late: true, absent: true, excused: true },
      },
    },
  });
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
    take: 100,
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
      familyCardUrl: true,
      birthCertificateUrl: true,
      previousReportUrl: true,
      photoUrl: true,
      status: true,
      createdAt: true,
    },
  });
});
