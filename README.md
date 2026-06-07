# General LMS

General LMS adalah fondasi Learning Management System berbasis Next.js, Prisma, PostgreSQL, dan Tailwind CSS.

Project ini dibuat general agar bisa disesuaikan setelah konsep final disetujui. Fitur saat ini mencakup registrasi siswa, verifikasi admin, dashboard siswa, admin panel, course, lesson, enrollment, absensi, dan nilai.

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma 7
- PostgreSQL
- Tailwind CSS v4
- pnpm

## Demo Account

Seed database membuat akun berikut:

- Admin: `admin@example.com` / `password123`
- Teacher: `teacher@example.com` / `password123`
- Siswa verified: `user@example.com` / `password123`
- Siswa pending: `pending@example.com` / `password123`

## Setup

Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` sesuai database PostgreSQL yang dipakai.

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push --force-reset --accept-data-loss
pnpm prisma db seed
pnpm dev
```

Buka `http://localhost:3000` untuk melihat aplikasi.

## Scripts

- `pnpm dev`: menjalankan development server
- `pnpm build`: generate Prisma Client lalu build Next.js
- `pnpm start`: menjalankan production server
- `pnpm lint`: menjalankan ESLint untuk source app
- `pnpm db:generate`: generate Prisma Client
- `pnpm db:migrate`: membuat migration development
- `pnpm db:deploy`: menjalankan migration production
- `pnpm db:seed`: menjalankan seed database
- `pnpm db:studio`: membuka Prisma Studio

## Struktur Utama

- `app/page.tsx`: landing page LMS
- `app/register`, `app/login`, `app/pending`: alur auth dan verifikasi
- `app/(app)`: app shell (sidebar + topbar) untuk pengguna terverifikasi
  - `dashboard`: dasbor role-aware (siswa, guru, admin)
  - `learning` & `learning/[id]`: daftar kelas dan detail kelas (materi, enrollment)
  - `nilai`: gradebook (admin/guru edit, siswa read-only)
  - `absen`: absensi grid (admin/guru edit, siswa read-only)
  - `pengguna`: manajemen + verifikasi pengguna (admin)
  - `pengaturan`: profil dan preferensi akun
  - `actions.ts`: server actions LMS dengan guard per peran
- `app/logout/route.ts`: logout route handler
- `components/ui`: komponen UI bersama dan ikon
- `lib/auth.ts`: session auth berbasis HTTP-only cookie
- `lib/lms.ts`: data access untuk seluruh layar LMS
- `lib/prisma.ts`: Prisma client singleton
- `prisma/schema.prisma`: schema database LMS
- `prisma/seed.ts`: seed admin, guru, satu kelas siswa, course, lesson, jadwal, enrollment, absensi, dan nilai
