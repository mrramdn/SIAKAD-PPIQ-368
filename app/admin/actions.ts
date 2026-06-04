"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AttendanceStatus, CourseStatus, EnrollmentStatus, UserRole, UserStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function updateUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "") as UserStatus;

  if (!userId || !Object.values(UserStatus).includes(status)) {
    redirect("/admin/users?error=invalid");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      verifiedAt: status === UserStatus.VERIFIED ? new Date() : null,
      verifiedById: status === UserStatus.VERIFIED ? admin.id : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
}

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!title || !description || !Object.values(CourseStatus).includes(status)) {
    redirect("/admin/courses?error=invalid");
  }

  const baseSlug = slugify(title);
  const slug = baseSlug || `course-${Date.now()}`;
  const existingCourse = await prisma.course.findUnique({ where: { slug }, select: { id: true } });

  await prisma.course.create({
    data: {
      title,
      slug: existingCourse ? `${slug}-${Date.now()}` : slug,
      description,
      status,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
}

export async function updateCourseAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? CourseStatus.PUBLISHED) as CourseStatus;

  if (!courseId || !title || !description || !Object.values(CourseStatus).includes(status)) {
    redirect("/admin/courses?error=invalid");
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { title, description, status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = toNullableString(formData.get("description"));
  const content = toNullableString(formData.get("content"));
  const order = Number(formData.get("order") ?? 0);

  if (!courseId || !title || !Number.isFinite(order) || order < 1) {
    redirect(`/admin/courses/${courseId}?error=lesson`);
  }

  await prisma.lesson.upsert({
    where: { courseId_order: { courseId, order } },
    update: { title, description, content },
    create: { courseId, title, description, content, order },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function enrollStudentAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!courseId || !userId) {
    redirect(`/admin/courses/${courseId}?error=enrollment`);
  }

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { status: EnrollmentStatus.ACTIVE },
    create: { userId, courseId, status: EnrollmentStatus.ACTIVE },
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createAttendanceSessionAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const heldAtValue = String(formData.get("heldAt") ?? "");

  if (!courseId || !title || !heldAtValue) {
    redirect(`/admin/courses/${courseId}?error=attendance`);
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
      data: enrollments.map((enrollment) => ({
        attendanceSessionId: session.id,
        userId: enrollment.userId,
        status: AttendanceStatus.PRESENT,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateAttendanceRecordAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const attendanceSessionId = String(formData.get("attendanceSessionId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? AttendanceStatus.PRESENT) as AttendanceStatus;
  const note = toNullableString(formData.get("note"));

  if (!courseId || !attendanceSessionId || !userId || !Object.values(AttendanceStatus).includes(status)) {
    redirect(`/admin/courses/${courseId}?error=attendance`);
  }

  await prisma.attendanceRecord.upsert({
    where: { attendanceSessionId_userId: { attendanceSessionId, userId } },
    update: { status, note },
    create: { attendanceSessionId, userId, status, note },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createGradeItemAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = toNullableString(formData.get("description"));
  const maxScore = Number(formData.get("maxScore") ?? 100);

  if (!courseId || !title || !Number.isFinite(maxScore) || maxScore < 1) {
    redirect(`/admin/courses/${courseId}?error=grade`);
  }

  await prisma.gradeItem.create({
    data: { courseId, title, description, maxScore },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function upsertGradeRecordAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const gradeItemId = String(formData.get("gradeItemId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const feedback = toNullableString(formData.get("feedback"));

  if (!courseId || !gradeItemId || !userId || !Number.isFinite(score) || score < 0) {
    redirect(`/admin/courses/${courseId}?error=grade`);
  }

  await prisma.gradeRecord.upsert({
    where: { gradeItemId_userId: { gradeItemId, userId } },
    update: { score, feedback },
    create: { gradeItemId, userId, score, feedback },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}
