import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { AttendanceStatus, UserRole, UserStatus } from "../generated/prisma/client";
import { SESSION_COOKIE } from "../lib/auth";
import { prisma } from "../lib/prisma";

type ActionManifest = {
  node: Record<string, { exportedName: string }>;
};

const port = Number(process.env.ROLE_QA_PORT ?? 3100);
const baseUrl = process.env.ROLE_QA_BASE_URL ?? `http://127.0.0.1:${port}`;

function sessionHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The production server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server QA tidak siap di ${baseUrl}`);
}

async function ensureServer() {
  try {
    const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
    if (response.status < 500) return null;
  } catch {
    // Start a local production server below.
  }

  const child = spawn(
    process.execPath,
    [resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    },
  );
  await waitForServer();
  return child;
}

async function createQaSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sessionHash(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    select: { id: true },
  });
  return { id: session.id, cookie: `${SESSION_COOKIE}=${token}` };
}

async function invokeAction(actionId: string, path: string, cookie: string, input: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      Accept: "text/x-component",
      "Content-Type": "text/plain;charset=UTF-8",
      Cookie: cookie,
      Origin: baseUrl,
      "Next-Action": actionId,
    },
    body: JSON.stringify([input]),
  });
  const body = await response.text();
  assert.ok(response.status < 500, `Action ${path} gagal dengan HTTP ${response.status}: ${body}`);
  return body;
}

async function main() {
  const server: ChildProcess | null = await ensureServer();
  const manifest = JSON.parse(
    await readFile(".next/server/server-reference-manifest.json", "utf8"),
  ) as ActionManifest;
  const actionId = (name: string) => {
    const entry = Object.entries(manifest.node).find(([, value]) => value.exportedName === name);
    assert.ok(entry, `Server action ${name} tidak ditemukan pada build manifest.`);
    return entry[0];
  };

  const [admin, homeroom, mudir] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { email: "admin@pesantren.id" },
      select: { id: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { email: "walikelas@pesantren.id" },
      select: { id: true, name: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { email: "mudir@pesantren.id" },
      select: { id: true },
    }),
  ]);

  const [assignedCourse, foreignCourse] = await Promise.all([
    prisma.course.findFirstOrThrow({
      where: { teacherId: homeroom.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        gradeItems: { take: 1, select: { id: true } },
        attendanceSessions: { take: 1, select: { id: true } },
      },
    }),
    prisma.course.findFirstOrThrow({
      where: { teacherId: { not: homeroom.id }, deletedAt: null },
      select: {
        id: true,
        title: true,
        gradeItems: { take: 1, select: { id: true } },
        attendanceSessions: { take: 1, select: { id: true } },
      },
    }),
  ]);
  assert.ok(assignedCourse.gradeItems[0] && assignedCourse.attendanceSessions[0]);
  assert.ok(foreignCourse.gradeItems[0] && foreignCourse.attendanceSessions[0]);

  const qaSuffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
  const [unenrolledStudent, foreignStudent] = await Promise.all([
    prisma.studentProfile.create({
      data: { name: "QA Tidak Terdaftar", studentNumber: `QA-U-${qaSuffix}`, className: "QA" },
      select: { id: true },
    }),
    prisma.studentProfile.create({
      data: {
        name: "QA Mapel Lain",
        studentNumber: `QA-F-${qaSuffix}`,
        className: "QA",
        enrollments: { create: { courseId: foreignCourse.id } },
      },
      select: { id: true },
    }),
  ]);
  const [adminSession, homeroomSession, mudirSession] = await Promise.all([
    createQaSession(admin.id),
    createQaSession(homeroom.id),
    createQaSession(mudir.id),
  ]);

  try {
    const gradeAction = actionId("saveGradeAction");
    const attendanceAction = actionId("setAttendanceStatusAction");
    const updateUserAction = actionId("updateUserAction");

    const mudirDashboard = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: mudirSession.cookie },
      redirect: "manual",
    });
    const mudirDashboardHtml = await mudirDashboard.text();
    assert.equal(mudirDashboard.status, 200);
    assert.ok(mudirDashboardHtml.includes("Pengawasan ustadz hari ini"));
    assert.ok(mudirDashboardHtml.includes("Perlu ditindaklanjuti"));
    assert.ok(mudirDashboardHtml.includes("Pengawasan akademik"));

    const nilaiPage = await fetch(`${baseUrl}/nilai`, {
      headers: { Cookie: homeroomSession.cookie },
      redirect: "manual",
    });
    const nilaiHtml = await nilaiPage.text();
    assert.equal(nilaiPage.status, 200);
    assert.ok(nilaiHtml.includes(assignedCourse.title), "Mapel Wali Kelas yang ditugaskan tidak tampil.");
    assert.ok(!nilaiHtml.includes(foreignCourse.title), "Wali Kelas masih melihat mapel yang tidak ditugaskan.");

    const foreignDetail = await fetch(`${baseUrl}/mapel/${foreignCourse.id}`, {
      headers: { Cookie: homeroomSession.cookie },
      redirect: "manual",
    });
    assert.equal(foreignDetail.status, 404, "Detail mapel asing tidak ditolak untuk Wali Kelas.");

    const reportPage = await fetch(`${baseUrl}/rapor`, {
      headers: { Cookie: homeroomSession.cookie },
      redirect: "manual",
    });
    assert.equal(reportPage.status, 200, "Akses rapor Wali Kelas ikut terblokir.");

    const foreignGradeResponse = await invokeAction(gradeAction, "/nilai", homeroomSession.cookie, {
      gradeItemId: foreignCourse.gradeItems[0].id,
      studentId: foreignStudent.id,
      value: 77,
    });
    assert.ok(foreignGradeResponse.includes("tidak ditugaskan"));

    const foreignAttendanceResponse = await invokeAction(attendanceAction, "/absen", homeroomSession.cookie, {
      sessionId: foreignCourse.attendanceSessions[0].id,
      studentId: foreignStudent.id,
      status: AttendanceStatus.PRESENT,
    });
    assert.ok(foreignAttendanceResponse.includes("tidak ditugaskan"));

    const unenrolledGradeResponse = await invokeAction(gradeAction, "/nilai", homeroomSession.cookie, {
      gradeItemId: assignedCourse.gradeItems[0].id,
      studentId: unenrolledStudent.id,
      value: 88,
    });
    assert.ok(unenrolledGradeResponse.includes("tidak terdaftar"));

    const unenrolledAttendanceResponse = await invokeAction(attendanceAction, "/absen", homeroomSession.cookie, {
      sessionId: assignedCourse.attendanceSessions[0].id,
      studentId: unenrolledStudent.id,
      status: AttendanceStatus.PRESENT,
    });
    assert.ok(unenrolledAttendanceResponse.includes("tidak terdaftar"));

    const userUpdateResponse = await invokeAction(updateUserAction, "/pengguna", adminSession.cookie, {
      userId: homeroom.id,
      name: homeroom.name,
      role: UserRole.MUDIR,
      status: UserStatus.VERIFIED,
    });
    assert.ok(userUpdateResponse.includes("Alihkan seluruh mata pelajaran"));

    const [forgedGrades, forgedAttendance, homeroomAfter] = await Promise.all([
      prisma.gradeRecord.count({
        where: { studentId: { in: [unenrolledStudent.id, foreignStudent.id] } },
      }),
      prisma.attendanceRecord.count({
        where: { studentId: { in: [unenrolledStudent.id, foreignStudent.id] } },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: homeroom.id },
        select: { role: true, status: true },
      }),
    ]);
    assert.equal(forgedGrades, 0, "Forged grade action sempat menulis record.");
    assert.equal(forgedAttendance, 0, "Forged attendance action sempat menulis record.");
    assert.equal(homeroomAfter.role, UserRole.HOMEROOM);
    assert.equal(homeroomAfter.status, UserStatus.VERIFIED);

    console.log(
      "Role QA passed: Mudir dashboard, assigned-course scope, report access, forged writes, and assignee account protection.",
    );
  } finally {
    await prisma.user.update({
      where: { id: homeroom.id },
      data: { role: UserRole.HOMEROOM, status: UserStatus.VERIFIED },
    });
    await prisma.session.deleteMany({
      where: { id: { in: [adminSession.id, homeroomSession.id, mudirSession.id] } },
    });
    await prisma.studentProfile.deleteMany({
      where: { id: { in: [unenrolledStudent.id, foreignStudent.id] } },
    });
    await prisma.$disconnect();
    server?.kill("SIGTERM");
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
