import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  AdmissionStatus,
  AttendanceStatus,
  CourseStatus,
  EducationLevel,
  EnrollmentStatus,
  PrismaClient,
  ReportCardStatus,
  Semester,
  UserRole,
  UserStatus,
} from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DAY = 24 * 60 * 60 * 1000;
const GRADE_COLS = ["Tugas", "UH 1", "UH 2", "UTS", "Proyek"];

/** Periode berjalan: Juli-Desember = GANJIL tahun berjalan, Januari-Juni = GENAP tahun sebelumnya. */
function currentPeriod(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() >= 6
    ? { semester: Semester.GANJIL, academicYear: `${year}/${year + 1}` }
    : { semester: Semester.GENAP, academicYear: `${year - 1}/${year}` };
}
const PERIOD = currentPeriod();

/* deterministic helpers so reseeding stays stable */
function det(a: number, b: number) {
  return Math.max(55, Math.min(98, Math.round(80 + Math.sin(a * 1.3 + b * 0.7) * 14)));
}
function attStatus(seed: number): AttendanceStatus {
  const r = (Math.sin(seed) + 1) / 2;
  if (r > 0.92) return AttendanceStatus.ABSENT;
  if (r > 0.84) return AttendanceStatus.LATE;
  if (r > 0.76) return AttendanceStatus.EXCUSED;
  return AttendanceStatus.PRESENT;
}

type CourseDef = {
  title: string;
  slug: string;
  description: string;
  teacher: string;
  className: string;
  schedule: { dayOfWeek: number; startTime: string; room: string }[];
};

const COURSES: Record<EducationLevel, CourseDef[]> = {
  SD: [
    {
      title: "Tematik Kelas 5",
      slug: "tematik-kelas-5",
      description: "Pembelajaran tematik terpadu: lingkungan, kesehatan, dan kebersamaan.",
      teacher: "guru2@pesantren.id",
      className: "5A",
      schedule: [{ dayOfWeek: 1, startTime: "07:30", room: "Kelas 5A" }, { dayOfWeek: 3, startTime: "07:30", room: "Kelas 5A" }],
    },
    {
      title: "Tahfidz Juz 30",
      slug: "tahfidz-juz-30",
      description: "Hafalan dan tahsin surat-surat pendek Juz 30.",
      teacher: "guru@pesantren.id",
      className: "5A",
      schedule: [{ dayOfWeek: 2, startTime: "09:00", room: "Aula" }],
    },
    {
      title: "Matematika SD",
      slug: "matematika-sd",
      description: "Operasi pecahan, bangun datar, dan pengukuran dasar.",
      teacher: "guru3@pesantren.id",
      className: "5A",
      schedule: [{ dayOfWeek: 4, startTime: "08:15", room: "Kelas 5A" }],
    },
  ],
  SMP: [
    {
      title: "Matematika Kelas 8",
      slug: "matematika-kelas-8",
      description: "Sistem persamaan linear, teorema Pythagoras, dan statistika dasar.",
      teacher: "guru3@pesantren.id",
      className: "8A",
      schedule: [{ dayOfWeek: 1, startTime: "07:30", room: "Ruang 8A" }, { dayOfWeek: 3, startTime: "07:30", room: "Ruang 8A" }],
    },
    {
      title: "Bahasa Arab",
      slug: "bahasa-arab-smp",
      description: "Mufrodat, percakapan harian, dan kaidah nahwu dasar.",
      teacher: "guru@pesantren.id",
      className: "8A",
      schedule: [{ dayOfWeek: 2, startTime: "10:00", room: "Ruang 8A" }],
    },
    {
      title: "IPA Terpadu",
      slug: "ipa-terpadu-smp",
      description: "Sistem gerak, zat dan perubahannya, serta energi.",
      teacher: "guru2@pesantren.id",
      className: "8A",
      schedule: [{ dayOfWeek: 4, startTime: "09:15", room: "Lab IPA" }],
    },
  ],
  SMA: [
    {
      title: "Matematika Peminatan",
      slug: "matematika-peminatan",
      description: "Trigonometri, limit, dan turunan fungsi aljabar.",
      teacher: "guru3@pesantren.id",
      className: "11 IPA",
      schedule: [{ dayOfWeek: 1, startTime: "08:00", room: "Ruang 11 IPA" }, { dayOfWeek: 3, startTime: "08:00", room: "Ruang 11 IPA" }],
    },
    {
      title: "Fisika",
      slug: "fisika-sma",
      description: "Hukum Newton, usaha dan energi, serta momentum.",
      teacher: "guru2@pesantren.id",
      className: "11 IPA",
      schedule: [{ dayOfWeek: 2, startTime: "09:15", room: "Lab Fisika" }, { dayOfWeek: 4, startTime: "09:15", room: "Lab Fisika" }],
    },
    {
      title: "Tafsir & Hadits",
      slug: "tafsir-hadits",
      description: "Kajian tafsir ayat pilihan dan hadits arba'in.",
      teacher: "guru@pesantren.id",
      className: "11 IPA",
      schedule: [{ dayOfWeek: 5, startTime: "07:30", room: "Aula" }],
    },
  ],
};

const STUDENT_NAMES: Record<EducationLevel, string[]> = {
  SD: ["Hafiz Maulana", "Aisyah Putri", "Rizky Ramadhan", "Nabila Zahra", "Faris Abdullah", "Khadijah Salma"],
  SMP: ["Ahmad Fauzan", "Dimas Pratama", "Salsabila Hana", "Ridho Hidayat", "Maryam Lestari", "Ilham Nugroho"],
  SMA: ["Siti Aminah", "Yusuf Maulana", "Annisa Rahma", "Fadhil Kurnia", "Zahwa Aulia", "Rafi Saputra"],
};

const LEVELS: EducationLevel[] = [EducationLevel.SD, EducationLevel.SMP, EducationLevel.SMA];

async function upsertUser(email: string, name: string, role: UserRole, passwordHash: string, phone?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name, phone: phone ?? null, passwordHash, role, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: { name, email, phone: phone ?? null, passwordHash, role, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    select: { id: true },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await upsertUser("admin@pesantren.id", "Administrasi Pesantren", UserRole.ADMIN, passwordHash);
  await upsertUser("mudir@pesantren.id", "Mudir Ma'had", UserRole.MUDIR, passwordHash);
  const homeroom = await upsertUser("walikelas@pesantren.id", "Ustadzah Nur Wali Kelas", UserRole.HOMEROOM, passwordHash);

  const teachers = [
    { email: "guru@pesantren.id", name: "Ustadz Ahmad" },
    { email: "guru2@pesantren.id", name: "Ustadzah Fatimah" },
    { email: "guru3@pesantren.id", name: "Ustadz Yusuf" },
  ];
  const teacherIds = new Map<string, string>();
  for (const t of teachers) {
    const row = await upsertUser(t.email, t.name, UserRole.TEACHER, passwordHash);
    teacherIds.set(t.email, row.id);
  }

  // Demo parent owns two children across levels.
  const demoParent = await upsertUser("wali@pesantren.id", "Bapak Hadi Santoso", UserRole.PARENT, passwordHash, "0812-0000-1111");

  // Courses + schedule + grade items, grouped by level.
  const coursesByLevel = new Map<EducationLevel, { id: string; gradeItemIds: string[] }[]>();
  for (const level of LEVELS) {
    const list: { id: string; gradeItemIds: string[] }[] = [];
    for (const def of COURSES[level]) {
      const teacherId = teacherIds.get(def.teacher) ?? admin.id;
      const course = await prisma.course.upsert({
        where: { slug: def.slug },
        update: { title: def.title, description: def.description, level, status: CourseStatus.PUBLISHED, createdById: teacherId },
        create: { title: def.title, slug: def.slug, description: def.description, level, status: CourseStatus.PUBLISHED, createdById: teacherId },
        select: { id: true },
      });

      await prisma.scheduleSlot.deleteMany({ where: { courseId: course.id } });
      await prisma.scheduleSlot.createMany({
        data: def.schedule.map((s) => ({ courseId: course.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, room: s.room })),
      });

      const gradeItemIds: string[] = [];
      for (let gi = 0; gi < GRADE_COLS.length; gi++) {
        const item = await prisma.gradeItem.upsert({
          where: { courseId_title: { courseId: course.id, title: GRADE_COLS[gi] } },
          update: { maxScore: 100, dueAt: new Date(Date.now() + (gi * 3 + 4) * DAY), semester: PERIOD.semester, academicYear: PERIOD.academicYear },
          create: { courseId: course.id, title: GRADE_COLS[gi], description: `${GRADE_COLS[gi]} ${def.title}`, maxScore: 100, dueAt: new Date(Date.now() + (gi * 3 + 4) * DAY), semester: PERIOD.semester, academicYear: PERIOD.academicYear },
          select: { id: true },
        });
        gradeItemIds.push(item.id);
      }
      list.push({ id: course.id, gradeItemIds });
    }
    coursesByLevel.set(level, list);
  }

  // Santri per level. First santri of SMP & SMA belongs to the demo parent.
  let studentCounter = 0;
  const studentsByLevel = new Map<EducationLevel, string[]>();
  for (const level of LEVELS) {
    const ids: string[] = [];
    const names = STUDENT_NAMES[level];
    const className = COURSES[level][0].className;
    for (let i = 0; i < names.length; i++) {
      studentCounter += 1;
      const studentNumber = `${level}-${String(i + 1).padStart(3, "0")}`;

      let parentId: string;
      if ((level === EducationLevel.SMP || level === EducationLevel.SMA) && i === 0) {
        parentId = demoParent.id;
      } else {
        const parent = await upsertUser(`wali.${level.toLowerCase()}.${i + 1}@pesantren.id`, `Wali ${names[i]}`, UserRole.PARENT, passwordHash, "0812-3456-7890");
        parentId = parent.id;
      }

      const student = await prisma.studentProfile.upsert({
        where: { studentNumber },
        update: { name: names[i], level, className, parentId, phone: "0812-3456-7890" },
        create: { name: names[i], level, studentNumber, className, parentId, phone: "0812-3456-7890" },
        select: { id: true },
      });
      ids.push(student.id);
    }
    studentsByLevel.set(level, ids);
  }

  // Enrollments + grade records + attendance, scoped to each level's courses.
  for (const level of LEVELS) {
    const students = studentsByLevel.get(level) ?? [];
    const courses = coursesByLevel.get(level) ?? [];
    for (let ci = 0; ci < courses.length; ci++) {
      const course = courses[ci];

      for (let si = 0; si < students.length; si++) {
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: students[si], courseId: course.id } },
          update: { status: EnrollmentStatus.ACTIVE },
          create: { studentId: students[si], courseId: course.id, status: EnrollmentStatus.ACTIVE },
        });
      }

      for (let gi = 0; gi < course.gradeItemIds.length; gi++) {
        for (let si = 0; si < students.length; si++) {
          const score = det(si * 2.3 + gi * 1.7 + ci, gi);
          await prisma.gradeRecord.upsert({
            where: { gradeItemId_studentId: { gradeItemId: course.gradeItemIds[gi], studentId: students[si] } },
            update: { score },
            create: { gradeItemId: course.gradeItemIds[gi], studentId: students[si], score },
          });
        }
      }

      for (let se = 0; se < 6; se++) {
        const heldAt = new Date(Date.now() - (6 - se) * DAY);
        const session = await prisma.attendanceSession.upsert({
          where: { courseId_title: { courseId: course.id, title: `Pertemuan ${se + 1}` } },
          update: { heldAt, semester: PERIOD.semester, academicYear: PERIOD.academicYear },
          create: { courseId: course.id, title: `Pertemuan ${se + 1}`, heldAt, semester: PERIOD.semester, academicYear: PERIOD.academicYear },
          select: { id: true },
        });
        for (let si = 0; si < students.length; si++) {
          const status = attStatus(si * 1.7 + se * 2.1 + ci);
          await prisma.attendanceRecord.upsert({
            where: { attendanceSessionId_studentId: { attendanceSessionId: session.id, studentId: students[si] } },
            update: { status },
            create: { attendanceSessionId: session.id, studentId: students[si], status },
          });
        }
      }
    }
  }

  // Rapor demo untuk anak wali demo: anak SMA terbit, anak SMP masih draf.
  const demoReportTargets = [
    { studentId: studentsByLevel.get(EducationLevel.SMA)?.[0], publish: true },
    { studentId: studentsByLevel.get(EducationLevel.SMP)?.[0], publish: false },
  ];
  for (const target of demoReportTargets) {
    if (!target.studentId) continue;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: target.studentId, course: { deletedAt: null } },
      orderBy: { course: { title: "asc" } },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            gradeItems: {
              where: { semester: PERIOD.semester, academicYear: PERIOD.academicYear },
              select: { maxScore: true, records: { where: { studentId: target.studentId }, select: { score: true } } },
            },
            attendanceSessions: {
              where: { semester: PERIOD.semester, academicYear: PERIOD.academicYear },
              select: { records: { where: { studentId: target.studentId }, select: { status: true } } },
            },
          },
        },
      },
    });

    const entries = enrollments.map(({ course }) => {
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
    if (entries.length === 0) continue;

    const card = await prisma.reportCard.upsert({
      where: {
        studentId_semester_academicYear: {
          studentId: target.studentId,
          semester: PERIOD.semester,
          academicYear: PERIOD.academicYear,
        },
      },
      update: {
        status: target.publish ? ReportCardStatus.PUBLISHED : ReportCardStatus.DRAFT,
        publishedAt: target.publish ? new Date() : null,
        homeroomNote: target.publish ? "Alhamdulillah perkembangan baik. Tingkatkan murojaah dan kedisiplinan waktu." : null,
        createdById: admin.id,
      },
      create: {
        studentId: target.studentId,
        semester: PERIOD.semester,
        academicYear: PERIOD.academicYear,
        status: target.publish ? ReportCardStatus.PUBLISHED : ReportCardStatus.DRAFT,
        publishedAt: target.publish ? new Date() : null,
        homeroomNote: target.publish ? "Alhamdulillah perkembangan baik. Tingkatkan murojaah dan kedisiplinan waktu." : null,
        createdById: admin.id,
      },
      select: { id: true },
    });

    await prisma.reportCardEntry.deleteMany({ where: { reportCardId: card.id } });
    await prisma.reportCardEntry.createMany({ data: entries.map((e) => ({ ...e, reportCardId: card.id })) });
  }

  // Announcements.
  await prisma.announcement.deleteMany({});
  await prisma.announcement.createMany({
    data: [
      { title: "Selamat Datang Tahun Ajaran Baru", body: "Kegiatan belajar mengajar dimulai Senin pekan depan. Mohon wali memastikan kelengkapan santri.", level: null, pinned: true, authorId: admin.id },
      { title: "Jadwal Ujian Tengah Semester", body: "UTS dilaksanakan dua pekan lagi. Jadwal lengkap dapat dilihat melalui guru kelas masing-masing.", level: null, pinned: false, authorId: admin.id },
      { title: "Lomba Mewarnai Tingkat SD", body: "Diadakan lomba mewarnai untuk santri SD pada hari Jumat. Peserta menghubungi wali kelas.", level: EducationLevel.SD, pinned: false, authorId: teacherIds.get("guru2@pesantren.id") ?? admin.id },
      { title: "Pesantren Kilat SMP", body: "Program pesantren kilat khusus santri SMP akan berlangsung selama libur tengah semester.", level: EducationLevel.SMP, pinned: false, authorId: teacherIds.get("guru@pesantren.id") ?? admin.id },
      { title: "Sosialisasi Kampus untuk SMA", body: "Bimbingan pemilihan kampus dan jurusan untuk santri SMA kelas akhir. Wajib diikuti.", level: EducationLevel.SMA, pinned: false, authorId: teacherIds.get("guru3@pesantren.id") ?? admin.id },
    ],
  });

  // Admissions (PPDB) demo rows.
  await prisma.admission.deleteMany({});
  await prisma.admission.createMany({
    data: [
      { childName: "Bilal Arrahman", level: EducationLevel.SD, gender: "L", birthPlace: "Bandung", previousSchool: "TK Al-Hikmah", parentName: "Bapak Sulaiman", parentPhone: "0813-1111-2222", parentEmail: "sulaiman@example.com", address: "Jl. Melati No. 10", note: "Mendaftar gelombang 1", status: AdmissionStatus.PENDING },
      { childName: "Khaira Nayla", level: EducationLevel.SMP, gender: "P", birthPlace: "Bekasi", previousSchool: "SDN 1 Bekasi", parentName: "Ibu Maryani", parentPhone: "0813-3333-4444", parentEmail: "maryani@example.com", address: "Jl. Anggrek No. 5", status: AdmissionStatus.PENDING },
      { childName: "Umar Faruq", level: EducationLevel.SMA, gender: "L", birthPlace: "Depok", previousSchool: "MTs Darul Ulum", parentName: "Bapak Ridwan", parentPhone: "0813-5555-6666", parentEmail: "ridwan@example.com", status: AdmissionStatus.ACCEPTED, reviewedAt: new Date(), reviewedById: admin.id },
      { childName: "Laila Husna", level: EducationLevel.SMP, gender: "P", previousSchool: "SD Islam Terpadu", parentName: "Ibu Sahara", parentPhone: "0813-7777-8888", parentEmail: "sahara@example.com", status: AdmissionStatus.REJECTED, reviewedAt: new Date(), reviewedById: admin.id },
    ],
  });

  // Absensi ustadz: seminggu terakhir (kecuali Ahad), mayoritas hadir.
  const staffIds = [homeroom.id, ...teacherIds.values()];
  const staffAttendanceRows: { teacherId: string; date: Date; status: AttendanceStatus; recordedById: string }[] = [];
  const now = new Date();
  for (let back = 0; back < 7; back++) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    if (d.getDay() === 0) continue;
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    staffIds.forEach((teacherId, idx) => {
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (back === 2 && idx === 1) status = AttendanceStatus.EXCUSED;
      if (back === 4 && idx === 2) status = AttendanceStatus.LATE;
      if (back === 5 && idx === 3) status = AttendanceStatus.ABSENT;
      staffAttendanceRows.push({ teacherId, date, status, recordedById: admin.id });
    });
  }
  await prisma.staffAttendance.deleteMany({});
  await prisma.staffAttendance.createMany({ data: staffAttendanceRows });

  console.log(`Seeded ${teachers.length} teachers, ${studentCounter} students across ${LEVELS.length} levels, with parents, announcements, admissions, and ${staffAttendanceRows.length} staff attendance rows.`);
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
