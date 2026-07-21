import { cache } from "react";
import {
  AdmissionStatus,
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

function isAssignedAcademicStaff(user: AuthUser) {
  return user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;
}

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
  const now = new Date();
  const todayDow = now.getDay();
  const today = dateKeyToDb(toDateKey(now));
  const weekStart = new Date(Date.now() - 28 * 864e5);
  const isAdmin = user.role === UserRole.ADMIN;
  const isMudir = user.role === UserRole.MUDIR;
  const oversightMode = isAdmin || isMudir;
  const teacherScope = isAssignedAcademicStaff(user) ? { teacherId: user.id } : {};

  const [
    schedule,
    deadlines,
    attendanceSessionsForWeek,
    recentGradeItems,
    recentSessions,
    recentVerified,
    students,
    pendingUsers,
    pendingAdmissions,
    totalUsers,
    courses,
    attendanceGroups,
    staffCount,
    staffAttendanceToday,
    bkkhToday,
    staffAttendanceForWeek,
  ] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { dayOfWeek: todayDow, course: { deletedAt: null, ...teacherScope } },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          room: true,
          course: { select: { id: true, title: true, teacher: { select: { name: true } } } },
        },
      }),
      isAdmin
        ? Promise.resolve([])
        : prisma.gradeItem.findMany({
            where: { dueAt: { gte: now }, course: { ...teacherScope } },
            orderBy: { dueAt: "asc" },
            take: 4,
            select: { id: true, title: true, dueAt: true, course: { select: { title: true } } },
          }),
      prisma.attendanceSession.findMany({
        where: { heldAt: { gte: weekStart }, course: { deletedAt: null, ...teacherScope } },
        select: { heldAt: true },
      }),
      isAdmin
        ? Promise.resolve([])
        : prisma.gradeItem.findMany({
            where: { course: { ...teacherScope } },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { title: true, createdAt: true, course: { select: { title: true, teacher: { select: { name: true } } } } },
          }),
      isAdmin
        ? Promise.resolve([])
        : prisma.attendanceSession.findMany({
            where: { course: { ...teacherScope } },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { title: true, createdAt: true, course: { select: { title: true } } },
          }),
      isAdmin
        ? prisma.user.findMany({
            where: { status: UserStatus.VERIFIED, verifiedAt: { not: null } },
            orderBy: { verifiedAt: "desc" },
            take: 5,
            select: { name: true, verifiedAt: true },
          })
        : Promise.resolve([]),
      isAdmin ? prisma.studentProfile.count() : Promise.resolve(0),
      isAdmin ? prisma.user.count({ where: { status: UserStatus.PENDING } }) : Promise.resolve(0),
      isAdmin ? prisma.admission.count({ where: { status: AdmissionStatus.PENDING } }) : Promise.resolve(0),
      isAdmin ? prisma.user.count() : Promise.resolve(0),
      prisma.course.findMany({
        where: { deletedAt: null, status: CourseStatus.PUBLISHED, ...teacherScope },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, title: true, _count: { select: { enrollments: true } } },
      }),
      prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: isAssignedAcademicStaff(user) ? { attendanceSession: { course: { teacherId: user.id } } } : undefined,
        _count: { status: true },
      }),
      oversightMode
        ? prisma.user.count({ where: { role: { in: [UserRole.TEACHER, UserRole.HOMEROOM] }, status: UserStatus.VERIFIED } })
        : Promise.resolve(0),
      oversightMode
        ? prisma.staffAttendance.groupBy({ by: ["status"], where: { date: today }, _count: { status: true } })
        : Promise.resolve([]),
      oversightMode ? prisma.bkkhReport.count({ where: { date: today } }) : Promise.resolve(0),
      oversightMode
        ? prisma.staffAttendance.findMany({ where: { date: { gte: weekStart } }, select: { date: true } })
        : Promise.resolve([]),
    ]);

  const buckets = new Map<number, number>();
  if (oversightMode) {
    for (const record of staffAttendanceForWeek) {
      const dow = record.date.getUTCDay();
      buckets.set(dow, (buckets.get(dow) ?? 0) + 1);
    }
  } else {
    for (const session of attendanceSessionsForWeek) {
      const dow = session.heldAt.getDay();
      buckets.set(dow, (buckets.get(dow) ?? 0) + 1);
    }
  }
  const weekData = WEEK_BARS.map((dow) => ({ l: WEEKDAY_LABELS[dow], v: buckets.get(dow) ?? 0 }));
  const maxVal = Math.max(0, ...weekData.map((d) => d.v));
  const weeklyActivity = weekData.map((d) => ({ ...d, hot: d.v > 0 && d.v === maxVal }));

  // Activity feed: merge recent records.
  type FeedItem = { who: string; text: string; at: Date; tag: string };
  const feedRaw: FeedItem[] = [
    ...recentGradeItems.map((g) => ({
      who: g.course.teacher?.name ?? "Pengajar",
      text: `menambahkan komponen nilai "${g.title}" di ${g.course.title}`,
      at: g.createdAt,
      tag: "Nilai",
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

  const attendanceTotal = attendanceGroups.reduce((sum, group) => sum + group._count.status, 0);
  const present = attendanceGroups.find((group) => group.status === AttendanceStatus.PRESENT)?._count.status ?? 0;
  const attRate = attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0;
  const staffPresent = staffAttendanceToday.find((group) => group.status === AttendanceStatus.PRESENT)?._count.status ?? 0;
  const staffLate = staffAttendanceToday.find((group) => group.status === AttendanceStatus.LATE)?._count.status ?? 0;
  const staffAbsent = staffAttendanceToday.find((group) => group.status === AttendanceStatus.ABSENT)?._count.status ?? 0;
  const staffMarked = staffAttendanceToday.reduce((sum, group) => sum + group._count.status, 0);
  const participantCount = courses.reduce((sum, course) => sum + course._count.enrollments, 0);

  let stats: { label: string; value: string; delta?: string; up?: boolean; tone: string; icon: string }[];
  let hero = { value: attRate, label: "Tingkat Kehadiran" };
  if (isAdmin) {
    stats = [
      { label: "PPDB Menunggu", value: String(pendingAdmissions), tone: "var(--amber)", icon: "doc", delta: pendingAdmissions ? "perlu tinjauan" : undefined },
      { label: "Akun Menunggu", value: String(pendingUsers), tone: "var(--amber)", icon: "award", delta: pendingUsers ? "perlu verifikasi" : undefined },
      { label: "Total Pengguna", value: String(totalUsers), tone: "var(--primary)", icon: "users" },
      { label: "Santri Aktif", value: String(students), tone: "var(--green)", icon: "book" },
    ];
    hero = { value: staffCount ? Math.round((staffMarked / staffCount) * 100) : 0, label: "Absensi Ustadz Tercatat" };
  } else if (isMudir) {
    const followUp = Math.max(0, staffCount - staffMarked) + staffLate + staffAbsent;
    stats = [
      { label: "Ustadz Aktif", value: String(staffCount), tone: "var(--primary)", icon: "users" },
      { label: "Hadir Hari Ini", value: String(staffPresent), tone: "var(--green)", icon: "check2" },
      { label: "BKKH Masuk", value: String(bkkhToday), tone: "var(--teal)", icon: "doc" },
      { label: "Perlu Tindak Lanjut", value: String(followUp), tone: "var(--amber)", icon: "award", delta: followUp ? "perlu diperiksa" : undefined },
    ];
    hero = { value: staffCount ? Math.round((bkkhToday / staffCount) * 100) : 0, label: "Kelengkapan BKKH" };
  } else {
    stats = [
      { label: isAssignedAcademicStaff(user) ? "Mapel Diampu" : "Mata Pelajaran", value: String(courses.length), tone: "var(--primary)", icon: "book" },
      { label: "Peserta Mapel", value: String(participantCount), tone: "var(--teal)", icon: "users" },
      { label: "Sesi 4 Pekan", value: String(attendanceSessionsForWeek.length), tone: "var(--amber)", icon: "calendar" },
      { label: "Rata Kehadiran", value: `${attRate}%`, tone: "var(--green)", icon: "check2" },
    ];
  }
  const courseSummaries = courses.map((c) => ({ id: c.id, title: c.title, students: c._count.enrollments }));

  return {
    stats,
    hero,
    weeklyTitle: oversightMode ? "Kehadiran Ustadz" : "Aktivitas Mingguan",
    weeklySub: oversightMode ? "Catatan kehadiran dalam empat pekan terakhir" : "Sesi kelas tercatat per hari",
    courses: courseSummaries,
    weeklyActivity,
    schedule: schedule.map((s) => ({
      id: s.id,
      time: s.startTime.replace(".", ":"),
      title: s.course.title,
      room: s.room ?? "-",
      teacher: s.course.teacher?.name ?? "Belum ditugaskan",
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
/*                          mata pelajaran (courses)                          */
/* -------------------------------------------------------------------------- */

export const getCourseOverview = cache(async (user: AuthUser) => {
  const courses = await prisma.course.findMany({
    where: { deletedAt: null, ...(isAssignedAcademicStaff(user) ? { teacherId: user.id } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      teacherId: true,
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, scheduleSlots: true } },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    level: c.level,
    assigned: Boolean(c.teacherId),
    teacher: c.teacher?.name ?? "Belum ditugaskan",
    students: c._count.enrollments,
    scheduleSlots: c._count.scheduleSlots,
  }));
});

export const getTeachingStaff = cache(async () => {
  return prisma.user.findMany({
    where: { role: { in: [UserRole.TEACHER, UserRole.HOMEROOM] }, status: UserStatus.VERIFIED },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
});

/* -------------------------------------------------------------------------- */
/*                        admin/teacher course management                     */
/* -------------------------------------------------------------------------- */

export const getCourseManagement = cache(async (courseId: string, user: AuthUser) => {
  const [course, verifiedStudents, teachingStaff] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, ...(isAssignedAcademicStaff(user) ? { teacherId: user.id } : {}) },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        teacherId: true,
        teacher: { select: { name: true } },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          orderBy: { student: { name: "asc" } },
          select: {
            id: true,
            student: { select: { id: true, name: true, studentNumber: true, className: true } },
          },
        },
      },
    }),
    user.role === UserRole.ADMIN
      ? prisma.studentProfile.findMany({
          where: { enrollments: { none: { courseId, status: EnrollmentStatus.ACTIVE } } },
          orderBy: { name: "asc" },
          take: 200,
          select: { id: true, name: true, studentNumber: true, className: true },
        })
      : Promise.resolve([]),
    user.role === UserRole.ADMIN ? getTeachingStaff() : Promise.resolve([]),
  ]);
  return { course, verifiedStudents, teachingStaff };
});

/* -------------------------------------------------------------------------- */
/*                                  gradebook                                  */
/* -------------------------------------------------------------------------- */

async function courseTabsFor(user: AuthUser) {
  return prisma.course.findMany({
    where: { deletedAt: null, ...(isAssignedAcademicStaff(user) ? { teacherId: user.id } : {}) },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export const getGradebook = cache(async (user: AuthUser, courseId?: string) => {
  const courses = await courseTabsFor(user);
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;

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
  const courses = await courseTabsFor(user);
  const activeCourseId = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id ?? null;
  const canEdit = user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;

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
          teacher: { select: { name: true } },
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
      teacher: e.course.teacher?.name ?? "Belum ditugaskan",
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
export const getScheduleBoard = cache(async (user: AuthUser, level?: EducationLevel) => {
  const teacherScope = isAssignedAcademicStaff(user) ? { teacherId: user.id } : {};
  const [slots, courses] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { course: { deletedAt: null, ...teacherScope, ...(level ? { level } : {}) } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        room: true,
        course: { select: { id: true, title: true, level: true, teacher: { select: { name: true } } } },
      },
    }),
    prisma.course.findMany({
      where: { deletedAt: null, ...teacherScope },
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
        startTime: s.startTime.replace(".", ":"),
        room: s.room ?? "-",
        courseId: s.course.id,
        courseTitle: s.course.title,
        level: s.course.level,
        teacher: s.course.teacher?.name ?? "Belum ditugaskan",
      })),
  }));

  return { days, courses };
});

/** Jadwal per anak untuk wali: hanya mapel yang diikuti anaknya sendiri. */
export const getParentScheduleBoard = cache(async (parentId: string) => {
  const children = await prisma.studentProfile.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      className: true,
      level: true,
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE, course: { deletedAt: null } },
        select: {
          course: {
            select: {
              id: true,
              title: true,
              teacher: { select: { name: true } },
              scheduleSlots: { select: { id: true, dayOfWeek: true, startTime: true, room: true } },
            },
          },
        },
      },
    },
  });

  return children.map((child) => {
    const slots = child.enrollments.flatMap((e) =>
      e.course.scheduleSlots.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime.replace(".", ":"),
        room: s.room ?? "-",
        courseId: e.course.id,
        courseTitle: e.course.title,
        teacher: e.course.teacher?.name ?? "Belum ditugaskan",
      })),
    );
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      childId: child.id,
      name: child.name,
      className: child.className,
      level: child.level,
      days: DAY_NAMES.map((label, dayOfWeek) => ({
        dayOfWeek,
        label,
        slots: slots.filter((s) => s.dayOfWeek === dayOfWeek),
      })),
    };
  });
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

/* -------------------------------------------------------------------------- */
/*                          absensi ustadz (staff)                            */
/* -------------------------------------------------------------------------- */

const STAFF_ROLES = [UserRole.TEACHER, UserRole.HOMEROOM] as const;

/** Kunci tanggal lokal "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Kolom bertipe DATE disimpan sebagai tengah malam UTC oleh Prisma. */
export function dateKeyToDb(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** Daftar ustadz (pengajar + wali kelas) beserta status kehadiran pada satu tanggal. */
export const getStaffAttendanceBoard = cache(async (dateKey: string) => {
  const date = dateKeyToDb(dateKey);
  const [teachers, records] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...STAFF_ROLES] }, status: UserStatus.VERIFIED },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.staffAttendance.findMany({
      where: { date },
      select: { teacherId: true, status: true, note: true },
    }),
  ]);
  const byTeacher = new Map(records.map((r) => [r.teacherId, r]));
  return teachers.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    status: byTeacher.get(t.id)?.status ?? null,
    note: byTeacher.get(t.id)?.note ?? null,
  }));
});

/** Rekap kehadiran ustadz sebulan penuh (bulan diambil dari dateKey). */
export const getStaffAttendanceRecap = cache(async (dateKey: string) => {
  const base = dateKeyToDb(dateKey);
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));

  const [teachers, records] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...STAFF_ROLES] }, status: UserStatus.VERIFIED },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.staffAttendance.findMany({
      where: { date: { gte: start, lt: end } },
      select: { teacherId: true, status: true },
    }),
  ]);

  const empty = () => ({ present: 0, late: 0, absent: 0, excused: 0 });
  const byTeacher = new Map(teachers.map((t) => [t.id, empty()]));
  for (const r of records) {
    const c = byTeacher.get(r.teacherId);
    if (!c) continue;
    if (r.status === AttendanceStatus.PRESENT) c.present += 1;
    else if (r.status === AttendanceStatus.LATE) c.late += 1;
    else if (r.status === AttendanceStatus.ABSENT) c.absent += 1;
    else c.excused += 1;
  }

  return teachers.map((t) => ({ id: t.id, name: t.name, role: t.role, ...byTeacher.get(t.id)! }));
});

/* -------------------------------------------------------------------------- */
/*                         BKKH (laporan harian ustadz)                       */
/* -------------------------------------------------------------------------- */

/** Laporan kegiatan manual per ustadz pada satu tanggal. */
export const getBkkhDailyReports = cache(async (dateKey: string) => {
  const date = dateKeyToDb(dateKey);
  const reports = await prisma.bkkhReport.findMany({
    where: { date },
    select: {
      id: true,
      teacherId: true,
      assignment: true,
      activity03000715: true,
      activity07150900: true,
      activity09301200: true,
      activity12301430: true,
      activity15301700: true,
      activity18002100: true,
      updatedAt: true,
    },
  });
  return new Map(reports.map((report) => [report.teacherId, report]));
});

/** Total hari dengan laporan BKKH per ustadz dalam bulan dari dateKey. */
export const getBkkhMonthlyCounts = cache(async (dateKey: string) => {
  const base = dateKeyToDb(dateKey);
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  const groups = await prisma.bkkhReport.groupBy({
    by: ["teacherId"],
    where: { date: { gte: start, lt: end } },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.teacherId, g._count._all]));
});
