# SIAKAD PPIQ-368

Sistem informasi akademik Pondok Pesantren Integritas Qur'ani 368 berbasis Next.js, Prisma, PostgreSQL, dan Tailwind CSS. Aplikasi menghubungkan pesantren dengan **wali santri**: wali membuat akun, mendaftarkan anak, lalu memantau jadwal, nilai, kehadiran, dan rapor anaknya.

## Fitur Inti

1. **Pendaftaran (PPDB)**: wali mendaftarkan anak dari dashboard, administrasi meninjau dan menerima.
2. **Absensi**: pencatatan kehadiran santri per sesi pelajaran.
3. **Penjadwalan**: jadwal pelajaran per pekan per jenjang; wali hanya melihat jadwal anaknya.
4. **Pengelolaan Nilai**: komponen nilai per mata pelajaran per periode (semester + tahun ajaran).
5. **Pengelolaan Rapor**: rekap nilai + absensi per semester di-snapshot menjadi rapor, diberi catatan wali kelas, lalu diterbitkan ke wali.
6. **Absensi Ustadz dan BKKH**: kehadiran harian ustadz/wali kelas + laporan manual kegiatan harian berdasarkan enam rentang waktu tetap; ustadz mengisi laporan sendiri, administrasi mencatat kehadiran, dan mudir memantau.

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
- **Wali Kelas**: kelola nilai dan absensi hanya pada mapel yang ditugaskan, serta kelola catatan dan penerbitan rapor.
- **Ustadz**: isi nilai dan absensi pada mapel yang diampu, isi BKKH pribadi.
- **Administrasi**: tinjau PPDB, kelola akun dan role, absensi ustadz, checklist administrasi santri, serta ACC dan penyerahan rapor. Administrasi tidak mengelola kelas, mapel, maupun kelompok penilaian.
- **Mudir Ma'had**: kelola kelas, mata pelajaran, ustadz pengampu, jadwal, dan kelompok penilaian; awasi kehadiran dan BKKH ustadz serta hasil akademik. Mudir tidak mengelola akun atau PPDB.

## Demo Account

Seed database membuat akun demo di domain `@ppiq368.sch.id`. Kata sandi awalnya
sama untuk semua akun dan didefinisikan di `prisma/seed.ts` — sengaja tidak
ditulis di sini maupun ditampilkan di aplikasi.

- Administrasi: `administrasi@`
- Mudir Ma'had: `mudir@`
- Wali kelas: `ridwan.nurhakim@`, `salman.ghifari@`, `hamdan.mutaqin@` (yang terakhir merangkap Ustadz)
- Ustadz: `hafidz.maulana@`, `imron.nawawi@`, `taufiq.ramadhan@`
- Wali santri: `wali.hasan@` (punya 2 anak), `wali.dewi@`, dan enam lainnya

Rincian skenario pengujian beserta akun yang dipakai ada di [`SKENARIO-UJI.md`](SKENARIO-UJI.md).

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
  - `jadwal`: jadwal pelajaran per pekan (mudir kelola per jenjang; pengguna lain melihat sesuai konteks)
  - `nilai`, `absen`: ustadz dan wali kelas mengelola mapel yang ditugaskan; Mudir memantau read-only
  - `absen-ustadz`: absensi harian ustadz/wali kelas + laporan BKKH per slot waktu + rekap bulanan
  - `rapor` & `rapor/[id]`: Wali Kelas mengelola rapor; Mudir memantau read-only
  - `mapel`: daftar mata pelajaran, penugasan ustadz, dan pendaftaran peserta (mudir)
  - `pengguna`: manajemen akun khusus administrasi
  - `pengaturan`: profil akun sendiri
  - `actions.ts`: server actions dengan guard per peran
- `components/ui`: komponen UI bersama dan ikon
- `lib/auth.ts`: session auth HTTP-only cookie (termasuk `requireParent`)
- `lib/lms.ts`: data access (dashboard, jadwal, rapor, parent portal, pendaftaran, helper periode)
- `lib/brand.ts`: nama aplikasi dan label jenjang
- `prisma/schema.prisma`: schema (User + role, EducationLevel, Semester, Admission, Course + ustadz pengampu, ScheduleSlot, GradeItem/GradeRecord, AttendanceSession/Record, StaffAttendance, BkkhReport, ReportCard/ReportCardEntry)
- `prisma/seed.ts`: seed akun demo, santri 3 jenjang, mapel + jadwal, nilai + absensi per periode, dan rapor demo
- `app/manifest.ts`, `public/sw.js`, `components/PWARegister.tsx`: PWA

Setelah migrasi penugasan pengampu diterapkan pada database lama, Mudir perlu membuka `/akademik` dan menugaskan ulang mapel yang ditandai belum memiliki ustadz pengampu. Sistem menolak perubahan role, status, atau penghapusan akun pengampu selama masih ada mapel aktif yang ditugaskan kepadanya.
