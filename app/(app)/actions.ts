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
  UserRole,
  UserStatus,
} from "@/generated/prisma/client";
import { requireAdmin, requireTeacherOrAdmin, requireVerifiedUser } from "@/lib/auth";
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
  const userId = String(formData.get("userId") ?? "");

  if (!courseId || !userId) {
    redirect(`/learning/${courseId}?error=enrollment`);
  }

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { status: EnrollmentStatus.ACTIVE },
    create: { userId, courseId, status: EnrollmentStatus.ACTIVE },
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

  const session = await prisma.attendanceSession.create({
    data: { courseId, title, heldAt: new Date(heldAtValue) },
    select: { id: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: EnrollmentStatus.ACTIVE },
    select: { userId: true },
  });

  if (enrollments.length > 0) {
    await prisma.attendanceRecord.createMany({
      data: enrollments.map((e) => ({ attendanceSessionId: session.id, userId: e.userId, status: AttendanceStatus.PRESENT })),
      skipDuplicates: true,
    });
  }

  revalidateCourseAreas(courseId);
}

export async function setAttendanceStatusAction(input: {
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
}): Promise<ActionResult> {
  await requireTeacherOrAdmin();
  if (!input.sessionId || !input.userId || !Object.values(AttendanceStatus).includes(input.status)) {
    return { ok: false, message: "Data absensi tidak valid." };
  }
  await prisma.attendanceRecord.upsert({
    where: { attendanceSessionId_userId: { attendanceSessionId: input.sessionId, userId: input.userId } },
    update: { status: input.status },
    create: { attendanceSessionId: input.sessionId, userId: input.userId, status: input.status },
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

  await prisma.gradeItem.create({
    data: { courseId, title, description, maxScore, dueAt: dueValue ? new Date(dueValue) : null },
  });

  revalidateCourseAreas(courseId);
}

export async function saveGradeAction(input: {
  gradeItemId: string;
  userId: string;
  value: number; // 0-100 display value
}): Promise<ActionResult> {
  await requireTeacherOrAdmin();
  const item = await prisma.gradeItem.findUnique({ where: { id: input.gradeItemId }, select: { maxScore: true } });
  if (!item || !input.userId || !Number.isFinite(input.value)) {
    return { ok: false, message: "Data nilai tidak valid." };
  }
  const clamped = Math.max(0, Math.min(100, Math.round(input.value)));
  const score = Math.round((clamped / 100) * item.maxScore);
  await prisma.gradeRecord.upsert({
    where: { gradeItemId_userId: { gradeItemId: input.gradeItemId, userId: input.userId } },
    update: { score },
    create: { gradeItemId: input.gradeItemId, userId: input.userId, score },
  });
  revalidatePath("/nilai");
  return { ok: true };
}

/* --------------------------- progress (student) ---------------------------- */

export async function markLessonProgressAction(courseId: string, progress: number): Promise<ActionResult> {
  const user = await requireVerifiedUser();
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const updated = await prisma.enrollment.updateMany({
    where: { userId: user.id, courseId },
    data: { progress: clamped, ...(clamped >= 100 ? { status: EnrollmentStatus.COMPLETED, completedAt: new Date() } : { status: EnrollmentStatus.ACTIVE }) },
  });
  if (updated.count === 0) return { ok: false, message: "Kamu belum terdaftar di kelas ini." };
  revalidatePath(`/learning/${courseId}`);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ----------------------------- profile (self) ------------------------------ */

export async function updateProfileAction(input: { name: string; phone?: string }): Promise<ActionResult> {
  const user = await requireVerifiedUser();
  const name = input.name.trim();
  if (!name) return { ok: false, message: "Nama wajib diisi." };

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  if (user.role === UserRole.STUDENT) {
    await prisma.studentProfile.updateMany({ where: { userId: user.id }, data: { phone: input.phone?.trim() || null } });
  }
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
  className?: string;
  studentNumber?: string;
  level?: EducationLevel;
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
  const isStudent = input.role === UserRole.STUDENT;
  const level = input.level && Object.values(EducationLevel).includes(input.level) ? input.level : EducationLevel.SMP;
  const studentNumber = (input.studentNumber?.trim() || `SIS-${Date.now().toString().slice(-6)}`).toUpperCase();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: input.role,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
      ...(isStudent
        ? { profile: { create: { level, studentNumber, className: input.className?.trim() || "-" } } }
        : {}),
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
  className?: string;
  level?: EducationLevel;
}): Promise<ActionResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (!input.userId || !name) return { ok: false, message: "Nama wajib diisi." };

  await prisma.user.update({
    where: { id: input.userId },
    data: { name, role: input.role, status: input.status },
  });
  if (input.role === UserRole.STUDENT) {
    const data: { className?: string; level?: EducationLevel } = {};
    if (input.className !== undefined) data.className = input.className.trim() || "-";
    if (input.level && Object.values(EducationLevel).includes(input.level)) data.level = input.level;
    if (Object.keys(data).length) await prisma.studentProfile.updateMany({ where: { userId: input.userId }, data });
  }
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

  const passwordHash = await bcrypt.hash("password123", 12);
  const parentEmail = adm.parentEmail.toLowerCase().trim();

  let parent = await prisma.user.findUnique({ where: { email: parentEmail }, select: { id: true, role: true } });
  if (!parent) {
    parent = await prisma.user.create({
      data: {
        name: adm.parentName,
        email: parentEmail,
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
      data: { name: adm.parentName, status: UserStatus.VERIFIED, verifiedAt: new Date(), verifiedById: admin.id },
    });
  }

  const studentEmail = `santri.${Date.now().toString(36)}@pesantren.local`;
  const studentNumber = `${adm.level}-${Date.now().toString().slice(-6)}`;
  const student = await prisma.user.create({
    data: {
      name: adm.childName,
      email: studentEmail,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
      profile: {
        create: {
          level: adm.level,
          studentNumber,
          className: `${adm.level}-1`,
          parentId: parent.id,
          address: adm.address,
        },
      },
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
