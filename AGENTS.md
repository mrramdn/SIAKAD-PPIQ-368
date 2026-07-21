# Pesantren LMS Agent Rules

## Project Context

Pesantren Digital is an Islamic boarding school (pondok pesantren) information system built as a Next.js monolith. Its primary audience is **wali santri**: wali create an account, register one or more children, then monitor grades, attendance, and announcements. **Students (santri) do not log in** — their data is only viewed. Wali kelas and pengajar manage subjects, grades, attendance, and announcements. Administrasi review new-student admissions (PPDB). Mudir supervises read-only data. The system supports three levels: **SD, SMP, and SMA**.

Current scope is **6 core features** (see `ORCHESTRATOR.md`): (1) admissions/PPDB — parent account registration + in-dashboard child admission form with document URLs ready for Cloudinary, reviewed by admin; (2) attendance per course session; (3) scheduling — weekly schedule per level managed by staff, parents see only their own children's schedule; (4) grade management per course/period; (5) report cards — per-student per-semester snapshot of grades + attendance with homeroom note, published to parents; (6) staff attendance & BKKH (absensi ustadz) — daily attendance for teachers/homeroom (self check-in today, admin records anyone, mudir monitors) plus a manual daily activity report with an assignment field and six fixed time ranges (`BkkhReport`). Teachers/homeroom staff fill their own report for today; admin and mudir can review reports. Supporting features: announcements, user management, parent portal, mudir read-only supervision, installable PWA. The old learning/lesson module has been removed (18 Jul 2026): `Course` is now purely a subject (mata pelajaran) managed at `/mapel` (create subject + enroll students); the `Lesson` model and lesson content no longer exist.

Deployment: Vercel is used for **preview only**. Production will run on the user's own server via Docker (planned; user reports Vercel + Prisma performing slowly).

Primary stack:

- Next.js 16 App Router
- React 19
- TypeScript
- pnpm
- Tailwind CSS v4
- Prisma 7
- PostgreSQL
- bcryptjs
- Zod
- PWA (manifest + service worker)

## Next.js Version Rule

This is NOT the Next.js you know.

This project uses a newer Next.js version with breaking changes. APIs, conventions, and file structure may differ from older examples or training data. `params` and `searchParams` are async. Read relevant local Next.js package docs when available and prefer current project conventions.

## Development Principles

- Use `pnpm` for package and script commands.
- Do not use `npm`, `yarn`, `package-lock.json`, or `yarn.lock`.
- Keep the app as a Next.js monolith.
- Use Prisma as the official database access layer.
- Protect role-restricted functionality on the server side (admin, teacher, parent guards in `lib/auth.ts`).
- Parents must only ever see their own children (ownership checks in `lib/lms.ts`).
- Parent and santri accounts are created through admission review, not public self-registration.
- Store passwords only as hashes.
- Do not commit `.env`, `.env.local`, `.env.production`, or `.env.staging`.
- Keep branding centralized in `lib/brand.ts` (app name, level labels).

## Project Structure

```text
app/
  page.tsx              landing
  login/  logout/  pending/
  register/             wali account creation (public)
  offline/              PWA offline fallback
  manifest.ts           PWA manifest (installable, shortcuts)
  (app)/                authenticated shell (sidebar + topbar)
    dashboard/          role-based dashboard (ParentDashboard for wali)
    anak/  anak/[childId]/   parent portal: children + detail (grades, attendance, report cards)
    pendaftaran/        child admission form (PPDB) for logged-in wali + actions
    penerimaan/         admin admission review
    jadwal/             weekly schedule (staff manage per level; parents see own children only)
    nilai/              gradebook per course
    absen/              attendance per course session
    absen-ustadz/       daily staff attendance board + monthly recap
    rapor/  rapor/[id]/ report cards: per-class board, detail, homeroom note, publish
    informasi/          announcements (parents read, staff manage)
    mapel/  mapel/[id]/ subjects: list, create (admin), enroll students
    pengguna/ pengaturan/
    actions.ts          server actions with per-role guards
lib/
  auth.ts               session cookie auth (requireParent/Admin/AdminOrMudir/TeacherOrAdmin)
  lms.ts                data access (dashboard, schedule, report cards, parent portal, informasi, admissions, period helpers)
  brand.ts              app name + level labels (SD/SMP/SMA)
  prisma.ts
components/
  ui/                   shared UI kit
  PWARegister.tsx       service worker registration
prisma/
  migrations/
  schema.prisma         User roles, EducationLevel, Semester, Admission, Announcement,
                        Course/ScheduleSlot, GradeItem/GradeRecord (per period),
                        AttendanceSession/Record (per period), StaffAttendance,
                        ReportCard/ReportCardEntry
  seed.ts               demo users + data; report card demo (SMA published, SMP draft)
public/
  sw.js                 service worker (offline fallback + page/static caching)
scripts/
  gen-icons.mjs         PWA icon generator
```

## Vercel React Best Practices

- Start independent async work early and await it with `Promise.all()` where possible.
- Authenticate server actions and route handlers before privileged work.
- Use React `cache()` for per-request deduplication of server reads when appropriate.
- Do not store mutable request-specific state at module scope.
- Pass minimal serialized data from Server Components to Client Components.
- Prefer server components by default.
- Add `"use client"` only for components that need browser APIs, state, effects, or event handlers.
- Do not add `useMemo` or `useCallback` for simple primitive expressions.
- Do not query Prisma directly from UI components; keep data access in `lib/` helpers.

## Verification

Run relevant checks when dependencies and `DATABASE_URL` are ready:

```bash
pnpm lint
pnpm prisma generate
pnpm prisma db push --force-reset --accept-data-loss
pnpm prisma db seed
pnpm build
```
