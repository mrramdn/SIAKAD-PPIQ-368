"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import {
  requireAcademicStaff,
  requireAdmin,
  requireAnnouncementManager,
  requireHomeroom,
  requireVerifiedUser,
  type AuthUser,
} from "@/lib/auth";
import { BKKH_TIME_SLOTS, type BkkhActivityField } from "@/lib/bkkh";
import { computeReportEntries, dateKeyToDb, getCurrentPeriod, toDateKey } from "@/lib/lms";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: boolean; message?: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNullableString(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue || null;
}

function canEditAssignedCourse(user: AuthUser, teacherId: string | null) {
  return teacherId === user.id;
}

async function isValidTeachingStaff(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { in: [UserRole.TEACHER, UserRole.HOMEROOM] },
      status: UserStatus.VERIFIED,
    },
    select: { id: true },
  });
  return Boolean(user);
}

async function hasAssignedCourses(userId: string) {
  const assignedCourses = await prisma.course.count({
    where: { teacherId: userId, deletedAt: null },
  });
  return assignedCourses > 0;
}

function revalidateCourseAreas(courseId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/mapel");
  revalidatePath("/nilai");
  revalidatePath("/absen");
  if (courseId) revalidatePath(`/mapel/${courseId}`);
}

/* ----------------------------- course (admin) ------------------------------ */

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "");
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!title || !description || !teacherId || !Object.values(CourseStatus).includes(status) || !(await isValidTeachingStaff(teacherId))) {
    redirect("/mapel?error=invalid");
  }

  const baseSlug = slugify(title) || `course-${Date.now()}`;
  const existing = await prisma.course.findUnique({ where: { slug: baseSlug }, select: { id: true } });

  await prisma.course.create({
    data: { title, slug: existing ? `${baseSlug}-${Date.now()}` : baseSlug, description, status, createdById: admin.id, teacherId },
  });

  revalidateCourseAreas();
}

export async function updateCourseAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "");
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!courseId || !title || !description || !teacherId || !Object.values(CourseStatus).includes(status) || !(await isValidTeachingStaff(teacherId))) {
    redirect(`/mapel/${courseId}?error=invalid`);
  }

  await prisma.course.update({ where: { id: courseId }, data: { title, description, status, teacherId } });
  revalidateCourseAreas(courseId);
}

/* --------------------------- enrollment (admin) ---------------------------- */

export async function enrollStudentAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");

  if (!courseId || !studentId) {
    redirect(`/mapel/${courseId}?error=enrollment`);
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: { status: EnrollmentStatus.ACTIVE },
    create: { studentId, courseId, status: EnrollmentStatus.ACTIVE },
  });

  revalidateCourseAreas(courseId);
}

/* ---------------------- attendance (academic staff) ------------------------ */

export async function createAttendanceSessionAction(formData: FormData) {
  const user = await requireAcademicStaff();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const heldAtValue = String(formData.get("heldAt") ?? "");

  if (!courseId || !title || !heldAtValue) {
    redirect(`/absen?course=${courseId}&error=attendance`);
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
  if (!course || !canEditAssignedCourse(user, course.teacherId)) {
    redirect(`/absen?course=${courseId}&error=forbidden`);
  }

  const period = getCurrentPeriod(new Date(heldAtValue));
  const session = await prisma.attendanceSession.create({
    data: { courseId, title, heldAt: new Date(heldAtValue), semester: period.semester, academicYear: period.academicYear },
    select: { id: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: EnrollmentStatus.ACTIVE },
    select: { studentId: true },
  });

  if (enrollments.length > 0) {
    await prisma.attendanceRecord.createMany({
      data: enrollments.map((e) => ({ attendanceSessionId: session.id, studentId: e.studentId, status: AttendanceStatus.PRESENT })),
      skipDuplicates: true,
    });
  }

  revalidateCourseAreas(courseId);
}

export async function setAttendanceStatusAction(input: {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
}): Promise<ActionResult> {
  const user = await requireAcademicStaff();
  if (!input.sessionId || !input.studentId || !Object.values(AttendanceStatus).includes(input.status)) {
    return { ok: false, message: "Data absensi tidak valid." };
  }
  const session = await prisma.attendanceSession.findUnique({
    where: { id: input.sessionId },
    select: {
      course: {
        select: {
          teacherId: true,
          enrollments: {
            where: { studentId: input.studentId, status: EnrollmentStatus.ACTIVE },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!session || !canEditAssignedCourse(user, session.course.teacherId)) {
    return { ok: false, message: "Anda tidak ditugaskan pada mata pelajaran ini." };
  }
  if (session.course.enrollments.length === 0) {
    return { ok: false, message: "Santri tidak terdaftar pada mata pelajaran ini." };
  }
  await prisma.attendanceRecord.upsert({
    where: { attendanceSessionId_studentId: { attendanceSessionId: input.sessionId, studentId: input.studentId } },
    update: { status: input.status },
    create: { attendanceSessionId: input.sessionId, studentId: input.studentId, status: input.status },
  });
  revalidatePath("/absen");
  return { ok: true };
}

export async function markAllPresentAction(sessionId: string): Promise<ActionResult> {
  const user = await requireAcademicStaff();
  if (!sessionId) return { ok: false, message: "Sesi tidak ditemukan." };
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { course: { select: { teacherId: true } } },
  });
  if (!session || !canEditAssignedCourse(user, session.course.teacherId)) {
    return { ok: false, message: "Anda tidak ditugaskan pada mata pelajaran ini." };
  }
  await prisma.attendanceRecord.updateMany({
    where: { attendanceSessionId: sessionId },
    data: { status: AttendanceStatus.PRESENT },
  });
  revalidatePath("/absen");
  return { ok: true };
}

/* ------------------------- grades (academic staff) ------------------------- */

export async function createGradeItemAction(formData: FormData) {
  const user = await requireAcademicStaff();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = toNullableString(formData.get("description"));
  const maxScore = Number(formData.get("maxScore") ?? 100);
  const dueValue = String(formData.get("dueAt") ?? "");

  if (!courseId || !title || !Number.isFinite(maxScore) || maxScore < 1) {
    redirect(`/nilai?course=${courseId}&error=grade`);
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
  if (!course || !canEditAssignedCourse(user, course.teacherId)) {
    redirect(`/nilai?course=${courseId}&error=forbidden`);
  }

  const period = getCurrentPeriod();
  await prisma.gradeItem.create({
    data: {
      courseId,
      title,
      description,
      maxScore,
      dueAt: dueValue ? new Date(dueValue) : null,
      semester: period.semester,
      academicYear: period.academicYear,
    },
  });

  revalidateCourseAreas(courseId);
}

export async function saveGradeAction(input: {
  gradeItemId: string;
  studentId: string;
  value: number; // 0-100 display value
}): Promise<ActionResult> {
  const user = await requireAcademicStaff();
  const item = await prisma.gradeItem.findUnique({
    where: { id: input.gradeItemId },
    select: {
      maxScore: true,
      course: {
        select: {
          teacherId: true,
          enrollments: {
            where: { studentId: input.studentId, status: EnrollmentStatus.ACTIVE },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!item || !input.studentId || !Number.isFinite(input.value)) {
    return { ok: false, message: "Data nilai tidak valid." };
  }
  if (!canEditAssignedCourse(user, item.course.teacherId)) {
    return { ok: false, message: "Anda tidak ditugaskan pada mata pelajaran ini." };
  }
  if (item.course.enrollments.length === 0) {
    return { ok: false, message: "Santri tidak terdaftar pada mata pelajaran ini." };
  }
  const clamped = Math.max(0, Math.min(100, Math.round(input.value)));
  const score = Math.round((clamped / 100) * item.maxScore);
  await prisma.gradeRecord.upsert({
    where: { gradeItemId_studentId: { gradeItemId: input.gradeItemId, studentId: input.studentId } },
    update: { score },
    create: { gradeItemId: input.gradeItemId, studentId: input.studentId, score },
  });
  revalidatePath("/nilai");
  return { ok: true };
}

/* ----------------------- schedule (teacher/admin) -------------------------- */

export async function createScheduleSlotAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? -1);
  const startTime = String(formData.get("startTime") ?? "").trim().replace(".", ":");
  const room = toNullableString(formData.get("room"));

  if (!courseId || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    redirect("/jadwal?error=invalid");
  }

  await prisma.scheduleSlot.create({ data: { courseId, dayOfWeek, startTime, room } });
  revalidatePath("/jadwal");
  revalidatePath("/dashboard");
}

export async function deleteScheduleSlotAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { ok: false, message: "Jadwal tidak ditemukan." };
  await prisma.scheduleSlot.delete({ where: { id } });
  revalidatePath("/jadwal");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ----------------------- report card (teacher/admin) ----------------------- */

export async function generateReportCardAction(input: {
  studentId: string;
  semester: Semester;
  academicYear: string;
}): Promise<ActionResult> {
  const user = await requireHomeroom();
  const academicYear = input.academicYear.trim();
  if (!input.studentId || !Object.values(Semester).includes(input.semester) || !/^\d{4}\/\d{4}$/.test(academicYear)) {
    return { ok: false, message: "Data rapor tidak valid." };
  }

  const student = await prisma.studentProfile.findUnique({ where: { id: input.studentId }, select: { id: true } });
  if (!student) return { ok: false, message: "Santri tidak ditemukan." };

  const existing = await prisma.reportCard.findUnique({
    where: {
      studentId_semester_academicYear: { studentId: input.studentId, semester: input.semester, academicYear },
    },
    select: { id: true, status: true },
  });
  if (existing?.status === ReportCardStatus.PUBLISHED) {
    return { ok: false, message: "Rapor periode ini sudah terbit dan tidak bisa dibuat ulang." };
  }

  const entries = await computeReportEntries(input.studentId, { semester: input.semester, academicYear });
  if (entries.length === 0) {
    return { ok: false, message: "Santri belum terdaftar di mata pelajaran mana pun." };
  }

  if (existing) {
    await prisma.$transaction([
      prisma.reportCardEntry.deleteMany({ where: { reportCardId: existing.id } }),
      prisma.reportCardEntry.createMany({ data: entries.map((e) => ({ ...e, reportCardId: existing.id })) }),
      prisma.reportCard.update({ where: { id: existing.id }, data: { createdById: user.id } }),
    ]);
  } else {
    await prisma.reportCard.create({
      data: {
        studentId: input.studentId,
        semester: input.semester,
        academicYear,
        createdById: user.id,
        entries: { createMany: { data: entries } },
      },
    });
  }

  revalidatePath("/rapor");
  return { ok: true };
}

export async function saveHomeroomNoteAction(input: { reportCardId: string; note: string }): Promise<ActionResult> {
  await requireHomeroom();
  if (!input.reportCardId) return { ok: false, message: "Rapor tidak ditemukan." };

  const card = await prisma.reportCard.findUnique({ where: { id: input.reportCardId }, select: { status: true } });
  if (!card) return { ok: false, message: "Rapor tidak ditemukan." };
  if (card.status === ReportCardStatus.PUBLISHED) {
    return { ok: false, message: "Rapor sudah terbit, catatan tidak bisa diubah." };
  }

  await prisma.reportCard.update({
    where: { id: input.reportCardId },
    data: { homeroomNote: input.note.trim() || null },
  });
  revalidatePath("/rapor");
  return { ok: true };
}

export async function publishReportCardAction(reportCardId: string): Promise<ActionResult> {
  await requireHomeroom();
  if (!reportCardId) return { ok: false, message: "Rapor tidak ditemukan." };

  const card = await prisma.reportCard.findUnique({ where: { id: reportCardId }, select: { status: true } });
  if (!card) return { ok: false, message: "Rapor tidak ditemukan." };
  if (card.status === ReportCardStatus.PUBLISHED) return { ok: false, message: "Rapor sudah terbit." };

  await prisma.reportCard.update({
    where: { id: reportCardId },
    data: { status: ReportCardStatus.PUBLISHED, publishedAt: new Date() },
  });
  revalidatePath("/rapor");
  revalidatePath("/anak");
  return { ok: true };
}

/* ----------------------------- profile (self) ------------------------------ */

export async function updateProfileAction(input: { name: string }): Promise<ActionResult> {
  const user = await requireVerifiedUser();
  const name = input.name.trim();
  if (!name) return { ok: false, message: "Nama wajib diisi." };

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/pengaturan");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* --------------------------- user management (admin) ----------------------- */

export async function setUserStatusAction(userId: string, status: UserStatus): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!userId || !Object.values(UserStatus).includes(status)) {
    return { ok: false, message: "Status tidak valid." };
  }
  if (status !== UserStatus.VERIFIED && (await hasAssignedCourses(userId))) {
    return { ok: false, message: "Alihkan seluruh mata pelajaran yang diampu sebelum mengubah status akun." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      verifiedAt: status === UserStatus.VERIFIED ? new Date() : null,
      verifiedById: status === UserStatus.VERIFIED ? admin.id : null,
    },
  });
  revalidatePath("/pengguna");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createUserAction(input: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<ActionResult> {
  await requireAdmin();
  const name = input.name.trim();
  const email = input.email.toLowerCase().trim();
  if (!name || !email || !Object.values(UserRole).includes(input.role)) {
    return { ok: false, message: "Nama, email, dan peran wajib diisi." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, message: "Email sudah dipakai akun lain." };

  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: input.role,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
    },
  });

  revalidatePath("/pengguna");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateUserAction(input: {
  userId: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}): Promise<ActionResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (
    !input.userId ||
    !name ||
    !Object.values(UserRole).includes(input.role) ||
    !Object.values(UserStatus).includes(input.status)
  ) {
    return { ok: false, message: "Data pengguna tidak valid." };
  }

  const remainsVerifiedTeachingStaff =
    input.status === UserStatus.VERIFIED &&
    (input.role === UserRole.TEACHER || input.role === UserRole.HOMEROOM);
  if (!remainsVerifiedTeachingStaff && (await hasAssignedCourses(input.userId))) {
    return { ok: false, message: "Alihkan seluruh mata pelajaran yang diampu sebelum mengubah role atau status akun." };
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: { name, role: input.role, status: input.status },
  });
  revalidatePath("/pengguna");
  return { ok: true };
}

/* ---------------------- announcements (teacher/admin) ---------------------- */

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireAnnouncementManager();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "");
  const level = Object.values(EducationLevel).includes(levelRaw as EducationLevel) ? (levelRaw as EducationLevel) : null;
  const pinned = formData.get("pinned") === "on";

  if (!title || !body) {
    redirect("/informasi?error=invalid");
  }

  await prisma.announcement.create({ data: { title, body, level, pinned, authorId: user.id } });
  revalidatePath("/informasi");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResult> {
  await requireAnnouncementManager();
  if (!id) return { ok: false, message: "Informasi tidak ditemukan." };
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/informasi");
  return { ok: true };
}

/* ----------------------- admissions review (admin) ------------------------- */

export async function reviewAdmissionAction(input: {
  admissionId: string;
  decision: "ACCEPTED" | "REJECTED";
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const adm = await prisma.admission.findUnique({ where: { id: input.admissionId } });
  if (!adm) return { ok: false, message: "Pendaftaran tidak ditemukan." };
  if (adm.status !== AdmissionStatus.PENDING) return { ok: false, message: "Pendaftaran sudah diproses." };

  if (input.decision === "REJECTED") {
    await prisma.admission.update({
      where: { id: adm.id },
      data: { status: AdmissionStatus.REJECTED, reviewedAt: new Date(), reviewedById: admin.id },
    });
    revalidatePath("/penerimaan");
    return { ok: true };
  }

  const parentEmail = adm.parentEmail.toLowerCase().trim();

  let parent = adm.submitterId
    ? await prisma.user.findUnique({ where: { id: adm.submitterId }, select: { id: true, role: true } })
    : await prisma.user.findUnique({ where: { email: parentEmail }, select: { id: true, role: true } });
  if (!parent) {
    const passwordHash = await bcrypt.hash("password123", 12);
    parent = await prisma.user.create({
      data: {
        name: adm.parentName,
        email: parentEmail,
        phone: adm.parentPhone,
        passwordHash,
        role: UserRole.PARENT,
        status: UserStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
      select: { id: true, role: true },
    });
  } else {
    if (parent.role !== UserRole.PARENT) {
      return { ok: false, message: "Email sudah dipakai akun non-wali. Gunakan email wali yang berbeda." };
    }
    await prisma.user.update({
      where: { id: parent.id },
      data: { name: adm.parentName, phone: adm.parentPhone, status: UserStatus.VERIFIED, verifiedAt: new Date(), verifiedById: admin.id },
    });
  }

  const studentNumber = `${adm.level}-${Date.now().toString().slice(-6)}`;
  const student = await prisma.studentProfile.create({
    data: {
      name: adm.childName,
      level: adm.level,
      studentNumber,
      className: `${adm.level}-1`,
      parentId: parent.id,
      address: adm.address,
    },
    select: { id: true },
  });

  await prisma.admission.update({
    where: { id: adm.id },
    data: {
      status: AdmissionStatus.ACCEPTED,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      createdParentId: parent.id,
      createdStudentId: student.id,
    },
  });

  revalidatePath("/penerimaan");
  revalidatePath("/pengguna");
  revalidatePath("/anak");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!userId) return { ok: false, message: "Pengguna tidak ditemukan." };
  if (userId === admin.id) return { ok: false, message: "Tidak bisa menghapus akun sendiri." };
  if (await hasAssignedCourses(userId)) {
    return { ok: false, message: "Alihkan seluruh mata pelajaran yang diampu sebelum menghapus akun." };
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/pengguna");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* --------------------------- absensi ustadz -------------------------------- */

export async function saveStaffAttendanceAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const teacherId = String(formData.get("teacherId") ?? "");
  const dateKey = String(formData.get("date") ?? "");
  const statusRaw = String(formData.get("status") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Object.values(AttendanceStatus).includes(statusRaw as AttendanceStatus)) {
    redirect("/absen-ustadz?error=invalid");
  }

  const isSelfToday =
    (user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM) &&
    teacherId === user.id &&
    dateKey === toDateKey(new Date());
  if (user.role !== UserRole.ADMIN && !isSelfToday) {
    redirect("/absen-ustadz?error=forbidden");
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: { in: [UserRole.TEACHER, UserRole.HOMEROOM] } },
    select: { id: true },
  });
  if (!teacher) redirect("/absen-ustadz?error=invalid");

  const status = statusRaw as AttendanceStatus;
  const date = dateKeyToDb(dateKey);
  await prisma.staffAttendance.upsert({
    where: { teacherId_date: { teacherId, date } },
    update: { status, recordedById: user.id },
    create: { teacherId, date, status, recordedById: user.id },
  });

  revalidatePath("/absen-ustadz");
  redirect(`/absen-ustadz?tanggal=${dateKey}`);
}

/* ------------------------- BKKH (laporan harian) ---------------------------- */

export async function saveBkkhReportAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const teacherId = String(formData.get("teacherId") ?? "");
  const dateKey = String(formData.get("date") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    redirect("/absen-ustadz?error=invalid");
  }

  const isSelfToday =
    (user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM) &&
    teacherId === user.id &&
    dateKey === toDateKey(new Date());
  if (!isSelfToday) {
    redirect("/absen-ustadz?error=forbidden");
  }

  const assignment = String(formData.get("assignment") ?? "").trim();
  const activities = Object.fromEntries(
    BKKH_TIME_SLOTS.map(({ field }) => [field, String(formData.get(field) ?? "").trim() || null]),
  ) as Record<BkkhActivityField, string | null>;

  if (!assignment || assignment.length > 120) {
    redirect(`/absen-ustadz?tanggal=${dateKey}&error=assignment`);
  }
  if (Object.values(activities).every((value) => value === null)) {
    redirect(`/absen-ustadz?tanggal=${dateKey}&error=activity`);
  }
  if (Object.values(activities).some((value) => (value?.length ?? 0) > 2000)) {
    redirect(`/absen-ustadz?tanggal=${dateKey}&error=invalid`);
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: { in: [UserRole.TEACHER, UserRole.HOMEROOM] } },
    select: { id: true },
  });
  if (!teacher) redirect("/absen-ustadz?error=invalid");

  const date = dateKeyToDb(dateKey);
  await prisma.bkkhReport.upsert({
    where: { teacherId_date: { teacherId, date } },
    update: { assignment, ...activities },
    create: { teacherId, date, assignment, ...activities },
  });

  revalidatePath("/absen-ustadz");
  redirect(`/absen-ustadz?tanggal=${dateKey}&success=bkkh`);
}
