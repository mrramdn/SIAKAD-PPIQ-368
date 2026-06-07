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

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DAY = 24 * 60 * 60 * 1000;
const CLASS_NAME = "XI-A";

/* deterministic helpers so reseeding stays stable */
function det(a: number, b: number) {
  return Math.max(55, Math.min(98, Math.round(78 + Math.sin(a * 1.3 + b * 0.7) * 15)));
}
function attStatus(seed: number): AttendanceStatus {
  const r = (Math.sin(seed) + 1) / 2;
  if (r > 0.9) return AttendanceStatus.ABSENT;
  if (r > 0.82) return AttendanceStatus.LATE;
  if (r > 0.74) return AttendanceStatus.EXCUSED;
  return AttendanceStatus.PRESENT;
}

const FIRST = ["Adinda", "Bagas", "Citra", "Dimas", "Elang", "Fitri", "Gilang", "Hana", "Irfan", "Jihan", "Kevin", "Laras", "Maya", "Naufal", "Oki", "Putri", "Raka", "Salsa"];
const LAST = ["Pratama", "Wijaya", "Nugroho", "Anggraini", "Saputra", "Permata", "Maulana", "Kusuma", "Ramadhan", "Safitri", "Hidayat", "Lestari"];

type Teacher = { email: string; name: string };
const teachers: Teacher[] = [
  { email: "teacher@example.com", name: "Sari Wulandari" },
  { email: "budi@example.com", name: "Budi Hartono" },
  { email: "rina@example.com", name: "Rina Marlina" },
];

type CourseDef = {
  title: string;
  slug: string;
  description: string;
  teacherEmail: string;
  schedule: { dayOfWeek: number; startTime: string; room: string }[];
  lessons: { title: string; type: LessonType; duration: string }[];
};

const GRADE_COLS = ["Tugas", "UH 1", "UH 2", "UTS", "Proyek"];

const courses: CourseDef[] = [
  {
    title: "Matematika Dasar",
    slug: "matematika-dasar",
    description: "Trigonometri, limit, dan turunan fungsi aljabar dengan latihan terbimbing.",
    teacherEmail: "teacher@example.com",
    schedule: [
      { dayOfWeek: 1, startTime: "07.30", room: "Ruang 1" },
      { dayOfWeek: 3, startTime: "07.30", room: "Ruang 1" },
    ],
    lessons: [
      { title: "Pengantar Trigonometri", type: LessonType.VIDEO, duration: "12 mnt" },
      { title: "Identitas Trigonometri", type: LessonType.TEXT, duration: "8 mnt" },
      { title: "Aturan Sinus & Cosinus", type: LessonType.VIDEO, duration: "15 mnt" },
      { title: "Latihan Trigonometri", type: LessonType.QUIZ, duration: "20 soal" },
      { title: "Konsep Limit Fungsi", type: LessonType.VIDEO, duration: "18 mnt" },
      { title: "Tugas Portofolio Limit", type: LessonType.ASSIGNMENT, duration: "Tenggat" },
      { title: "Turunan Fungsi Aljabar", type: LessonType.VIDEO, duration: "16 mnt" },
      { title: "Ulangan Harian 2", type: LessonType.QUIZ, duration: "25 soal" },
    ],
  },
  {
    title: "Fisika Pengantar",
    slug: "fisika-pengantar",
    description: "Hukum Newton, usaha dan energi, momentum, serta impuls.",
    teacherEmail: "budi@example.com",
    schedule: [
      { dayOfWeek: 2, startTime: "09.15", room: "Lab Fisika" },
      { dayOfWeek: 4, startTime: "09.15", room: "Lab Fisika" },
    ],
    lessons: [
      { title: "Gerak Lurus Beraturan", type: LessonType.VIDEO, duration: "14 mnt" },
      { title: "Hukum Newton I, II, III", type: LessonType.VIDEO, duration: "20 mnt" },
      { title: "Penerapan Hukum Newton", type: LessonType.TEXT, duration: "11 mnt" },
      { title: "Kuis Dinamika", type: LessonType.QUIZ, duration: "15 soal" },
      { title: "Usaha dan Energi", type: LessonType.VIDEO, duration: "17 mnt" },
      { title: "Laporan Praktikum", type: LessonType.ASSIGNMENT, duration: "Tenggat" },
    ],
  },
  {
    title: "Biologi Sel",
    slug: "biologi-sel",
    description: "Struktur sel, jaringan, dan sistem organ pada manusia.",
    teacherEmail: "rina@example.com",
    schedule: [
      { dayOfWeek: 3, startTime: "10.00", room: "Lab Bio" },
      { dayOfWeek: 5, startTime: "10.00", room: "Lab Bio" },
    ],
    lessons: [
      { title: "Struktur Sel", type: LessonType.VIDEO, duration: "13 mnt" },
      { title: "Organel Sel", type: LessonType.TEXT, duration: "9 mnt" },
      { title: "Jaringan Tumbuhan", type: LessonType.VIDEO, duration: "16 mnt" },
      { title: "Kuis Sel", type: LessonType.QUIZ, duration: "18 soal" },
      { title: "Sistem Organ", type: LessonType.VIDEO, duration: "19 mnt" },
    ],
  },
  {
    title: "Bahasa Inggris",
    slug: "bahasa-inggris",
    description: "Analytical exposition, narrative text, dan speaking practice.",
    teacherEmail: "teacher@example.com",
    schedule: [{ dayOfWeek: 4, startTime: "13.00", room: "Ruang 3" }],
    lessons: [
      { title: "Analytical Exposition", type: LessonType.TEXT, duration: "10 mnt" },
      { title: "Narrative Text", type: LessonType.VIDEO, duration: "14 mnt" },
      { title: "Speaking Practice", type: LessonType.VIDEO, duration: "12 mnt" },
      { title: "Essay Narrative", type: LessonType.ASSIGNMENT, duration: "Tenggat" },
      { title: "Vocabulary Quiz", type: LessonType.QUIZ, duration: "20 soal" },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin LMS", passwordHash, role: UserRole.ADMIN, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: { name: "Admin LMS", email: "admin@example.com", passwordHash, role: UserRole.ADMIN, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    select: { id: true },
  });

  // Teachers
  const teacherIds = new Map<string, string>();
  for (const t of teachers) {
    const row = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, passwordHash, role: UserRole.TEACHER, status: UserStatus.VERIFIED, verifiedAt: new Date() },
      create: { name: t.name, email: t.email, passwordHash, role: UserRole.TEACHER, status: UserStatus.VERIFIED, verifiedAt: new Date() },
      select: { id: true },
    });
    teacherIds.set(t.email, row.id);
  }

  // Students: demo user + 17 generated, all verified & in one class.
  const studentDefs: { email: string; name: string; studentNumber: string }[] = [
    { email: "user@example.com", name: "User Demo", studentNumber: "SIS-001" },
  ];
  for (let i = 0; i < 17; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    studentDefs.push({ email: `siswa${i + 2}@example.com`, name, studentNumber: `SIS-${String(i + 2).padStart(3, "0")}` });
  }

  const studentIds: string[] = [];
  for (const s of studentDefs) {
    const row = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, passwordHash, role: UserRole.STUDENT, status: UserStatus.VERIFIED, verifiedAt: new Date() },
      create: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.VERIFIED,
        verifiedAt: new Date(),
        profile: { create: { studentNumber: s.studentNumber, className: CLASS_NAME, phone: "0812-0000-0000" } },
      },
      select: { id: true },
    });
    await prisma.studentProfile.upsert({
      where: { userId: row.id },
      update: { studentNumber: s.studentNumber, className: CLASS_NAME },
      create: { userId: row.id, studentNumber: s.studentNumber, className: CLASS_NAME, phone: "0812-0000-0000" },
    });
    studentIds.push(row.id);
  }

  // Pending student (not enrolled).
  await prisma.user.upsert({
    where: { email: "pending@example.com" },
    update: { name: "Siswa Pending", passwordHash, role: UserRole.STUDENT, status: UserStatus.PENDING },
    create: {
      name: "Siswa Pending",
      email: "pending@example.com",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING,
      profile: { create: { studentNumber: "SIS-PND", className: "XI-B", phone: "0812-1111-1111" } },
    },
  });

  // Courses + everything under them.
  for (let ci = 0; ci < courses.length; ci++) {
    const def = courses[ci];
    const teacherId = teacherIds.get(def.teacherEmail) ?? admin.id;

    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      update: { title: def.title, description: def.description, status: CourseStatus.PUBLISHED, createdById: teacherId },
      create: { title: def.title, slug: def.slug, description: def.description, status: CourseStatus.PUBLISHED, createdById: teacherId },
      select: { id: true },
    });

    // lessons
    for (let li = 0; li < def.lessons.length; li++) {
      const l = def.lessons[li];
      await prisma.lesson.upsert({
        where: { courseId_order: { courseId: course.id, order: li + 1 } },
        update: { title: l.title, type: l.type, duration: l.duration },
        create: { courseId: course.id, title: l.title, type: l.type, duration: l.duration, order: li + 1, content: `Materi: ${l.title}.` },
      });
    }

    // schedule (no unique key — reset then recreate)
    await prisma.scheduleSlot.deleteMany({ where: { courseId: course.id } });
    await prisma.scheduleSlot.createMany({
      data: def.schedule.map((s) => ({ courseId: course.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, room: s.room })),
    });

    // enroll every student
    for (let si = 0; si < studentIds.length; si++) {
      const progress = Math.max(20, Math.min(100, det(ci + si, si) - 30));
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: studentIds[si], courseId: course.id } },
        update: { progress, status: EnrollmentStatus.ACTIVE },
        create: { userId: studentIds[si], courseId: course.id, progress, status: EnrollmentStatus.ACTIVE },
      });
    }

    // grade items + records
    for (let gi = 0; gi < GRADE_COLS.length; gi++) {
      const item = await prisma.gradeItem.upsert({
        where: { courseId_title: { courseId: course.id, title: GRADE_COLS[gi] } },
        update: { maxScore: 100, dueAt: new Date(Date.now() + (ci * 5 + gi * 3 + 4) * DAY) },
        create: {
          courseId: course.id,
          title: GRADE_COLS[gi],
          description: `${GRADE_COLS[gi]} ${def.title}`,
          maxScore: 100,
          dueAt: new Date(Date.now() + (ci * 5 + gi * 3 + 4) * DAY),
        },
        select: { id: true },
      });
      for (let si = 0; si < studentIds.length; si++) {
        const score = det(si * 2.3 + gi * 1.7 + ci, gi);
        await prisma.gradeRecord.upsert({
          where: { gradeItemId_userId: { gradeItemId: item.id, userId: studentIds[si] } },
          update: { score },
          create: { gradeItemId: item.id, userId: studentIds[si], score },
        });
      }
    }

    // attendance sessions + records
    for (let se = 0; se < 6; se++) {
      const heldAt = new Date(Date.now() - (6 - se) * DAY);
      const session = await prisma.attendanceSession.upsert({
        where: { courseId_title: { courseId: course.id, title: `Pertemuan ${se + 1}` } },
        update: { heldAt },
        create: { courseId: course.id, title: `Pertemuan ${se + 1}`, heldAt },
        select: { id: true },
      });
      for (let si = 0; si < studentIds.length; si++) {
        const status = attStatus(si * 1.7 + se * 2.1 + ci);
        await prisma.attendanceRecord.upsert({
          where: { attendanceSessionId_userId: { attendanceSessionId: session.id, userId: studentIds[si] } },
          update: { status },
          create: { attendanceSessionId: session.id, userId: studentIds[si], status },
        });
      }
    }
  }

  console.log(`Seeded ${teachers.length} teachers, ${studentIds.length} students, ${courses.length} courses.`);
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
