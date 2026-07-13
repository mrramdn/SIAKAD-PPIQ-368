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
  LessonType,
  ReportCardStatus,
  Semester,
  UserRole,
  UserStatus,
} from "@/generated/prisma/client";
import { requireAdmin, requireTeacherOrAdmin, requireVerifiedUser } from "@/lib/auth";
import { computeReportEntries, getCurrentPeriod } from "@/lib/lms";
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

function revalidateCourseAreas(courseId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/learning");
  revalidatePath("/nilai");
  revalidatePath("/absen");
  if (courseId) revalidatePath(`/learning/${courseId}`);
}

/* ----------------------------- course (admin) ------------------------------ */

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!title || !description || !Object.values(CourseStatus).includes(status)) {
    redirect("/learning?error=invalid");
  }

  const baseSlug = slugify(title) || `course-${Date.now()}`;
  const existing = await prisma.course.findUnique({ where: { slug: baseSlug }, select: { id: true } });

  await prisma.course.create({
    data: { title, slug: existing ? `${baseSlug}-${Date.now()}` : baseSlug, description, status, createdById: admin.id },
  });

  revalidateCourseAreas();
}

export async function updateCourseAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!courseId || !title || !description || !Object.values(CourseStatus).includes(status)) {
    redirect(`/learning/${courseId}?error=invalid`);
  }

  await prisma.course.update({ where: { id: courseId }, data: { title, description, status } });
  revalidateCourseAreas(courseId);
}

/* -------------------------- lesson (teacher/admin) ------------------------- */

export async function createLessonAction(formData: FormData) {
  await requireTeacherOrAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = toNullableString(formData.get("description"));
  const duration = toNullableString(formData.get("duration"));
  const content = toNullableString(formData.get("content"));
  const typeValue = String(formData.get("type") ?? LessonType.TEXT) as LessonType;
  const type = Object.values(LessonType).includes(typeValue) ? typeValue : LessonType.TEXT;
  const order = Number(formData.get("order") ?? 0);

  if (!courseId || !title || !Number.isFinite(order) || order < 1) {
    redirect(`/learning/${courseId}?error=lesson`);
  }

  await prisma.lesson.upsert({
    where: { courseId_order: { courseId, order } },
    update: { title, description, content, duration, type },
    create: { courseId, title, description, content, duration, type, order },
  });

  revalidatePath(`/learning/${courseId}`);
}

/* --------------------------- enrollment (admin) ---------------------------- */

export async function enrollStudentAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");

  if (!courseId || !studentId) {
    redirect(`/learning/${courseId}?error=enrollment`);
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: { status: EnrollmentStatus.ACTIVE },
    create: { studentId, courseId, status: EnrollmentStatus.ACTIVE },
  });

  revalidateCourseAreas(courseId);
}

/* ----------------------- attendance (teacher/admin) ------------------------ */

export async function createAttendanceSessionAction(formData: FormData) {
  await requireTeacherOrAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const heldAtValue = String(formData.get("heldAt") ?? "");

  if (!courseId || !title || !heldAtValue) {
    redirect(`/absen?course=${courseId}&error=attendance`);
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
  await requireTeacherOrAdmin();
  if (!input.sessionId || !input.studentId || !Object.values(AttendanceStatus).includes(input.status)) {
    return { ok: false, message: "Data absensi tidak valid." };
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
  await requireTeacherOrAdmin();
  if (!sessionId) return { ok: false, message: "Sesi tidak ditemukan." };
  await prisma.attendanceRecord.updateMany({
    where: { attendanceSessionId: sessionId },
    data: { status: AttendanceStatus.PRESENT },
  });
  revalidatePath("/absen");
  return { ok: true };
}

/* -------------------------- grades (teacher/admin) ------------------------- */

export async function createGradeItemAction(formData: FormData) {
  await requireTeacherOrAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = toNullableString(formData.get("description"));
  const maxScore = Number(formData.get("maxScore") ?? 100);
  const dueValue = String(formData.get("dueAt") ?? "");

  if (!courseId || !title || !Number.isFinite(maxScore) || maxScore < 1) {
    redirect(`/nilai?course=${courseId}&error=grade`);
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
  await requireTeacherOrAdmin();
  const item = await prisma.gradeItem.findUnique({ where: { id: input.gradeItemId }, select: { maxScore: true } });
  if (!item || !input.studentId || !Number.isFinite(input.value)) {
    return { ok: false, message: "Data nilai tidak valid." };
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
  await requireTeacherOrAdmin();
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
  await requireTeacherOrAdmin();
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
  const user = await requireTeacherOrAdmin();
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
  await requireTeacherOrAdmin();
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
  await requireTeacherOrAdmin();
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
  if (!input.userId || !name) return { ok: false, message: "Nama wajib diisi." };

  await prisma.user.update({
    where: { id: input.userId },
    data: { name, role: input.role, status: input.status },
  });
  revalidatePath("/pengguna");
  return { ok: true };
}

/* ---------------------- announcements (teacher/admin) ---------------------- */

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireTeacherOrAdmin();
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
  await requireTeacherOrAdmin();
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
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/pengguna");
  revalidatePath("/dashboard");
  return { ok: true };
}
