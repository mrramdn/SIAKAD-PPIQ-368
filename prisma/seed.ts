import { PrismaClient, RiasecCode, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const envFile = readFileSync(".env", "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    process.env[key] ??= value;
  }
}

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const questions: Array<{ code: RiasecCode; question: string }> = [
  { code: "R", question: "Saya menyukai aktivitas praktik langsung atau pekerjaan teknis." },
  { code: "R", question: "Saya tertarik bekerja dengan alat, mesin, atau perlengkapan lapangan." },
  { code: "R", question: "Saya nyaman menyelesaikan tugas yang membutuhkan keterampilan fisik." },
  { code: "R", question: "Saya senang melihat hasil kerja yang konkret dan dapat digunakan." },
  { code: "R", question: "Saya tertarik pada kegiatan pertanian, teknik, otomotif, atau konstruksi." },
  { code: "I", question: "Saya senang menganalisis masalah dan mencari penyebabnya." },
  { code: "I", question: "Saya tertarik membaca data, melakukan riset, atau menguji hipotesis." },
  { code: "I", question: "Saya menikmati pelajaran sains, matematika, atau teknologi." },
  { code: "I", question: "Saya suka memecahkan soal yang membutuhkan logika." },
  { code: "I", question: "Saya tertarik mencari jawaban sebelum mengambil kesimpulan." },
  { code: "A", question: "Saya menyukai kegiatan kreatif seperti menulis, desain, atau seni." },
  { code: "A", question: "Saya nyaman mengekspresikan ide melalui karya." },
  { code: "A", question: "Saya tertarik pada bahasa, musik, visual, atau media kreatif." },
  { code: "A", question: "Saya senang mencari cara baru untuk menyampaikan gagasan." },
  { code: "A", question: "Saya menikmati tugas yang memberi ruang imajinasi." },
  { code: "S", question: "Saya senang membantu, mengajar, atau membimbing orang lain." },
  { code: "S", question: "Saya nyaman bekerja dalam kegiatan sosial atau pelayanan." },
  { code: "S", question: "Saya tertarik mendengar cerita orang dan memberi dukungan." },
  { code: "S", question: "Saya senang menjelaskan materi kepada teman." },
  { code: "S", question: "Saya tertarik pada bidang pendidikan, konseling, dakwah, atau kesehatan." },
  { code: "E", question: "Saya tertarik memimpin, berorganisasi, atau berwirausaha." },
  { code: "E", question: "Saya nyaman berbicara di depan orang untuk meyakinkan mereka." },
  { code: "E", question: "Saya suka mengambil keputusan dalam kelompok." },
  { code: "E", question: "Saya tertarik pada bisnis, manajemen, atau pemasaran." },
  { code: "E", question: "Saya menikmati kegiatan yang membutuhkan negosiasi atau strategi." },
  { code: "C", question: "Saya menyukai pekerjaan yang rapi, terstruktur, dan berbasis data." },
  { code: "C", question: "Saya nyaman mengelola dokumen, angka, jadwal, atau arsip." },
  { code: "C", question: "Saya senang mengikuti prosedur yang jelas." },
  { code: "C", question: "Saya teliti saat memeriksa detail pekerjaan." },
  { code: "C", question: "Saya tertarik pada administrasi, akuntansi, atau sistem informasi." },
];

const careers = [
  { name: "Konselor Pendidikan", description: "Membantu siswa memahami potensi dan pilihan pendidikan." },
  { name: "Guru", description: "Mendidik dan membimbing peserta didik di sekolah atau lembaga." },
  { name: "Data Analyst", description: "Mengolah data untuk mendukung keputusan organisasi." },
  { name: "Software Developer", description: "Membangun aplikasi dan sistem berbasis teknologi." },
  { name: "Desainer Komunikasi Visual", description: "Membuat solusi visual untuk komunikasi dan media." },
  { name: "Wirausaha", description: "Membangun dan mengelola usaha berbasis peluang pasar." },
  { name: "Akuntan", description: "Mengelola pencatatan, laporan, dan analisis keuangan." },
  { name: "Teknisi Lapangan", description: "Menangani pekerjaan teknis dan operasional di lapangan." },
];

const recommendationRules = [
  { riasecCode: "S", careerName: "Konselor Pendidikan", priority: 1 },
  { riasecCode: "S", careerName: "Guru", priority: 2 },
  { riasecCode: "I", careerName: "Data Analyst", priority: 1 },
  { riasecCode: "I", careerName: "Software Developer", priority: 2 },
  { riasecCode: "A", careerName: "Desainer Komunikasi Visual", priority: 1 },
  { riasecCode: "E", careerName: "Wirausaha", priority: 1 },
  { riasecCode: "C", careerName: "Akuntan", priority: 1 },
  { riasecCode: "R", careerName: "Teknisi Lapangan", priority: 1 },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin", passwordHash, role: UserRole.ADMIN },
    create: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await Promise.all(
    questions.map((item, index) =>
      prisma.riasecQuestion.upsert({
        where: { code_question: { code: item.code, question: item.question } },
        update: { order: index + 1, isActive: true },
        create: { ...item, order: index + 1 },
      }),
    ),
  );

  await Promise.all(
    careers.map((career) =>
      prisma.career.upsert({
        where: { name: career.name },
        update: { description: career.description, isActive: true },
        create: career,
      }),
    ),
  );

  const campus = await prisma.campus.upsert({
    where: { name: "Universitas Contoh Nusantara" },
    update: { city: "Bandung", province: "Jawa Barat", isActive: true },
    create: {
      name: "Universitas Contoh Nusantara",
      city: "Bandung",
      province: "Jawa Barat",
      website: "https://example.edu",
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { campusId_name: { campusId: campus.id, name: "Fakultas Ilmu Pendidikan dan Teknologi" } },
    update: { isActive: true },
    create: { campusId: campus.id, name: "Fakultas Ilmu Pendidikan dan Teknologi" },
  });

  const majors = [
    { name: "Bimbingan dan Konseling", careerName: "Konselor Pendidikan" },
    { name: "Pendidikan Agama Islam", careerName: "Guru" },
    { name: "Sistem Informasi", careerName: "Data Analyst" },
    { name: "Informatika", careerName: "Software Developer" },
    { name: "Desain Komunikasi Visual", careerName: "Desainer Komunikasi Visual" },
    { name: "Manajemen Bisnis", careerName: "Wirausaha" },
    { name: "Akuntansi", careerName: "Akuntan" },
    { name: "Teknik Industri", careerName: "Teknisi Lapangan" },
  ];

  for (const majorItem of majors) {
    const [major, career] = await Promise.all([
      prisma.major.upsert({
        where: { facultyId_name: { facultyId: faculty.id, name: majorItem.name } },
        update: { isActive: true },
        create: { facultyId: faculty.id, name: majorItem.name },
      }),
      prisma.career.findUniqueOrThrow({ where: { name: majorItem.careerName } }),
    ]);

    await prisma.majorCareer.upsert({
      where: { majorId_careerId: { majorId: major.id, careerId: career.id } },
      update: {},
      create: { majorId: major.id, careerId: career.id },
    });
  }

  for (const rule of recommendationRules) {
    const career = await prisma.career.findUniqueOrThrow({ where: { name: rule.careerName } });

    await prisma.recommendationRule.upsert({
      where: { riasecCode_careerId: { riasecCode: rule.riasecCode, careerId: career.id } },
      update: { priority: rule.priority, isActive: true },
      create: {
        riasecCode: rule.riasecCode,
        careerId: career.id,
        priority: rule.priority,
        note: "Rule placeholder untuk rekomendasi awal.",
      },
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
