# DESIGN.md

## Design Direction

Scene: siswa membuka LMS dari laptop atau HP untuk melihat kursus, progres, absensi, dan nilai. Admin membuka panel untuk memverifikasi siswa, memasukkan course, mengatur lesson, enroll siswa, mencatat absen, dan mengisi nilai.

Theme: calm learning dashboard.

Style: simple product UI with strong contrast, spacious cards, and clear action paths.

## Color System

Current UI uses a slate and cyan palette. Keep it consistent until a final brand direction is approved.

Primary use:

- Slate for shell, text, and structure.
- White for readable surfaces.
- Cyan for primary actions, highlights, and progress.
- Red only for errors or destructive states.

## Typography

- Use the current Next.js Geist font stack.
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
