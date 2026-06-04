# General LMS Agent Rules

## Project Context

This project is a general Learning Management System built as a Next.js monolith. The current scope covers student registration, admin verification, student dashboard, admin dashboard, course data, lesson data, enrollment data, attendance, and grades.

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

## Next.js Version Rule

This is NOT the Next.js you know.

This project uses a newer Next.js version with breaking changes. APIs, conventions, and file structure may differ from older examples or training data. Read relevant local Next.js package docs when available and prefer current project conventions.

## Development Principles

- Use `pnpm` for package and script commands.
- Do not use `npm`, `yarn`, `package-lock.json`, or `yarn.lock`.
- Keep the app as a Next.js monolith.
- Use Prisma as the official database access layer.
- Protect admin functionality on the server side.
- New student accounts must stay `PENDING` until an admin verifies them.
- Store passwords only as hashes.
- Do not commit `.env`, `.env.local`, `.env.production`, or `.env.staging`.
- Keep the LMS general until the final product concept is approved.

## Project Structure

```text
app/
  admin/
  dashboard/
  login/
  logout/
  register/
  pending/
lib/
  auth.ts
  lms.ts
  prisma.ts
prisma/
  migrations/
  schema.prisma
  seed.ts
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
