import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  AttendanceStatus,
  CourseStatus,
  EnrollmentStatus,
  LessonType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const courses = [
  {
    title: "Dasar Penggunaan LMS",
    slug: "dasar-penggunaan-lms",
    description: "Panduan awal untuk memahami alur belajar, materi, dan progres di platform LMS.",
    lessons: [
      {
        title: "Mengenal Dashboard Belajar",
        description: "Pelajari menu utama dan informasi penting di dashboard.",
        content: "Dashboard menampilkan kursus yang sedang diikuti, progres belajar, dan rekomendasi materi berikutnya.",
        type: LessonType.TEXT,
        isPreview: true,
      },
      {
        title: "Mengikuti Materi dan Menandai Progres",
        description: "Cara membaca materi dan menyelesaikan pelajaran.",
        content: "Buka materi secara berurutan, baca instruksi, lalu lanjutkan ke pelajaran berikutnya saat sudah memahami topik.",
        type: LessonType.TEXT,
        isPreview: false,
      },
    ],
  },
  {
    title: "Komunikasi Profesional",
    slug: "komunikasi-profesional",
    description: "Materi ringkas untuk meningkatkan komunikasi tertulis dan lisan di lingkungan kerja atau kelas.",
    lessons: [
      {
        title: "Prinsip Komunikasi Jelas",
        description: "Susun pesan yang singkat, sopan, dan mudah dipahami.",
        content: "Komunikasi yang baik dimulai dari tujuan pesan yang jelas, konteks yang cukup, dan tindak lanjut yang spesifik.",
        type: LessonType.TEXT,
        isPreview: true,
      },
      {
        title: "Memberi dan Menerima Umpan Balik",
        description: "Gunakan feedback untuk memperbaiki hasil belajar dan kerja.",
        content: "Feedback efektif fokus pada perilaku atau hasil kerja, bukan menyerang pribadi.",
        type: LessonType.TEXT,
        isPreview: false,
      },
    ],
  },
  {
    title: "Manajemen Waktu Belajar",
    slug: "manajemen-waktu-belajar",
    description: "Strategi sederhana untuk membuat jadwal belajar yang realistis dan konsisten.",
    lessons: [
      {
        title: "Membuat Prioritas Materi",
        description: "Tentukan materi yang perlu diselesaikan lebih dulu.",
        content: "Urutkan materi berdasarkan deadline, tingkat kesulitan, dan dampaknya terhadap tujuan belajar.",
        type: LessonType.TEXT,
        isPreview: true,
      },
      {
        title: "Rutinitas Belajar Mingguan",
        description: "Bangun kebiasaan belajar dengan waktu yang tetap.",
        content: "Jadwal yang konsisten membantu mengurangi penundaan dan membuat progres lebih mudah dilacak.",
        type: LessonType.TEXT,
        isPreview: false,
      },
    ],
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin LMS", passwordHash, role: UserRole.ADMIN, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: {
      name: "Admin LMS",
      email: "admin@example.com",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.user.upsert({
    where: { email: "teacher@example.com" },
    update: { name: "Guru Demo", passwordHash, role: UserRole.TEACHER, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: {
      name: "Guru Demo",
      email: "teacher@example.com",
      passwordHash,
      role: UserRole.TEACHER,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { name: "User Demo", passwordHash, role: UserRole.STUDENT, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: {
      name: "User Demo",
      email: "user@example.com",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.VERIFIED,
      verifiedAt: new Date(),
      profile: {
        create: {
          studentNumber: "SIS-001",
          className: "XI-A",
          phone: "081234567890",
          address: "Asrama A",
        },
      },
    },
    select: { id: true },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { studentNumber: "SIS-001", className: "XI-A", phone: "081234567890", address: "Asrama A" },
    create: { userId: user.id, studentNumber: "SIS-001", className: "XI-A", phone: "081234567890", address: "Asrama A" },
  });

  await prisma.user.upsert({
    where: { email: "pending@example.com" },
    update: { name: "Siswa Pending", passwordHash, role: UserRole.STUDENT, status: UserStatus.PENDING },
    create: {
      name: "Siswa Pending",
      email: "pending@example.com",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING,
      profile: {
        create: {
          studentNumber: "SIS-002",
          className: "XI-B",
          phone: "081234567891",
          address: "Asrama B",
        },
      },
    },
  });

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: courseData.description,
        status: CourseStatus.PUBLISHED,
        createdById: admin.id,
      },
      create: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        status: CourseStatus.PUBLISHED,
        createdById: admin.id,
      },
      select: { id: true, slug: true },
    });

    await Promise.all(
      courseData.lessons.map((lesson, index) =>
        prisma.lesson.upsert({
          where: { courseId_order: { courseId: course.id, order: index + 1 } },
          update: {
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            type: lesson.type,
            isPreview: lesson.isPreview,
          },
          create: {
            courseId: course.id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            type: lesson.type,
            order: index + 1,
            isPreview: lesson.isPreview,
          },
        }),
      ),
    );

    if (course.slug === "dasar-penggunaan-lms") {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: { progress: 40, status: EnrollmentStatus.ACTIVE },
        create: { userId: user.id, courseId: course.id, progress: 40, status: EnrollmentStatus.ACTIVE },
      });

      const attendanceSession = await prisma.attendanceSession.upsert({
        where: { courseId_title: { courseId: course.id, title: "Pertemuan 1" } },
        update: { heldAt: new Date("2026-06-01T08:00:00.000Z") },
        create: {
          courseId: course.id,
          title: "Pertemuan 1",
          heldAt: new Date("2026-06-01T08:00:00.000Z"),
        },
        select: { id: true },
      });

      await prisma.attendanceRecord.upsert({
        where: { attendanceSessionId_userId: { attendanceSessionId: attendanceSession.id, userId: user.id } },
        update: { status: AttendanceStatus.PRESENT, note: "Hadir tepat waktu" },
        create: {
          attendanceSessionId: attendanceSession.id,
          userId: user.id,
          status: AttendanceStatus.PRESENT,
          note: "Hadir tepat waktu",
        },
      });

      const gradeItem = await prisma.gradeItem.upsert({
        where: { courseId_title: { courseId: course.id, title: "Tugas Awal" } },
        update: { description: "Pengenalan penggunaan LMS", maxScore: 100 },
        create: {
          courseId: course.id,
          title: "Tugas Awal",
          description: "Pengenalan penggunaan LMS",
          maxScore: 100,
        },
        select: { id: true },
      });

      await prisma.gradeRecord.upsert({
        where: { gradeItemId_userId: { gradeItemId: gradeItem.id, userId: user.id } },
        update: { score: 85, feedback: "Pemahaman awal sudah baik." },
        create: { gradeItemId: gradeItem.id, userId: user.id, score: 85, feedback: "Pemahaman awal sudah baik." },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
