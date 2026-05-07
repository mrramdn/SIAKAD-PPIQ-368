# Career Path RIASEC App

Aplikasi web monolit berbasis Next.js untuk asesmen minat RIASEC dan rekomendasi karir, jurusan, fakultas, serta kampus.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod
- Auth.js / NextAuth-style auth
- pnpm

## Development

```bash
pnpm install
pnpm db:generate
pnpm dev
```

Jalankan migration dan seed setelah `DATABASE_URL` tersedia di `.env`:

```bash
pnpm db:migrate
pnpm db:seed
```

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
pnpm db:studio
```

## Environment

Salin `.env.example` ke `.env`, lalu isi koneksi database dan secret auth.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="change-this-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Career Path RIASEC App"
```

## Development Order

1. Schema database dan migration.
2. Seed admin dan data placeholder.
3. Service, validation, route handler, atau server action.
4. UI fitur.
5. Manual test.

## Default Seed

Seeder awal menyiapkan:

- Admin: `admin@example.com` dengan password `password123`.
- 30 pertanyaan RIASEC.
- Data karir placeholder.
- Kampus, fakultas, jurusan, dan mapping karir placeholder.
- Rule rekomendasi RIASEC awal.
