# Pesantren LMS Agent Rules

## Project Context

Pesantren Digital is an Islamic boarding school (pondok pesantren) information system built as a Next.js monolith. Its primary audience is **wali santri (parents)**: parents monitor their child's grades, attendance, and announcements. **Students (santri) do not log in** — their data is only viewed. Teachers (guru) manage classes and assessment, and admins review new-student admissions (PPDB). The system supports three levels: **SD, SMP, and SMA**.

Current scope: public admission form, admin admission review (accepting auto-creates the parent account and santri record), parent portal (child list + per-subject grades and attendance), announcements, teacher class/grade/attendance management, user management, and an installable PWA.

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
  pendaftaran/          public admission form (PPDB) + actions
  login/  logout/  pending/
  register/             redirects to /pendaftaran
  offline/              PWA offline fallback
  manifest.ts           PWA manifest
  (app)/                authenticated shell (sidebar + topbar)
    dashboard/          role-based dashboard (ParentDashboard for wali)
    anak/  anak/[childId]/   parent portal: children + per-child detail
    informasi/          announcements (parents read, staff manage)
    penerimaan/         admin admission review
    learning/ nilai/ absen/ pengguna/ pengaturan/
    actions.ts          server actions with per-role guards
lib/
  auth.ts               session cookie auth (requireParent/Admin/TeacherOrAdmin)
  lms.ts                data access (dashboard, parent portal, informasi, admissions)
  brand.ts              app name + level labels (SD/SMP/SMA)
  prisma.ts
components/
  ui/                   shared UI kit
  PWARegister.tsx       service worker registration
prisma/
  migrations/
  schema.prisma         User+PARENT role, EducationLevel, Admission, Announcement
  seed.ts
public/
  sw.js                 service worker
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
