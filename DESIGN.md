# DESIGN.md

## Design Direction

Scene: siswa membuka LMS dari laptop atau HP untuk melihat kursus, progres, absensi, dan nilai. Admin membuka panel untuk memverifikasi siswa, memasukkan course, mengatur lesson, enroll siswa, mencatat absen, dan mengisi nilai.

Theme: calm learning dashboard.

Style: simple product UI with strong contrast, spacious cards, and clear action paths.

## Color System

UI uses a green palette defined as oklch tokens in `app/globals.css` and exposed to Tailwind v4 through `@theme` (`bg-primary`, `text-ink`, `border-line`, accent colors, etc.). Lightly green-toned neutrals. Keep it consistent until a final brand direction is approved.

Primary use:

- Lightly toned neutrals (`--bg`, `--surface`, `--text`) for shell, text, and structure.
- White for readable surfaces.
- Green `--primary` for primary actions, highlights, and progress; teal `--violet` token as secondary accent (no purple).
- Amber for warning states.
- Red `--red` only for errors or destructive states.

## Typography

- Body uses Plus Jakarta Sans; monospace uses JetBrains Mono (`.mono`), both loaded via `next/font` in `app/layout.tsx`.
- Headings use strong weight and tight tracking.
- Body text uses clear line-height and readable measure.
- Numeric counts and percentages use tabular numbers where practical.

## Layout

- Mobile-first.
- Minimum interactive height: 44px.
- Use clear sections for landing, login, dashboard, and admin panel.
- Avoid unnecessary nested cards.
- Admin pages use summary cards, readable course lists, compact forms, and per-course management sections.
- Student pages prioritize enrolled courses, attendance history, and recent grades.

## Forms

- Labels must remain visible.
- Errors appear near the form region they describe.
- Submit buttons must be easy to identify.
- Password fields use browser password manager autocomplete.

## Accessibility

- Contrast target: 4.5:1 for normal text.
- Focus rings must be visible.
- Do not convey state by color alone.
- Keep keyboard tab order aligned with visual order.
