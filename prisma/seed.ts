import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  AdmissionDocumentKind,
  AdmissionStatus,
  AssessmentGroupKind,
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

/** Periode berjalan: Juli-Desember = GANJIL tahun berjalan, Januari-Juni = GENAP tahun sebelumnya. */
function currentPeriod(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() >= 6
    ? { semester: Semester.GANJIL, academicYear: `${year}/${year + 1}` }
    : { semester: Semester.GENAP, academicYear: `${year - 1}/${year}` };
}
const PERIOD = currentPeriod();

/* Data demo Pondok Pesantren Integritas Qur'ani 368 (PPIQ-368), Jl. Ciwaruga,
   Parongpong, Bandung Barat. Skalanya sengaja kecil (3 kelas, 12 santri berkelas)
   tapi isinya masuk akal, dan setiap skenario uji black-box punya baris datanya
   sendiri — pemetaannya ada di SKENARIO-UJI.md. */

/** Satu kata sandi demo untuk semua akun; sengaja tidak ditampilkan di aplikasi. */
const DEMO_PASSWORD = "password123";
const EMAIL_DOMAIN = "ppiq368.sch.id";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Hash string sederhana; dipakai agar angka demo tetap sama tiap kali seed diulang. */
function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Nilai komponen 62-96 yang deterministik terhadap santri + mapel + komponen. */
function det(...parts: string[]) {
  return 62 + (hashCode(parts.join("|")) % 35);
}

const TERBILANG = [
  "Nol",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
] as const;

/** Terbilang 0-10; cukup untuk skala rapor pondok (maksimal 7). Selaras dengan lib/rapor.ts. */
function terbilang(value: number) {
  return TERBILANG[value] ?? String(value);
}

/* -------------------------------------------------------------------------- */
/*                                akun pengguna                               */
/* -------------------------------------------------------------------------- */

type StaffDef = { key: string; email: string; name: string; roles: UserRole[]; phone: string };

/** 1 administrasi, 1 mudir, dan 6 ustadz (tiga di antaranya wali kelas). */
const STAFF: StaffDef[] = [
  {
    key: "admin",
    email: `administrasi@${EMAIL_DOMAIN}`,
    name: "Ustadz Rahmat Hidayat, S.Pd.",
    roles: [UserRole.ADMIN],
    phone: "0812-2145-6601",
  },
  {
    key: "mudir",
    email: `mudir@${EMAIL_DOMAIN}`,
    name: "Ustadz Abdurrahman Fauzi, Lc.",
    roles: [UserRole.MUDIR],
    phone: "0812-2145-6602",
  },
  // Skenario dua peran dalam satu akun: mengajar mapel sendiri sekaligus wali kelas SD-A.
  {
    key: "hamdan",
    email: `hamdan.mutaqin@${EMAIL_DOMAIN}`,
    name: "Ustadz Hamdan Mutaqin, S.Pd.",
    roles: [UserRole.TEACHER, UserRole.HOMEROOM],
    phone: "0813-9420-1187",
  },
  {
    key: "salman",
    email: `salman.ghifari@${EMAIL_DOMAIN}`,
    name: "Ustadz Salman Al Ghifari, Lc.",
    roles: [UserRole.HOMEROOM],
    phone: "0813-9420-1188",
  },
  {
    key: "ridwan",
    email: `ridwan.nurhakim@${EMAIL_DOMAIN}`,
    name: "Ustadz Ridwan Nurhakim, S.Pd.",
    roles: [UserRole.HOMEROOM],
    phone: "0813-9420-1189",
  },
  {
    key: "taufiq",
    email: `taufiq.ramadhan@${EMAIL_DOMAIN}`,
    name: "Ustadz Taufiq Ramadhan, Lc.",
    roles: [UserRole.TEACHER],
    phone: "0821-1730-4455",
  },
  {
    key: "hafidz",
    email: `hafidz.maulana@${EMAIL_DOMAIN}`,
    name: "Ustadz Hafidz Maulana, S.Pd.",
    roles: [UserRole.TEACHER],
    phone: "0821-1730-4456",
  },
  {
    key: "imron",
    email: `imron.nawawi@${EMAIL_DOMAIN}`,
    name: "Ustadz Imron Nawawi, S.Pd.I.",
    roles: [UserRole.TEACHER],
    phone: "0821-1730-4457",
  },
];

/** Ustadz (pengajar & wali kelas) — dipakai untuk absensi ustadz dan BKKH. */
const TEACHING_KEYS = ["hamdan", "salman", "ridwan", "taufiq", "hafidz", "imron"] as const;

type ParentDef = { key: string; email: string; name: string; phone: string; address: string };

/** 8 wali santri di sekitar Parongpong / Bandung Barat. */
const PARENTS: ParentDef[] = [
  {
    key: "hasan",
    email: `wali.hasan@${EMAIL_DOMAIN}`,
    name: "Bapak Hasan Basri",
    phone: "0813-2244-7781",
    address: "Kp. Ciwaruga RT 02/RW 05, Parongpong, Bandung Barat",
  },
  {
    key: "mahmud",
    email: `wali.mahmud@${EMAIL_DOMAIN}`,
    name: "Bapak Mahmud Sanusi",
    phone: "0852-2093-1164",
    address: "Jl. Kolonel Masturi No. 112, Cihanjuang Rahayu, Parongpong",
  },
  {
    key: "iskandar",
    email: `wali.iskandar@${EMAIL_DOMAIN}`,
    name: "Bapak Iskandar Ali",
    phone: "0857-2311-8890",
    address: "Kp. Cigugur Girang RT 03/RW 08, Parongpong, Bandung Barat",
  },
  {
    key: "rosyid",
    email: `wali.rosyid@${EMAIL_DOMAIN}`,
    name: "Bapak Rosyid Anwar",
    phone: "0812-2077-3345",
    address: "Jl. Sersan Bajuri No. 45, Cihideung, Parongpong",
  },
  {
    key: "jamaludin",
    email: `wali.jamaludin@${EMAIL_DOMAIN}`,
    name: "Bapak Jamaludin Akbar",
    phone: "0896-5512-7702",
    address: "Kp. Panyandaan RT 04/RW 09, Cihideung, Parongpong",
  },
  {
    key: "sofyan",
    email: `wali.sofyan@${EMAIL_DOMAIN}`,
    name: "Bapak Sofyan Hadi",
    phone: "0877-3120-6654",
    address: "Komplek Permata Cimahi Blok C2 No. 7, Ngamprah, Bandung Barat",
  },
  {
    key: "nurhayati",
    email: `wali.nurhayati@${EMAIL_DOMAIN}`,
    name: "Ibu Nurhayati Sri Wahyuni",
    phone: "0895-3388-2210",
    address: "Kp. Sukamaju RT 01/RW 04, Cisarua, Bandung Barat",
  },
  {
    key: "dewi",
    email: `wali.dewi@${EMAIL_DOMAIN}`,
    name: "Ibu Dewi Ratnasari",
    phone: "0821-1600-4478",
    address: "Jl. Raya Lembang No. 88, Lembang, Bandung Barat",
  },
];

/* -------------------------------------------------------------------------- */
/*                               kelas & santri                               */
/* -------------------------------------------------------------------------- */

type ClassDef = { key: string; name: string; level: EducationLevel; homeroomKey: string };

const CLASSES: ClassDef[] = [
  { key: "sd", name: "SD-A", level: EducationLevel.SD, homeroomKey: "hamdan" },
  { key: "smp", name: "SMP-A", level: EducationLevel.SMP, homeroomKey: "salman" },
  { key: "sma", name: "SMA-A", level: EducationLevel.SMA, homeroomKey: "ridwan" },
];

type StudentDef = {
  studentNumber: string;
  name: string;
  level: EducationLevel;
  /** null = belum ditempatkan di kelas mana pun (skenario uji). */
  classKey: string | null;
  /** null = wali santri belum memiliki akun aplikasi. */
  parentKey: string | null;
  phone: string;
  address: string;
};

/**
 * Nomor induk santri (NIS) 8 digit: 4 digit tahun masuk, 1 digit kode jenjang
 * (1=SD, 2=SMP, 3=SMA), 3 digit nomor urut.
 */
const STUDENTS: StudentDef[] = [
  // SD-A
  {
    studentNumber: "20261001",
    name: "Zaid Abdullah Basri",
    level: EducationLevel.SD,
    classKey: "sd",
    parentKey: "hasan",
    phone: "0813-2244-7781",
    address: "Kp. Ciwaruga RT 02/RW 05, Parongpong, Bandung Barat",
  },
  {
    studentNumber: "20261002",
    name: "Ibrahim Alfarizi",
    level: EducationLevel.SD,
    classKey: "sd",
    parentKey: "mahmud",
    phone: "0852-2093-1164",
    address: "Jl. Kolonel Masturi No. 112, Cihanjuang Rahayu, Parongpong",
  },
  {
    studentNumber: "20261003",
    name: "Naufal Hakim Ramadhan",
    level: EducationLevel.SD,
    classKey: "sd",
    parentKey: "iskandar",
    phone: "0857-2311-8890",
    address: "Kp. Cigugur Girang RT 03/RW 08, Parongpong, Bandung Barat",
  },
  {
    studentNumber: "20261004",
    name: "Yusuf Maulana Sidik",
    level: EducationLevel.SD,
    classKey: "sd",
    parentKey: null,
    phone: "0813-8842-9017",
    address: "Kp. Karyawangi RT 05/RW 12, Parongpong, Bandung Barat",
  },
  // SMP-A
  {
    studentNumber: "20262001",
    name: "Fatih Ahmad Basri",
    level: EducationLevel.SMP,
    classKey: "smp",
    parentKey: "hasan",
    phone: "0813-2244-7781",
    address: "Kp. Ciwaruga RT 02/RW 05, Parongpong, Bandung Barat",
  },
  {
    studentNumber: "20262002",
    name: "Rifqi Nur Hidayat",
    level: EducationLevel.SMP,
    classKey: "smp",
    parentKey: "rosyid",
    phone: "0812-2077-3345",
    address: "Jl. Sersan Bajuri No. 45, Cihideung, Parongpong",
  },
  {
    studentNumber: "20262003",
    name: "Ilham Baihaqi",
    level: EducationLevel.SMP,
    classKey: "smp",
    parentKey: "jamaludin",
    phone: "0896-5512-7702",
    address: "Kp. Panyandaan RT 04/RW 09, Cihideung, Parongpong",
  },
  {
    studentNumber: "20262004",
    name: "Ahmad Zaki Mubarok",
    level: EducationLevel.SMP,
    classKey: "smp",
    parentKey: null,
    phone: "0857-9911-3376",
    address: "Kp. Cihanjuang RT 02/RW 03, Parongpong, Bandung Barat",
  },
  // SMA-A
  {
    studentNumber: "20263001",
    name: "Umar Faruq Wibowo",
    level: EducationLevel.SMA,
    classKey: "sma",
    parentKey: "sofyan",
    phone: "0877-3120-6654",
    address: "Komplek Permata Cimahi Blok C2 No. 7, Ngamprah, Bandung Barat",
  },
  {
    studentNumber: "20263002",
    name: "Hafizh Abdul Aziz",
    level: EducationLevel.SMA,
    classKey: "sma",
    parentKey: "nurhayati",
    phone: "0895-3388-2210",
    address: "Kp. Sukamaju RT 01/RW 04, Cisarua, Bandung Barat",
  },
  {
    studentNumber: "20263003",
    name: "Aqil Farhan Nugraha",
    level: EducationLevel.SMA,
    classKey: "sma",
    parentKey: null,
    phone: "0812-9043-5528",
    address: "Jl. Cihanjuang No. 210, Cimahi Utara, Bandung Barat",
  },
  {
    studentNumber: "20263004",
    name: "Salim Fadhlurrahman",
    level: EducationLevel.SMA,
    classKey: "sma",
    parentKey: null,
    phone: "0821-2255-9014",
    address: "Kp. Gunung Putri RT 03/RW 07, Lembang, Bandung Barat",
  },
  // Santri baru hasil PPDB yang sudah diterima tapi belum ditempatkan di kelas.
  {
    studentNumber: "20262005",
    name: "Bilal Arrahman Saputra",
    level: EducationLevel.SMP,
    classKey: null,
    parentKey: "dewi",
    phone: "0821-1600-4478",
    address: "Jl. Raya Lembang No. 88, Lembang, Bandung Barat",
  },
];

/* -------------------------------------------------------------------------- */
/*                          kurikulum & format rapor                          */
/* -------------------------------------------------------------------------- */

type CourseDef = {
  title: string;
  maxScore: number;
  /** Kunci akun ustadz, atau "wali" untuk wali kelas kelas yang bersangkutan. */
  teacherKey: string;
};

type GroupDef = {
  name: string;
  kind: AssessmentGroupKind;
  defaultMaxScore: number;
  sortOrder: number;
  courses: CourseDef[];
  criteria: { name: string; maxScore: number }[];
};

/**
 * Komponen penilaian mengikuti naskah BAB III: Akademik, Akhlak, Tahfidz, dan
 * Ekstrakurikuler. Nilai maksimal per mapel (7 atau 6) tetap seperti formulir
 * rapor pondok. Kelompok ini master data biasa — administrasi boleh mengubahnya
 * lewat /akademik tanpa perlu ubah kode.
 */
const GROUPS: GroupDef[] = [
  {
    name: "Akademik",
    kind: AssessmentGroupKind.COURSE_SCORE,
    defaultMaxScore: 7,
    sortOrder: 1,
    courses: [
      { title: "Latihan Bahasa", maxScore: 7, teacherKey: "imron" },
      { title: "Peribahasa Arab", maxScore: 7, teacherKey: "imron" },
      { title: "Analisis / Membaca Kitab", maxScore: 7, teacherKey: "imron" },
      { title: "Terjemah", maxScore: 7, teacherKey: "imron" },
      { title: "Imla' / Dikte", maxScore: 7, teacherKey: "imron" },
      { title: "Kaidah Bahasa", maxScore: 7, teacherKey: "imron" },
      { title: "Bahasa Arab", maxScore: 7, teacherKey: "imron" },
      { title: "Praktik Ibadah", maxScore: 7, teacherKey: "imron" },
      { title: "Akidah & Akhlak", maxScore: 6, teacherKey: "imron" },
      { title: "Ilmu Fikih", maxScore: 6, teacherKey: "imron" },
      { title: "Bahasa Inggris / Tata Bahasa", maxScore: 7, teacherKey: "hafidz" },
      { title: "Bahasa Inggris", maxScore: 7, teacherKey: "hafidz" },
      { title: "Conversation", maxScore: 6, teacherKey: "hafidz" },
      { title: "Reading Time", maxScore: 6, teacherKey: "hafidz" },
      { title: "Sejarah Islam", maxScore: 6, teacherKey: "hafidz" },
      { title: "Matematika", maxScore: 6, teacherKey: "hafidz" },
      { title: "Fisika", maxScore: 6, teacherKey: "hafidz" },
      { title: "IPA Terpadu", maxScore: 6, teacherKey: "hafidz" },
      { title: "Komputer", maxScore: 6, teacherKey: "hafidz" },
    ],
    criteria: [],
  },
  {
    name: "Akhlak",
    kind: AssessmentGroupKind.BEHAVIOR,
    defaultMaxScore: 7,
    sortOrder: 2,
    courses: [],
    criteria: [
      { name: "Kebersihan", maxScore: 7 },
      { name: "Tata Tertib", maxScore: 7 },
      { name: "Budaya / Perilaku", maxScore: 7 },
      { name: "Jumlah Keseluruhan", maxScore: 7 },
    ],
  },
  {
    name: "Tahfidz",
    kind: AssessmentGroupKind.COURSE_SCORE,
    defaultMaxScore: 7,
    sortOrder: 3,
    courses: [
      { title: "Hafalan Al-Qur'an", maxScore: 7, teacherKey: "taufiq" },
      { title: "Membaca Al-Qur'an", maxScore: 7, teacherKey: "taufiq" },
      { title: "Ilmu Tajwid", maxScore: 7, teacherKey: "taufiq" },
      { title: "Tafsir", maxScore: 7, teacherKey: "taufiq" },
      { title: "Hadis", maxScore: 7, teacherKey: "taufiq" },
      { title: "Al-Qur'an-Hadis", maxScore: 6, teacherKey: "taufiq" },
    ],
    criteria: [],
  },
  {
    name: "Ekstrakurikuler",
    kind: AssessmentGroupKind.COURSE_SCORE,
    defaultMaxScore: 6,
    sortOrder: 4,
    courses: [
      { title: "Memanah", maxScore: 6, teacherKey: "wali" },
      { title: "Berenang", maxScore: 6, teacherKey: "wali" },
      { title: "Berkuda", maxScore: 6, teacherKey: "wali" },
      { title: "Bela Diri", maxScore: 6, teacherKey: "wali" },
      { title: "Olahraga", maxScore: 6, teacherKey: "wali" },
      { title: "Pramuka", maxScore: 6, teacherKey: "wali" },
    ],
    criteria: [],
  },
];

/** Dua komponen nilai per mapel, berbobot sesuai kebiasaan pondok (total 100%). */
const GRADE_COMPONENTS = [
  { title: "UTS", weight: 40 },
  { title: "UAS", weight: 60 },
];

const SLOT_TIMES = ["07:30", "09:00", "10:30", "13:00", "15:30", "19:30"];

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/* --------------------------- skenario uji khusus ---------------------------- */

/** Mapel tanpa ustadz pengampu. */
const COURSE_WITHOUT_TEACHER = { classKey: "sd", title: "Komputer" };
/** Mapel tanpa peserta terdaftar. */
const COURSE_WITHOUT_STUDENTS = { classKey: "sma", title: "Berkuda" };
/** Mapel yang total bobot komponen nilainya tidak 100% (40 + 50 = 90). */
const COURSE_WITH_BROKEN_WEIGHTS = { classKey: "smp", title: "Fisika", weights: [40, 50] };

function isCourse(target: { classKey: string; title: string }, classKey: string, title: string) {
  return target.classKey === classKey && target.title === title;
}

/* -------------------------------------------------------------------------- */
/*                              palang data asli                              */
/* -------------------------------------------------------------------------- */

const SEEDED_EMAILS: readonly string[] = [...STAFF.map((s) => s.email), ...PARENTS.map((p) => p.email)];
const SEEDED_STUDENT_NUMBERS: readonly string[] = STUDENTS.map((s) => s.studentNumber);

/** Dilempar bila database tampak berisi data asli; pesannya dicetak apa adanya. */
class SeedAbortError extends Error {}

/**
 * Palang data asli. Seed menulis dengan upsert pada kunci alami (nomor induk
 * santri, email akun, slug mapel, nama kelas), sehingga menjalankannya di
 * database pondok yang sudah berisi data sungguhan akan menimpa nama, wali,
 * kelas, dan nomor telepon dengan data demo. Karena itu seed menolak berjalan
 * begitu menemukan baris yang bukan buatannya sendiri.
 */
async function assertSeedableDatabase() {
  if (process.env.SEED_FORCE === "1") {
    console.warn(
      "SEED_FORCE=1: palang data asli dilewati. Baris dengan kunci alami yang sama akan ditimpa data demo.",
    );
    return;
  }

  const [foreignStudents, foreignUsers] = await Promise.all([
    prisma.studentProfile.count({ where: { studentNumber: { notIn: [...SEEDED_STUDENT_NUMBERS] } } }),
    prisma.user.count({ where: { email: { notIn: [...SEEDED_EMAILS] } } }),
  ]);
  if (foreignStudents === 0 && foreignUsers === 0) return;

  const found = [
    foreignStudents > 0 ? `${foreignStudents} santri di luar nomor induk demo` : null,
    foreignUsers > 0 ? `${foreignUsers} akun pengguna di luar akun demo` : null,
  ]
    .filter(Boolean)
    .join(" dan ");

  throw new SeedAbortError(
    `Seed dibatalkan: database ini tampak berisi data asli (${found}).\n` +
      `Seed menimpa baris lewat kunci alami (nomor induk santri, email akun, nama kelas, slug mapel), ` +
      `sehingga baris pondok yang memakai kunci sama akan berganti menjadi data demo.\n` +
      `Jalankan seed hanya pada database pengembangan. Bila Anda benar-benar yakin, ulangi dengan: SEED_FORCE=1 pnpm db:seed`,
  );
}

async function upsertUser(email: string, name: string, roles: UserRole[], passwordHash: string, phone?: string) {
  // Jaga agar SEEDED_EMAILS tetap jadi daftar lengkap akun seed; kalau tidak,
  // palang di atas akan mengira akun demo baru sebagai data asli.
  if (!SEEDED_EMAILS.includes(email)) {
    throw new Error(`Akun seed ${email} belum terdaftar di SEEDED_EMAILS.`);
  }
  return prisma.user.upsert({
    where: { email },
    update: { name, phone: phone ?? null, passwordHash, roles, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    create: { name, email, phone: phone ?? null, passwordHash, roles, status: UserStatus.VERIFIED, verifiedAt: new Date() },
    select: { id: true },
  });
}

/* -------------------------------------------------------------------------- */
/*                                  absensi                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pola kehadiran per santri (indeks dalam kelasnya) untuk tiga pertemuan yang
 * diabsen. Sengaja mencakup kelima status agar rekap rapor (Sakit/Izin/Lain-lain)
 * dan grafik kehadiran punya isi.
 */
const ATTENDANCE_PATTERNS: AttendanceStatus[][] = [
  [AttendanceStatus.PRESENT, AttendanceStatus.SICK, AttendanceStatus.PRESENT],
  [AttendanceStatus.EXCUSED, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT],
  [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE],
  [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT],
];
const SESSION_COUNT = ATTENDANCE_PATTERNS[0].length;

function attendancePattern(indexInClass: number) {
  return ATTENDANCE_PATTERNS[indexInClass % ATTENDANCE_PATTERNS.length];
}

/* -------------------------------------------------------------------------- */
/*                                    seed                                    */
/* -------------------------------------------------------------------------- */

type SeededCourse = {
  id: string;
  title: string;
  classKey: string;
  groupName: string;
  groupSortOrder: number;
  maxScore: number;
  weights: { title: string; weight: number }[];
  enrolled: boolean;
};

async function main() {
  await assertSeedableDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  /* ------------------------------- akun ---------------------------------- */
  const userIdByKey = new Map<string, string>();
  for (const staff of STAFF) {
    const user = await upsertUser(staff.email, staff.name, staff.roles, passwordHash, staff.phone);
    userIdByKey.set(staff.key, user.id);
  }
  for (const parent of PARENTS) {
    const user = await upsertUser(parent.email, parent.name, [UserRole.PARENT], passwordHash, parent.phone);
    userIdByKey.set(parent.key, user.id);
  }
  const adminId = userIdByKey.get("admin")!;

  /* ------------------------------- kelas --------------------------------- */
  const classByKey = new Map<string, { id: string; name: string; def: ClassDef }>();
  for (const def of CLASSES) {
    const homeroomTeacherId = userIdByKey.get(def.homeroomKey)!;
    const classRoom = await prisma.classRoom.upsert({
      where: { name_academicYear: { name: def.name, academicYear: PERIOD.academicYear } },
      update: { level: def.level, homeroomTeacherId },
      create: { name: def.name, level: def.level, academicYear: PERIOD.academicYear, homeroomTeacherId },
      select: { id: true, name: true },
    });
    classByKey.set(def.key, { id: classRoom.id, name: classRoom.name, def });
  }

  /* ------------------------------ santri --------------------------------- */
  const studentByNumber = new Map<string, { id: string; name: string; def: StudentDef; indexInClass: number }>();
  const indexCounter = new Map<string, number>();
  for (const def of STUDENTS) {
    const classRoom = def.classKey ? classByKey.get(def.classKey)! : null;
    const parentId = def.parentKey ? userIdByKey.get(def.parentKey)! : null;
    const shared = {
      name: def.name,
      level: def.level,
      // className tetap terisi walau santri belum berkelas, sesuai kolom wajib skema.
      className: classRoom?.name ?? "Belum Ditempatkan",
      classRoomId: classRoom?.id ?? null,
      parentId,
      phone: def.phone,
      address: def.address,
    };
    const student = await prisma.studentProfile.upsert({
      where: { studentNumber: def.studentNumber },
      update: shared,
      create: { ...shared, studentNumber: def.studentNumber },
      select: { id: true, name: true },
    });

    const key = def.classKey ?? "-";
    const indexInClass = indexCounter.get(key) ?? 0;
    indexCounter.set(key, indexInClass + 1);
    studentByNumber.set(def.studentNumber, { id: student.id, name: student.name, def, indexInClass });
  }

  const studentsByClass = new Map<string, { id: string; name: string; def: StudentDef; indexInClass: number }[]>();
  for (const student of studentByNumber.values()) {
    if (!student.def.classKey) continue;
    const list = studentsByClass.get(student.def.classKey) ?? [];
    list.push(student);
    studentsByClass.set(student.def.classKey, list);
  }

  /* ------------------- kelompok penilaian & kriteria sikap ---------------- */
  const groupIdByName = new Map<string, string>();
  for (const def of GROUPS) {
    const group = await prisma.assessmentGroup.upsert({
      where: { name_academicYear: { name: def.name, academicYear: PERIOD.academicYear } },
      update: { kind: def.kind, defaultMaxScore: def.defaultMaxScore, sortOrder: def.sortOrder },
      create: {
        name: def.name,
        kind: def.kind,
        defaultMaxScore: def.defaultMaxScore,
        sortOrder: def.sortOrder,
        academicYear: PERIOD.academicYear,
      },
      select: { id: true },
    });
    groupIdByName.set(def.name, group.id);

    for (let ci = 0; ci < def.criteria.length; ci += 1) {
      const criterion = def.criteria[ci];
      await prisma.behaviorCriterion.upsert({
        where: { groupId_name: { groupId: group.id, name: criterion.name } },
        update: { maxScore: criterion.maxScore, sortOrder: ci + 1 },
        create: { groupId: group.id, name: criterion.name, maxScore: criterion.maxScore, sortOrder: ci + 1 },
      });
    }
  }

  /* ---------------------------- mapel per kelas --------------------------- */
  const courses: SeededCourse[] = [];
  for (const classDef of CLASSES) {
    const classRoom = classByKey.get(classDef.key)!;
    const classSlug = slugify(classDef.name);
    let slotIndex = 0;

    for (const group of GROUPS) {
      for (const courseDef of group.courses) {
        const teacherKey = courseDef.teacherKey === "wali" ? classDef.homeroomKey : courseDef.teacherKey;
        const teacherId = isCourse(COURSE_WITHOUT_TEACHER, classDef.key, courseDef.title)
          ? null
          : userIdByKey.get(teacherKey)!;

        const slug = `${slugify(courseDef.title)}-${classSlug}`;
        const shared = {
          title: courseDef.title,
          description: `${courseDef.title} — kelompok ${group.name}, kelas ${classRoom.name}.`,
          level: classDef.level,
          status: CourseStatus.PUBLISHED,
          createdById: adminId,
          teacherId,
          assessmentGroupId: groupIdByName.get(group.name)!,
          classRoomId: classRoom.id,
          reportMaxScore: courseDef.maxScore,
        };
        const course = await prisma.course.upsert({
          where: { slug },
          update: shared,
          create: { ...shared, slug },
          select: { id: true },
        });

        const dayOfWeek = 1 + (slotIndex % 6);
        const startTime = SLOT_TIMES[Math.floor(slotIndex / 6) % SLOT_TIMES.length];
        const endTime = addMinutes(startTime, 60);
        slotIndex += 1;
        // Buat bila belum ada; jadwal tambahan buatan pengguna tidak dihapus.
        const existingSlot = await prisma.scheduleSlot.findFirst({
          where: { courseId: course.id, dayOfWeek, startTime },
          select: { id: true },
        });
        if (existingSlot) {
          await prisma.scheduleSlot.update({ where: { id: existingSlot.id }, data: { endTime, room: classRoom.name } });
        } else {
          await prisma.scheduleSlot.create({
            data: { courseId: course.id, dayOfWeek, startTime, endTime, room: classRoom.name },
          });
        }

        const weights = isCourse(COURSE_WITH_BROKEN_WEIGHTS, classDef.key, courseDef.title)
          ? GRADE_COMPONENTS.map((component, index) => ({
              title: component.title,
              weight: COURSE_WITH_BROKEN_WEIGHTS.weights[index],
            }))
          : GRADE_COMPONENTS.map((component) => ({ title: component.title, weight: component.weight }));

        courses.push({
          id: course.id,
          title: courseDef.title,
          classKey: classDef.key,
          groupName: group.name,
          groupSortOrder: group.sortOrder,
          maxScore: courseDef.maxScore,
          weights,
          enrolled: !isCourse(COURSE_WITHOUT_STUDENTS, classDef.key, courseDef.title),
        });
      }
    }
  }

  /* ------------------------ peserta mapel (enrolment) --------------------- */
  for (const classDef of CLASSES) {
    const students = studentsByClass.get(classDef.key) ?? [];
    const classCourses = courses.filter((course) => course.classKey === classDef.key && course.enrolled);
    const pairs = students.flatMap((student) =>
      classCourses.map((course) => ({ studentId: student.id, courseId: course.id })),
    );
    if (pairs.length === 0) continue;

    await prisma.enrollment.createMany({ data: pairs, skipDuplicates: true });
    await prisma.enrollment.updateMany({
      where: { studentId: { in: students.map((s) => s.id) }, courseId: { in: classCourses.map((c) => c.id) } },
      data: { status: EnrollmentStatus.ACTIVE },
    });
  }

  /* ------------------------- komponen & nilai santri ---------------------- */
  const finalScoreByStudentCourse = new Map<string, number>();
  const gradeRecords: { gradeItemId: string; studentId: string; score: number }[] = [];

  for (const course of courses) {
    const students = course.enrolled ? studentsByClass.get(course.classKey) ?? [] : [];

    for (let gi = 0; gi < course.weights.length; gi += 1) {
      const component = course.weights[gi];
      const dueAt = new Date(Date.now() + (gi * 21 + 14) * DAY);
      const item = await prisma.gradeItem.upsert({
        where: { courseId_title: { courseId: course.id, title: component.title } },
        update: {
          maxScore: 100,
          weight: component.weight,
          dueAt,
          semester: PERIOD.semester,
          academicYear: PERIOD.academicYear,
        },
        create: {
          courseId: course.id,
          title: component.title,
          description: `${component.title} (bobot ${component.weight}%)`,
          maxScore: 100,
          weight: component.weight,
          dueAt,
          semester: PERIOD.semester,
          academicYear: PERIOD.academicYear,
        },
        select: { id: true },
      });

      for (const student of students) {
        const score = det(student.def.studentNumber, course.classKey, course.title, component.title);
        gradeRecords.push({ gradeItemId: item.id, studentId: student.id, score });
      }
    }

    // Nilai akhir 0-100 = rata-rata berbobot komponen, sama seperti lib/rapor.ts.
    for (const student of students) {
      const totalWeight = course.weights.reduce((sum, w) => sum + w.weight, 0);
      const weighted = course.weights.reduce(
        (sum, w) => sum + det(student.def.studentNumber, course.classKey, course.title, w.title) * (w.weight / totalWeight),
        0,
      );
      finalScoreByStudentCourse.set(`${student.id}:${course.id}`, Math.round(weighted));
    }
  }
  for (let i = 0; i < gradeRecords.length; i += 500) {
    await prisma.gradeRecord.createMany({ data: gradeRecords.slice(i, i + 500), skipDuplicates: true });
  }

  /* ------------------------------- absensi -------------------------------- */
  const sessionDates = [21, 14, 7].map((back) => new Date(Date.now() - back * DAY));
  const attendanceRecords: { attendanceSessionId: string; studentId: string; status: AttendanceStatus }[] = [];

  for (const course of courses) {
    const students = course.enrolled ? studentsByClass.get(course.classKey) ?? [] : [];
    for (let se = 0; se < SESSION_COUNT; se += 1) {
      const heldAt = sessionDates[se];
      const session = await prisma.attendanceSession.upsert({
        where: { courseId_title: { courseId: course.id, title: `Pertemuan ${se + 1}` } },
        update: { heldAt, semester: PERIOD.semester, academicYear: PERIOD.academicYear },
        create: {
          courseId: course.id,
          title: `Pertemuan ${se + 1}`,
          heldAt,
          semester: PERIOD.semester,
          academicYear: PERIOD.academicYear,
        },
        select: { id: true },
      });

      for (const student of students) {
        attendanceRecords.push({
          attendanceSessionId: session.id,
          studentId: student.id,
          status: attendancePattern(student.indexInClass)[se],
        });
      }
    }
  }
  for (let i = 0; i < attendanceRecords.length; i += 500) {
    await prisma.attendanceRecord.createMany({ data: attendanceRecords.slice(i, i + 500), skipDuplicates: true });
  }

  /* --------------------------- administrasi santri ------------------------ */
  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [academicYearStart, academicYearEnd] = PERIOD.academicYear.split("/").map(Number);
  // GANJIL = Juli-Desember tahun awal; GENAP = Januari-Juni tahun akhir.
  const SPP_MONTHS = PERIOD.semester === Semester.GANJIL
    ? [6, 7, 8, 9, 10, 11].map((month) => ({ month, year: academicYearStart }))
    : [0, 1, 2, 3, 4, 5].map((month) => ({ month, year: academicYearEnd }));
  const SPP_ITEMS = SPP_MONTHS.map(({ month, year }, idx) => ({
    name: `SPP ${MONTH_NAMES[month]} ${year}`,
    description: `Pembayaran SPP bulan ${MONTH_NAMES[month]} ${year} telah lunas.`,
    sortOrder: idx + 1,
  }));
  const ADMIN_ITEMS = [
    ...SPP_ITEMS,
    { name: "Daftar Ulang", description: "Formulir daftar ulang dan berkas pendukung sudah diserahkan.", sortOrder: SPP_ITEMS.length + 1 },
    { name: "Infaq Kegiatan Santri", description: "Infaq kegiatan pondok semester berjalan telah dibayarkan.", sortOrder: SPP_ITEMS.length + 2 },
  ];
  /** Skenario palang ACC: santri ini menyisakan satu item administrasi. */
  const OUTSTANDING = { studentNumber: "20262002", itemName: "Daftar Ulang" };

  for (const def of ADMIN_ITEMS) {
    const item = await prisma.administrationItem.upsert({
      where: {
        name_academicYear_semester: {
          name: def.name,
          academicYear: PERIOD.academicYear,
          semester: PERIOD.semester,
        },
      },
      update: { description: def.description, sortOrder: def.sortOrder, active: true },
      create: {
        name: def.name,
        description: def.description,
        academicYear: PERIOD.academicYear,
        semester: PERIOD.semester,
        sortOrder: def.sortOrder,
        active: true,
      },
      select: { id: true },
    });

    for (const student of studentByNumber.values()) {
      const fulfilled = !(student.def.studentNumber === OUTSTANDING.studentNumber && def.name === OUTSTANDING.itemName);
      const note = fulfilled ? null : "Formulir daftar ulang belum diserahkan ke bagian administrasi.";
      await prisma.studentAdministration.upsert({
        where: { studentId_itemId: { studentId: student.id, itemId: item.id } },
        update: { fulfilled, note, updatedById: adminId },
        create: { studentId: student.id, itemId: item.id, fulfilled, note, updatedById: adminId },
      });
    }
  }

  /* ---------------------------------- rapor ------------------------------- */
  const REPORT_CARDS: {
    studentNumber: string;
    status: ReportCardStatus;
    homeroomNote: string | null;
    adminNote: string | null;
  }[] = [
    {
      studentNumber: "20262004",
      status: ReportCardStatus.DRAFT,
      homeroomNote: null,
      adminNote: null,
    },
    {
      studentNumber: "20262002",
      status: ReportCardStatus.SUBMITTED,
      homeroomNote: "Hafalan berkembang baik, kedisiplinan salat berjamaah perlu ditingkatkan.",
      adminNote: null,
    },
    {
      studentNumber: "20262003",
      status: ReportCardStatus.APPROVED,
      homeroomNote: "Aktif di kegiatan asrama dan konsisten menyetorkan hafalan.",
      adminNote: "Administrasi lengkap, rapor disetujui.",
    },
    {
      studentNumber: "20263001",
      status: ReportCardStatus.REJECTED,
      homeroomNote: "Perlu pendampingan pada mata pelajaran bahasa.",
      adminNote: "Rekap ketidakhadiran belum sesuai buku absensi asrama, mohon disusun ulang.",
    },
    {
      studentNumber: "20262001",
      status: ReportCardStatus.PUBLISHED,
      homeroomNote: "Alhamdulillah, hafalan dan akhlak berkembang baik. Pertahankan.",
      adminNote: "Administrasi lengkap, rapor disetujui.",
    },
    {
      studentNumber: "20261001",
      status: ReportCardStatus.PUBLISHED,
      homeroomNote: "Mulai lancar membaca Al-Qur'an. Terus dibiasakan murajaah di rumah.",
      adminNote: "Administrasi lengkap, rapor disetujui.",
    },
  ];

  const behaviorCriteria = GROUPS.flatMap((group) =>
    group.kind === AssessmentGroupKind.BEHAVIOR ? group.criteria : [],
  );

  for (const def of REPORT_CARDS) {
    const student = studentByNumber.get(def.studentNumber)!;
    const classKey = student.def.classKey!;
    const homeroomId = userIdByKey.get(classByKey.get(classKey)!.def.homeroomKey)!;
    const submitted = def.status !== ReportCardStatus.DRAFT;
    const reviewed = def.status === ReportCardStatus.APPROVED || def.status === ReportCardStatus.REJECTED || def.status === ReportCardStatus.PUBLISHED;
    const published = def.status === ReportCardStatus.PUBLISHED;

    const marks = attendancePattern(student.indexInClass);
    const recap = {
      sickCount: marks.filter((m) => m === AttendanceStatus.SICK).length,
      excusedCount: marks.filter((m) => m === AttendanceStatus.EXCUSED).length,
      otherCount: marks.filter((m) => m === AttendanceStatus.ABSENT || m === AttendanceStatus.LATE).length,
    };

    const shared = {
      semester: PERIOD.semester,
      academicYear: PERIOD.academicYear,
      status: def.status,
      homeroomNote: def.homeroomNote,
      adminNote: def.adminNote,
      studentNameSnapshot: student.def.name,
      studentNumberSnapshot: student.def.studentNumber,
      classNameSnapshot: classByKey.get(classKey)!.name,
      levelSnapshot: student.def.level as string,
      submittedAt: submitted ? new Date(Date.now() - 6 * DAY) : null,
      reviewedAt: reviewed ? new Date(Date.now() - 4 * DAY) : null,
      reviewedById: reviewed ? adminId : null,
      publishedAt: published ? new Date(Date.now() - 2 * DAY) : null,
      createdById: homeroomId,
      ...recap,
    };

    const card = await prisma.reportCard.upsert({
      where: {
        studentId_semester_academicYear: {
          studentId: student.id,
          semester: PERIOD.semester,
          academicYear: PERIOD.academicYear,
        },
      },
      update: shared,
      create: { studentId: student.id, ...shared },
      select: { id: true },
    });

    const entries = courses
      .filter((course) => course.classKey === classKey && course.enrolled)
      .map((course) => {
        const finalScore = finalScoreByStudentCourse.get(`${student.id}:${course.id}`) ?? 0;
        const scoreValue = Math.min(course.maxScore, Math.max(0, Math.round((finalScore / 100) * course.maxScore)));
        return {
          reportCardId: card.id,
          courseId: course.id,
          courseTitle: course.title,
          groupName: course.groupName,
          groupSortOrder: course.groupSortOrder,
          finalScore,
          maxScore: course.maxScore,
          scoreValue,
          scoreWords: terbilang(scoreValue),
          present: marks.filter((m) => m === AttendanceStatus.PRESENT).length,
          late: marks.filter((m) => m === AttendanceStatus.LATE).length,
          absent: marks.filter((m) => m === AttendanceStatus.ABSENT).length,
          excused: marks.filter((m) => m === AttendanceStatus.EXCUSED).length,
        };
      });

    // Nilai sikap diisi manual wali kelas; rapor yang masih DRAFT sengaja kosong.
    const behaviorEntries = behaviorCriteria.map((criterion, index) => ({
      reportCardId: card.id,
      criterionName: criterion.name,
      maxScore: criterion.maxScore,
      scoreValue:
        def.status === ReportCardStatus.DRAFT
          ? 0
          : Math.min(criterion.maxScore, 5 + (hashCode(`${student.def.studentNumber}|${criterion.name}`) % 3)),
      sortOrder: index + 1,
    }));

    await prisma.$transaction([
      prisma.reportCardEntry.deleteMany({ where: { reportCardId: card.id } }),
      prisma.reportCardBehaviorEntry.deleteMany({ where: { reportCardId: card.id } }),
      prisma.reportCardEntry.createMany({ data: entries }),
      prisma.reportCardBehaviorEntry.createMany({ data: behaviorEntries }),
    ]);
  }

  /* ------------------------------ PPDB / admisi --------------------------- */
  // Berkas unggahan demo: PNG 1x1 piksel, cukup untuk menguji alur unduh berkas.
  const DEMO_FILE = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const newStudent = studentByNumber.get("20262005")!;
  type AdmissionSeed = {
    registrationCode: string;
    childName: string;
    level: EducationLevel;
    gender: string;
    birthPlace: string;
    birthDate: Date;
    previousSchool: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    address: string;
    note: string;
    status: AdmissionStatus;
    reviewedAt?: Date;
    reviewedById?: string;
    createdStudentId?: string;
    createdParentId?: string;
    submitterId?: string;
  };
  const ADMISSIONS: {
    data: AdmissionSeed;
    documents: { kind: AdmissionDocumentKind; filename: string }[];
  }[] = [
    {
      // Pendaftaran menunggu tinjauan, lengkap dengan berkas unggahan.
      data: {
        registrationCode: "REG-2026-SMP-00000001",
        childName: "Zaidan Arkan Pratama",
        level: EducationLevel.SMP,
        gender: "L",
        birthPlace: "Bandung",
        birthDate: new Date("2013-04-17"),
        previousSchool: "SDN Ciwaruga 2",
        parentName: "Bapak Hasan Basri",
        parentPhone: "0812-2210-8845",
        parentEmail: `wali.hasan@${EMAIL_DOMAIN}`,
        address: "Kp. Ciwaruga RT 04/RW 06, Parongpong, Bandung Barat",
        note: "Mendaftar gelombang 1, berkas diunggah lengkap.",
        status: AdmissionStatus.PENDING,
        // Diajukan lewat akun wali sendiri, sehingga kartu "Status Pendaftaran"
        // di dasbor wali santri punya isi untuk ditampilkan.
        submitterId: userIdByKey.get("hasan")!,
      },
      documents: [
        { kind: AdmissionDocumentKind.FAMILY_CARD, filename: "kartu-keluarga.png" },
        { kind: AdmissionDocumentKind.BIRTH_CERTIFICATE, filename: "akta-kelahiran.png" },
      ],
    },
    {
      // Pendaftaran tanpa berkas, sudah diterima dan menghasilkan santri baru
      // yang belum ditempatkan di kelas.
      data: {
        registrationCode: "REG-2026-SMP-00000002",
        childName: "Bilal Arrahman Saputra",
        level: EducationLevel.SMP,
        gender: "L",
        birthPlace: "Cimahi",
        birthDate: new Date("2013-09-02"),
        previousSchool: "SDIT Al Fajar Lembang",
        parentName: "Ibu Dewi Ratnasari",
        parentPhone: "0821-1600-4478",
        parentEmail: `wali.dewi@${EMAIL_DOMAIN}`,
        address: "Jl. Raya Lembang No. 88, Lembang, Bandung Barat",
        note: "Berkas menyusul, diserahkan langsung ke administrasi.",
        status: AdmissionStatus.ACCEPTED,
        reviewedAt: new Date(Date.now() - 9 * DAY),
        reviewedById: adminId,
        createdStudentId: newStudent.id,
        createdParentId: userIdByKey.get("dewi")!,
        submitterId: userIdByKey.get("dewi")!,
      },
      documents: [],
    },
    {
      data: {
        registrationCode: "REG-2026-SMA-00000003",
        childName: "Hanif Ramadhan Yusuf",
        level: EducationLevel.SMA,
        gender: "L",
        birthPlace: "Subang",
        birthDate: new Date("2010-01-25"),
        previousSchool: "SMP Negeri 1 Subang",
        parentName: "Ibu Dewi Ratnasari",
        parentPhone: "0821-1600-4478",
        parentEmail: `wali.dewi@${EMAIL_DOMAIN}`,
        address: "Jl. Raya Lembang No. 88, Lembang, Bandung Barat",
        note: "Kuota jenjang SMA sudah penuh pada gelombang ini.",
        status: AdmissionStatus.REJECTED,
        reviewedAt: new Date(Date.now() - 5 * DAY),
        reviewedById: adminId,
        submitterId: userIdByKey.get("dewi")!,
      },
      documents: [],
    },
  ];

  for (const admission of ADMISSIONS) {
    // Satu wali bisa mendaftarkan lebih dari satu anak, jadi kunci pencocokan
    // harus memakai email wali DAN nama calon santri; memakai email saja membuat
    // pendaftaran kedua menimpa yang pertama saat seed dijalankan ulang.
    const parentEmail = admission.data.parentEmail;
    const existing = await prisma.admission.findFirst({
      where: { parentEmail, childName: admission.data.childName },
      select: { id: true },
    });
    const row = existing
      ? await prisma.admission.update({ where: { id: existing.id }, data: admission.data, select: { id: true } })
      : await prisma.admission.create({ data: admission.data, select: { id: true } });

    for (const doc of admission.documents) {
      const shared = { filename: doc.filename, mimeType: "image/png", size: DEMO_FILE.length, data: DEMO_FILE };
      await prisma.admissionDocument.upsert({
        where: { admissionId_kind: { admissionId: row.id, kind: doc.kind } },
        update: shared,
        create: { admissionId: row.id, kind: doc.kind, ...shared },
      });
    }
  }

  /* ------------------------- absensi ustadz & BKKH ------------------------ */
  // Enam hari kerja terakhir (Senin-Sabtu, Minggu dilewati) supaya grafik
  // rekap mingguan di dasbor selalu terisi penuh apa pun hari "hari ini".
  const staffDates: Date[] = [];
  for (let back = 0; staffDates.length < 6; back += 1) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    if (d.getDay() === 0) continue;
    staffDates.push(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  }
  for (let idx = 0; idx < TEACHING_KEYS.length; idx += 1) {
    const teacherId = userIdByKey.get(TEACHING_KEYS[idx])!;
    for (let di = 0; di < staffDates.length; di += 1) {
      const date = staffDates[di];
      // Satu ustadz izin dan satu sakit pada hari tertentu agar rekap tidak seragam.
      const status =
        idx === 1 && di === 1
          ? AttendanceStatus.EXCUSED
          : idx === 4 && di === 2
            ? AttendanceStatus.SICK
            : AttendanceStatus.PRESENT;
      await prisma.staffAttendance.upsert({
        where: { teacherId_date: { teacherId, date } },
        update: { status, recordedById: adminId },
        create: { teacherId, date, status, recordedById: adminId },
      });

      if (status !== AttendanceStatus.PRESENT) continue;
      const bkkh = {
        activity03000715: "Mendampingi qiyamul lail, salat Subuh berjamaah, dan halaqah tahfidz pagi.",
        activity07150900: "Persiapan pembelajaran dan pengarahan kebersihan kamar santri.",
        activity09301200: "Mengajar sesuai jadwal dan mencatat perkembangan belajar santri.",
        activity12301430: "Mendampingi salat Zuhur, makan siang, dan istirahat santri.",
        activity15301700: "Pendampingan kegiatan sore dan evaluasi setoran hafalan.",
        activity18002100: "Mendampingi salat Magrib, kajian malam, dan persiapan istirahat santri.",
      };
      await prisma.bkkhReport.upsert({
        where: { teacherId_date: { teacherId, date } },
        update: bkkh,
        create: { teacherId, date, ...bkkh },
      });
    }
  }

  /* --------------------- penanda tangan lembar rapor ---------------------- */
  // Nama pejabat pondok tidak dikeraskan di kode; administrasi menggantinya
  // lewat /akademik?tab=penandatangan.
  const APP_SETTINGS = [
    { key: "report.signatory.mudir.title", value: "Mudir Ma'had" },
    { key: "report.signatory.mudir.name", value: "Ustadz Abdurrahman Fauzi, Lc." },
    { key: "report.signatory.exam_chair.title", value: "Ketua Panitia Ujian" },
    { key: "report.signatory.exam_chair.name", value: "Ustadz Taufiq Ramadhan, Lc." },
  ];
  for (const setting of APP_SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  /* ------------------------------- ringkasan ------------------------------ */
  const [classCount, studentCount, unplacedCount, teacherCount, parentCount, groupRows, statusRows] = await Promise.all([
    prisma.classRoom.count(),
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { classRoomId: null } }),
    prisma.user.count({ where: { roles: { hasSome: [UserRole.TEACHER, UserRole.HOMEROOM] } } }),
    prisma.user.count({ where: { roles: { has: UserRole.PARENT } } }),
    prisma.assessmentGroup.findMany({
      orderBy: { sortOrder: "asc" },
      select: { name: true, _count: { select: { courses: true } } },
    }),
    prisma.reportCard.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  console.log(
    [
      `Kelas: ${classCount}`,
      `Santri: ${studentCount} (${unplacedCount} belum ditempatkan)`,
      `Ustadz: ${teacherCount}`,
      `Wali santri: ${parentCount}`,
      `Mapel per kelompok: ${groupRows.map((g) => `${g.name}=${g._count.courses}`).join(", ")}`,
      `Rapor per status: ${statusRows.map((r) => `${r.status}=${r._count._all}`).join(", ")}`,
    ].join("\n"),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof SeedAbortError ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
