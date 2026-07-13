# ORCHESTRATOR.md

Dokumen koordinasi pengerjaan penyederhanaan Pesantren Digital.
Backend dan skema dikerjakan lewat Claude Code. Frontend dikerjakan lewat Gemini dengan mengikuti kontrak di dokumen ini.

## 1. Scope Final

Fitur inti aplikasi ada 5:

1. Pendaftaran (PPDB)
2. Absensi
3. Penjadwalan
4. Pengelolaan Nilai
5. Pengelolaan Rapor

Catatan keputusan:

- Pengelolaan Nilai dan Pengelolaan Rapor tetap ditulis sebagai 2 use case di dokumen skripsi, tetapi diimplementasikan sebagai 1 modul. Rapor adalah rekap nilai dan absensi per semester yang difinalkan oleh wali kelas atau admin, lalu dibaca oleh wali santri.
- Fitur pendukung tetap ada tetapi bukan fokus skripsi: login/auth, pengelolaan pengguna, pengumuman (informasi), portal wali (anak saya).
- Modul learning (Course + Lesson) direposisi. Course dipakai sebagai "Mata Pelajaran" untuk keperluan jadwal, absensi, nilai, dan rapor. Konten Lesson (materi, video, kuis) tidak dikembangkan lebih lanjut dan tidak diklaim di skripsi.

## 2. Status Saat Ini (per Juli 2026)

| Fitur | Skema DB | Backend/Action | UI | Status |
|---|---|---|---|---|
| Pendaftaran | `Admission` | `reviewAdmissionAction` | `/pendaftaran`, `/penerimaan` | Selesai |
| Absensi | `AttendanceSession`, `AttendanceRecord` | create session, set status, mark all present | `/absen` | Selesai |
| Penjadwalan | `ScheduleSlot` (sudah ada) | Belum ada action kelola | Hanya tampil di dashboard | Setengah jadi |
| Pengelolaan Nilai | `GradeItem`, `GradeRecord` | create item, save grade | `/nilai` | Selesai |
| Pengelolaan Rapor | Belum ada model | Belum ada | Belum ada | Belum ada |

Kesimpulan: pekerjaan tersisa adalah melengkapi Penjadwalan (action + halaman) dan membangun Rapor dari nol (model + action + halaman).

## 3. Keputusan Desain Rapor

- Tambah konsep periode: `semester` (GANJIL/GENAP) dan `academicYear` (contoh "2025/2026") pada `GradeItem` dan `AttendanceSession`, supaya rekap bisa difilter per periode.
- Model baru `ReportCard`: satu rapor per santri per periode. Field: `studentId`, `semester`, `academicYear`, `homeroomNote`, `status` (DRAFT/PUBLISHED), `publishedAt`.
- Model baru `ReportCardEntry`: satu baris per mata pelajaran. Field: `reportCardId`, `courseId`, `courseTitle` (snapshot), `finalScore`, ringkasan absensi (`present`, `absent`, `late`, `excused`).
- Nilai akhir dihitung dari rata-rata `GradeRecord` per course pada periode itu, lalu di-snapshot saat rapor dibuat. Setelah PUBLISHED, rapor tidak berubah walau nilai sumber diedit.
- Wali santri hanya melihat rapor berstatus PUBLISHED milik anaknya sendiri (cek kepemilikan di server, pola sama dengan `lib/lms.ts`).

## 4. Pembagian Kerja

### Fase 1 — Backend (Claude Code)

- [x] Migrasi skema: enum `Semester` + `ReportCardStatus`, field `semester` + `academicYear` di `GradeItem` dan `AttendanceSession`, model `ReportCard` + `ReportCardEntry` (migrasi `20260713090000_add_period_and_report_card`).
- [x] `lib/lms.ts`: `getCurrentPeriod()`, `formatPeriod()`, `getScheduleBoard(level?)`, `computeReportEntries(studentId, period)`, `getReportBoard(period, className?)`, `getReportCardDetail(reportCardId)`, `getChildReportCards(parentId, childId)` dengan guard kepemilikan wali.
- [x] Server actions di `app/(app)/actions.ts`:
  - `createScheduleSlotAction(formData)` dan `deleteScheduleSlotAction(id)` (guard: TeacherOrAdmin)
  - `generateReportCardAction({ studentId, semester, academicYear })` (hitung + snapshot, tolak jika sudah PUBLISHED)
  - `saveHomeroomNoteAction({ reportCardId, note })` (hanya saat DRAFT)
  - `publishReportCardAction(reportCardId)` (set PUBLISHED + publishedAt)
  - `createGradeItemAction` dan `createAttendanceSessionAction` sekarang mengisi periode berjalan otomatis.
- [x] Update `prisma/seed.ts`: gradeItem + attendanceSession memakai periode berjalan; rapor demo untuk anak wali demo (SMA terbit, SMP draf).
- [x] Verifikasi: `pnpm lint` dan `pnpm build` lulus.
- [x] Migrasi diterapkan ke database dev (reset atas persetujuan user, 13 Juli 2026) dan seed ulang sukses. Fase 1 selesai; FE (Gemini) bisa mulai Fase 2.

### Fase 2 — Frontend (Gemini)

Kerjakan setelah Fase 1 selesai. Semua data lewat helper `lib/lms.ts` dan server action di atas; jangan query Prisma langsung dari komponen.

- [x] Halaman `/jadwal`: grid jadwal per hari difilter per jenjang; staf bisa tambah dan hapus slot, wali dan mudir hanya melihat.
- [x] Halaman `/rapor` + `/rapor/[id]`: daftar santri per kelas + periode, buat rapor, detail, catatan wali kelas, terbitkan. Wali di-redirect ke dashboard (diverifikasi).
- [x] Portal wali: tab "Rapor Semester" di `/anak/[childId]` menampilkan rapor PUBLISHED per periode.
- [x] Sidebar: link Jadwal (semua role) dan Rapor (staf + mudir) sudah ditambahkan di `nav.ts`.

Hasil QA 13 Juli 2026 (Claude): semua halaman dites runtime per role, guard benar, konten benar. Dua bug validasi query param (`/jadwal?level=` dan `/rapor?semester=`) menyebabkan 500, sudah diperbaiki dan dites ulang.

### Fase 3 — Penyelarasan Dokumen

- [ ] Update `USE_CASE_REVISI.md` dan `PRODUCT.md`: hapus klaim modul pembelajaran/lesson, tambahkan Penjadwalan dan alur Rapor (buat, catatan, terbitkan, lihat oleh wali).
- [ ] Verifikasi menyeluruh: `pnpm prisma db push`, `pnpm prisma db seed`, `pnpm build`, uji manual per role.

## 5. Aturan untuk Agen FE (Gemini)

Ringkasan dari `AGENTS.md`, wajib dipatuhi:

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4. `params` dan `searchParams` adalah async (harus di-await).
- Pakai `pnpm`, bukan npm/yarn.
- Server component secara default; `"use client"` hanya jika perlu state/event/browser API.
- Semua fungsi yang dibatasi role dijaga di server (`lib/auth.ts`: `requireParent`, `requireAdmin`, `requireTeacherOrAdmin`, dst). Wali hanya boleh melihat anaknya sendiri.
- Jangan query Prisma dari komponen UI; akses data lewat `lib/lms.ts`.
- Copy berbahasa Indonesia, kalimat langsung, tanpa em dash, label form selalu terlihat di atas input, pesan error menjelaskan solusinya.
- Ikuti pola UI yang sudah ada di `components/ui/` dan halaman `/nilai` serta `/absen`.

Template prompt per task untuk Gemini:

```text
Baca ORCHESTRATOR.md dan AGENTS.md. Kerjakan task Fase 2 nomor <N>.
Ikuti kontrak helper dan server action yang sudah tersedia, jangan membuat
akses data baru. Setelah selesai jalankan pnpm lint dan pnpm build.
```

## 6. Perbaikan Pasca-QA (13 Juli 2026)

- [x] Jadwal wali: hanya menampilkan jadwal mapel yang diikuti anaknya sendiri (`getParentScheduleBoard`), dengan tab per anak jika lebih dari satu.
- [x] Jadwal: slot ditampilkan sebagai baris datar (tidak ada card di dalam card), input waktu memakai `type="time"`, format jam dinormalisasi ke `HH:MM` di action, helper, dan seed.
- [x] Pendaftaran anak dipindah ke dalam shell dashboard (`app/(app)/pendaftaran`), URL tetap `/pendaftaran`; non-wali diarahkan ke Penerimaan/Dashboard.

## 7. Backlog (dikerjakan terakhir)

- [ ] PWA: sempurnakan pengalaman installable + offline (manifest dan service worker dasar sudah ada di `app/manifest.ts` + `public/sw.js`; perlu review caching, halaman offline, dan uji install di ponsel). Dikerjakan paling akhir setelah semua fitur inti stabil, atas permintaan user 13 Juli 2026.

## 8. Definisi Selesai

Skripsi bisa mendemokan alur penuh: wali daftar akun dan mendaftarkan anak, admin menerima pendaftaran, staf menyusun jadwal, mengisi absensi dan nilai per semester, membuat lalu menerbitkan rapor, dan wali melihat jadwal, absensi, nilai, serta rapor anaknya dari ponsel.
