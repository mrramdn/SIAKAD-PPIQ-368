# DESIGN.md

## Design Direction

Scene: wali santri membuka aplikasi dari HP untuk membuat akun, mendaftarkan anak, lalu memantau nilai, kehadiran, dan informasi anaknya tanpa datang ke sekolah. Wali kelas dan pengajar membuka panel untuk mengelola kelas, mengisi nilai, mencatat absensi, dan mengirim pengumuman. Administrasi meninjau pendaftaran santri baru dan dokumen pendukung.

Theme: calm school information dashboard.

Style: simple product UI with strong contrast, spacious cards, and clear action paths. Ringkas dan nyaman dibaca dari ponsel.

## Color System

UI uses a green palette defined as oklch tokens in `app/globals.css` and exposed to Tailwind v4 through `@theme` (`bg-primary`, `text-ink`, `border-line`, accent colors, etc.). Lightly green-toned neutrals dengan nuansa hijau pesantren. App theme color: `#2f9e57`.

Primary use:

- Lightly toned neutrals (`--bg`, `--surface`, `--text`) for shell, text, and structure.
- White for readable surfaces.
- Green `--primary` for primary actions, highlights, and progress; teal accent token as secondary accent (no purple).
- Amber for warning states.
- Red `--red` only for errors or destructive states.

## Typography

- Body uses a Plus Jakarta Sans-first system stack; monospace uses a JetBrains Mono-first system stack (`.mono`). Font variables are defined in `app/globals.css` so builds do not depend on fetching Google Fonts.
- Headings use strong weight and tight tracking.
- Body text uses clear line-height and readable measure.
- Numeric counts and percentages use tabular numbers where practical.

## Layout

- Mobile-first; wali adalah pengguna utama dan mengakses dari ponsel.
- Minimum interactive height: 44px.
- Use clear sections for landing, pendaftaran, login, dashboard, and admin panel.
- Avoid unnecessary nested cards.
- Parent pages prioritize child summary, per-subject grades, and attendance recap.
- Teacher/admin pages use summary cards, readable lists, compact forms, and per-section management.
- Admission review uses status tabs (pending/accepted/rejected) dengan kartu yang dapat diperluas.

## Forms

- Labels must remain visible.
- Errors appear near the form region they describe and explain the fix.
- Submit buttons must be easy to identify.
- Password fields use browser password manager autocomplete.
- Use Indonesian copy; avoid em dashes.

## Accessibility

- Contrast target: 4.5:1 for normal text.
- Focus rings must be visible.
- Do not convey state by color alone (admission/attendance states pair color with text labels).
- Keep keyboard tab order aligned with visual order.

## PWA

- Installable via `app/manifest.ts` with maskable icons in `public/icons`.
- Offline fallback page at `app/offline`; service worker (`public/sw.js`) uses network-first navigation and stale-while-revalidate for static assets.
