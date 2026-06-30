# Pesantren Digital

Sistem informasi pondok pesantren berbasis Next.js, Prisma, PostgreSQL, dan Tailwind CSS. Aplikasi menghubungkan pesantren dengan **wali santri**: wali membuat akun, mendaftarkan anak, lalu memantau nilai, kehadiran, dan informasi anaknya. Wali kelas dan pengajar mengelola kelas dan penilaian. Administrasi meninjau pendaftaran santri baru.

Mendukung tiga jenjang: **SD, SMP, dan SMA**. Aplikasi juga terpasang sebagai **PWA** (installable, ada halaman offline).

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma 7
- PostgreSQL
- Tailwind CSS v4
- pnpm
- PWA (manifest + service worker)

## Peran

- **Wali Santri**: buat akun, daftarkan anak, lihat dasbor anak, rincian nilai & kehadiran per mata pelajaran, informasi sekolah.
- **Wali Kelas**: pantau kelas binaan, nilai, absensi, dan informasi wali.
- **Pengajar**: kelola materi, isi nilai, catat kehadiran, kirim informasi ke wali.
- **Administrasi**: tinjau pendaftaran (PPDB), kelola pengguna, kelas, nilai, absensi, dan informasi.
- **Mudir Ma'had**: pantau pengguna, pembelajaran, nilai, absensi, dan informasi tanpa aksi pengelolaan.

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
- `app/pendaftaran`: formulir pendaftaran anak untuk wali yang sudah login + halaman sukses
- `app/login`, `app/pending`: alur auth
- `app/(app)`: app shell (sidebar + topbar) untuk pengguna terverifikasi
  - `dashboard`: dasbor per peran (wali memakai `ParentDashboard`)
  - `anak` & `anak/[childId]`: portal wali — daftar anak dan rincian nilai/kehadiran
  - `informasi`: pengumuman (wali baca, guru/admin kelola)
  - `penerimaan`: tinjauan pendaftaran (administrasi); menerima menautkan data santri ke akun wali
  - `learning`, `nilai`, `absen`, `pengguna`, `pengaturan`
  - `actions.ts`: server actions dengan guard per peran
- `components/ui`: komponen UI bersama dan ikon
- `lib/auth.ts`: session auth HTTP-only cookie (termasuk `requireParent`)
- `lib/lms.ts`: data access (dashboard, parent portal, informasi, pendaftaran)
- `lib/brand.ts`: nama aplikasi dan label jenjang
- `prisma/schema.prisma`: schema (User+role PARENT/HOMEROOM/TEACHER/MUDIR/ADMIN, EducationLevel, Admission, Announcement)
- `prisma/seed.ts`: seed admin, guru, santri 3 jenjang + wali, course, nilai, absensi, informasi, pendaftaran
- `app/manifest.ts`, `public/sw.js`, `components/PWARegister.tsx`: PWA
