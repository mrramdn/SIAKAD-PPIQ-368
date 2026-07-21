# Pesantren Digital

Sistem informasi pondok pesantren berbasis Next.js, Prisma, PostgreSQL, dan Tailwind CSS. Aplikasi menghubungkan pesantren dengan **wali santri**: wali membuat akun, mendaftarkan anak, lalu memantau jadwal, nilai, kehadiran, dan rapor anaknya.

## Fitur Inti

1. **Pendaftaran (PPDB)**: wali mendaftarkan anak dari dashboard, administrasi meninjau dan menerima.
2. **Absensi**: pencatatan kehadiran santri per sesi pelajaran.
3. **Penjadwalan**: jadwal pelajaran per pekan per jenjang; wali hanya melihat jadwal anaknya.
4. **Pengelolaan Nilai**: komponen nilai per mata pelajaran per periode (semester + tahun ajaran).
5. **Pengelolaan Rapor**: rekap nilai + absensi per semester di-snapshot menjadi rapor, diberi catatan wali kelas, lalu diterbitkan ke wali.
6. **Absensi Ustadz dan BKKH**: kehadiran harian pengajar/wali kelas + laporan manual kegiatan harian berdasarkan enam rentang waktu tetap; ustadz mengisi laporan sendiri, administrasi mencatat kehadiran, dan mudir memantau.

Mendukung tiga jenjang: **SD, SMP, dan SMA**. Aplikasi juga terpasang sebagai **PWA** (installable, halaman terakhir bisa dibuka saat offline).

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma 7
- PostgreSQL
- Tailwind CSS v4
- pnpm
- PWA (manifest + service worker)

## Peran

- **Wali Santri**: buat akun, daftarkan anak, lihat jadwal, nilai, kehadiran, dan rapor anaknya sendiri.
- **Wali Kelas**: pantau kelas binaan; kelola nilai, absensi, jadwal, catatan wali kelas, dan penerbitan rapor.
- **Pengajar**: isi nilai, catat kehadiran, kelola jadwal dan rapor, kirim informasi ke wali.
- **Administrasi**: tinjau pendaftaran (PPDB), kelola pengguna, mapel, jadwal, nilai, absensi, rapor, dan informasi.
- **Mudir Ma'had**: pantau seluruh data tanpa aksi pengelolaan.

## Demo Account

Seed database membuat akun berikut (kata sandi `password123`):

- Administrasi: `admin@pesantren.id`
- Mudir: `mudir@pesantren.id`
- Wali kelas: `walikelas@pesantren.id`
- Pengajar: `guru@pesantren.id` (juga `guru2@`, `guru3@`)
- Wali santri (punya 2 anak: SMP & SMA): `wali@pesantren.id`

## Setup

Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL`. Untuk lokal cepat dengan Docker:

```bash
docker run -d --name pesantren-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=pesantren -p 5432:5432 postgres:16
```

```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Buka `http://localhost:3000`.

## Scripts

- `pnpm dev`: development server
- `pnpm build`: generate Prisma Client lalu build Next.js
- `pnpm start`: production server
- `pnpm lint`: ESLint untuk `app lib prisma`
- `pnpm db:migrate` / `pnpm db:deploy` / `pnpm db:seed` / `pnpm db:studio`
- `node scripts/gen-icons.mjs`: regenerasi ikon PWA dari logo

## Struktur Utama

- `app/page.tsx`: landing pesantren
- `app/register`: pembuatan akun wali santri
- `app/login`, `app/pending`: alur auth
- `app/(app)`: app shell (sidebar + topbar) untuk pengguna terverifikasi
  - `dashboard`: dasbor per peran (wali memakai `ParentDashboard`)
  - `anak` & `anak/[childId]`: portal wali — daftar anak, rincian nilai/kehadiran, dan rapor terbit
  - `pendaftaran`: formulir pendaftaran anak (wali) + halaman sukses
  - `penerimaan`: tinjauan pendaftaran (administrasi); menerima menautkan data santri ke akun wali
  - `jadwal`: jadwal pelajaran per pekan (staf kelola per jenjang; wali melihat jadwal anaknya)
  - `nilai`, `absen`: pengelolaan nilai dan absensi per mapel
  - `absen-ustadz`: absensi harian pengajar/wali kelas + laporan BKKH per slot waktu + rekap bulanan
  - `rapor` & `rapor/[id]`: papan rapor per kelas, detail, catatan wali kelas, penerbitan
  - `informasi`: pengumuman (wali baca, guru/admin kelola)
  - `mapel`: daftar mata pelajaran + pendaftaran peserta (admin)
  - `pengguna`, `pengaturan`
  - `actions.ts`: server actions dengan guard per peran
- `components/ui`: komponen UI bersama dan ikon
- `lib/auth.ts`: session auth HTTP-only cookie (termasuk `requireParent`)
- `lib/lms.ts`: data access (dashboard, jadwal, rapor, parent portal, informasi, pendaftaran, helper periode)
- `lib/brand.ts`: nama aplikasi dan label jenjang
- `prisma/schema.prisma`: schema (User + role, EducationLevel, Semester, Admission, Announcement, Course/ScheduleSlot, GradeItem/GradeRecord, AttendanceSession/Record, StaffAttendance, ReportCard/ReportCardEntry)
- `prisma/seed.ts`: seed akun demo, santri 3 jenjang, mapel + jadwal, nilai + absensi per periode, dan rapor demo
- `app/manifest.ts`, `public/sw.js`, `components/PWARegister.tsx`: PWA
