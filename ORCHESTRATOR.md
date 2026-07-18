# ORCHESTRATOR.md

Dokumen koordinasi pengerjaan penyederhanaan Pesantren Digital.
Backend dan skema dikerjakan lewat Claude Code. Frontend dikerjakan lewat Gemini dengan mengikuti kontrak di dokumen ini.

## 1. Scope Final

Fitur inti aplikasi ada 6 (mengikuti use case diagram arahan pembimbing, 18 Juli 2026):

1. Pendaftaran (PPDB)
2. Absensi Santri
3. Penjadwalan
4. Pengelolaan Nilai
5. Pengelolaan Rapor
6. Absensi Ustadz dan BKKH

Catatan keputusan:

- Pengelolaan Nilai dan Pengelolaan Rapor tetap ditulis sebagai 2 use case di dokumen skripsi, tetapi diimplementasikan sebagai 1 modul. Rapor adalah rekap nilai dan absensi per semester yang difinalkan oleh wali kelas atau admin, lalu dibaca oleh wali santri.
- Fitur pendukung tetap ada tetapi bukan fokus skripsi: login/auth, pengelolaan pengguna, pengumuman (informasi), portal wali (anak saya).
- Absensi Ustadz (18 Juli 2026): model `StaffAttendance` (unik per ustadz per tanggal, enum status sama dengan absensi santri), halaman `/absen-ustadz`. Aturan: ustadz/wali kelas menandai kehadiran sendiri untuk hari ini, administrasi mencatat siapa pun di tanggal mana pun, mudir memantau read-only, wali santri tidak punya akses. BKKH (18 Juli 2026, konfirmasi user): checklist kegiatan harian yang wajib dikerjakan ustadz. Model `BkkhActivity` (master kegiatan, dikelola admin) + `BkkhRecord` (centang per ustadz per tanggal). Ustadz mencentang kegiatannya sendiri untuk hari ini di `/absen-ustadz`; papan harian menampilkan capaian per ustadz; rekap bulanan punya kolom total BKKH.
- Modul learning lama sudah **dihapus** (18 Juli 2026): model `Lesson`, enum `LessonType`, dan kolom `Enrollment.progress` di-drop; route `/learning` diganti `/mapel` (kelola mata pelajaran + daftarkan peserta). Course murni berperan sebagai "Mata Pelajaran" untuk jadwal, absensi, nilai, dan rapor.

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

## 7. Fase UX Refinement (Gemini) — SELESAI (15 Juli 2026, PR #6)

Keenam temuan sudah dieksekusi Gemini dan lolos QA Claude. Catatan QA: temuan #6 diselesaikan Claude (letaknya di UI kit `components/ui/index.tsx`); patch tambahan alias token `--color-ink-1` di `globals.css`; bonus Gemini di temuan #4: section "Rapor Semester Terbaru" di dashboard wali (ownership check aman via `getChildReportCards`). Temuan #3 untuk `anak/page.tsx` sengaja tidak diubah karena `grid-cols-3` berisi angka kecil masih lega di 360px.

Fokus: pengalaman mobile (wali mengakses dari ponsel) dan mengurangi kebisingan visual. Kerjakan per halaman, uji setiap perubahan di viewport 360px.

### Temuan konkret (audit Claude, 13 Juli 2026)

1. **Tombol ganda di landing** (`app/page.tsx`): header punya "Login Wali" (± baris 26) dan hero punya "Login" (± baris 53) yang sama-sama menuju `/login` (saat login: dua-duanya "Buka Dashboard"). Sisakan satu CTA primary di hero; di header cukup satu link teks kecil. Audit juga halaman lain untuk pola serupa: dua tombol berbeda label menuju tujuan yang sama di satu layar itu dilarang.
2. **Stat tile 4 kolom tanpa breakpoint**: `app/(app)/rapor/[id]/page.tsx` (± baris 136) dan `app/(app)/anak/[childId]/page.tsx` (± baris 156) memakai `grid grid-cols-4` langsung sehingga sempit di layar 360px. Ubah ke `grid-cols-2 sm:grid-cols-4` atau satu baris ringkas "H 24 • I 2 • T 1 • A 3".
3. **Grid tanpa fallback mobile lain**: `app/(app)/pengguna/UserManager.tsx` (± baris 94, `grid-cols-2`) dan `app/(app)/anak/page.tsx` (± baris 39, `grid-cols-3`) perlu dicek di 360px; beri breakpoint bila sempit.
4. **Kepadatan card di dashboard**: dashboard staf dan `ParentDashboard` menumpuk banyak `Card` kecil (4 kartu stat + beberapa kartu list), di ponsel jadi gulungan panjang. Gabungkan yang satu klaster (mis. stat jadi satu card berisi baris/grid 2x2), dan urutkan konten wali: anak + rapor terbit + pengumuman di atas.
5. **Tabel lebar di mobile**: semua tabel ber-`minWidth` (nilai, absen, rapor, pengguna, detail anak) wajib berada dalam wrapper `overflow-x-auto`; kolom identitas (nama santri) dibuat sticky kiri seperti di `Gradebook.tsx` dan `AttendanceGrid.tsx`. Halaman tidak boleh scroll horizontal.
6. **Efek hover di elemen list**: `hover:-translate-y` pada item list tidak berguna di layar sentuh; hapus di item list, sisakan pada card navigasi utama saja.

### Aturan refine

- Satu CTA primary per layar; aksi sekunder pakai tombol soft/teks.
- Card hanya untuk klaster konten, bukan per item; dilarang card di dalam card (item di dalam card memakai baris datar dengan pemisah, pola `/jadwal`).
- Touch target minimal 44px; label form tetap terlihat; copy Indonesia tanpa em dash.
- Jangan mengubah logika data, server action, guard, atau route. Murni presentasi.
- Setelah tiap halaman: `pnpm lint` dan `pnpm build`, lalu cek manual viewport 360px dan 768px.

Template prompt untuk Gemini:

```text
Baca ORCHESTRATOR.md bagian "Fase UX Refinement" dan DESIGN.md. Kerjakan
temuan nomor <N> saja. Jangan menyentuh lib/, actions.ts, atau prisma/.
Uji di viewport 360px, lalu jalankan pnpm lint dan pnpm build.
```

## 8. Backlog

- [x] PWA (13 Juli 2026): manifest dilengkapi `id` + shortcuts (Anak Saya, Jadwal, Informasi); service worker di-upgrade — navigation preload, halaman yang pernah dibuka tersimpan sehingga bisa dibuka ulang saat offline, cache-first untuk aset `_next/static` (hashed), stale-while-revalidate untuk ikon/manifest. Sisa: uji install langsung di ponsel.
- [ ] Deployment produksi: server sendiri via Docker (Vercel hanya untuk preview; user melaporkan kombinasi Vercel + Prisma lambat). Perlu: Dockerfile multi-stage (`next build` standalone), docker compose app + PostgreSQL, jalankan `prisma migrate deploy` saat rilis.

## 9. Definisi Selesai

Skripsi bisa mendemokan alur penuh: wali daftar akun dan mendaftarkan anak, admin menerima pendaftaran, staf menyusun jadwal, mengisi absensi dan nilai per semester, membuat lalu menerbitkan rapor, dan wali melihat jadwal, absensi, nilai, serta rapor anaknya dari ponsel.
