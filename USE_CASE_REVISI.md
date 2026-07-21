# Use Case Pesantren Digital (Revisi Scope)

## Aktor

1. Wali Santri
2. Wali Kelas
3. Pengajar
4. Administrasi
5. Mudir Ma'had
6. Santri

Catatan: santri adalah data yang dipantau, bukan pengguna aktif aplikasi.

## Cakupan Utama (6 Fitur Inti Skripsi)

1. **Pendaftaran (PPDB)**: Wali mendaftarkan anak, Administrasi meninjau dan menerima pendaftaran.
2. **Absensi**: Pengajar/Wali Kelas mencatat absensi santri per sesi pelajaran.
3. **Penjadwalan**: Staff (Admin/Teacher/Homeroom) menyusun jadwal pelajaran per jenjang.
4. **Pengelolaan Nilai**: Pengajar mengisi nilai komponen per mata pelajaran.
5. **Pengelolaan Rapor**: Wali kelas/Staff membuat rapor semester (rekap nilai + absensi), menambahkan catatan wali kelas, menerbitkan rapor, dan Wali Santri memantau rapor anaknya.
6. **Absensi Ustadz dan BKKH**: Pengajar/Wali Kelas mencatat kehadiran pribadi dan mengisi laporan kegiatan harian berdasarkan enam rentang waktu; Administrasi mencatat kehadiran dan Mudir memantau laporan.

## Use Case per Peran

### 1. Wali Santri
- Login
- Membuat Akun Wali
- Mendaftarkan Anak Baru (PPDB) & Unggah Dokumen
- Memantau Profil Anak
- Memantau Jadwal Pelajaran Anak
- Memantau Rekap Nilai Harian & Kehadiran Anak
- Memantau Rapor Semester Anak (Hanya status PUBLISHED)
- Memantau Pengumuman / Informasi Pesantren

### 2. Wali Kelas
- Login
- Memantau Kelas Binaan
- Menyusun Jadwal Pelajaran (Mengelola Slot)
- Mencatat Kehadiran Sesi Pelajaran
- Mencatat Kehadiran Pribadi
- Mengisi Laporan BKKH Harian
- Mengisi dan Mengelola Nilai Komponen
- Membuat Rapor Semester Santri (Generate & Hitung Rata-rata)
- Mengisi Catatan Wali Kelas (Homeroom Note) pada Rapor
- Menerbitkan Rapor Semester (Publish)
- Mengelola Pengumuman / Informasi Pesantren

### 3. Pengajar
- Login
- Menyusun Jadwal Pelajaran (Mengelola Slot)
- Mencatat Kehadiran Sesi Pelajaran
- Mencatat Kehadiran Pribadi
- Mengisi Laporan BKKH Harian
- Mengisi dan Mengelola Nilai Komponen
- Membuat Rapor Semester Santri
- Mengisi Catatan Wali Kelas pada Rapor
- Menerbitkan Rapor Semester
- Mengelola Pengumuman / Informasi Pesantren

### 4. Administrasi
- Login
- Meninjau dan Memverifikasi Pendaftaran Anak (PPDB)
- Mengelola Status Pengguna (Verifikasi Akun Wali)
- Menyusun Jadwal Pelajaran (Mengelola Slot)
- Mencatat Kehadiran Sesi Pelajaran
- Mencatat Kehadiran Ustadz
- Memantau Laporan BKKH Harian
- Mengisi dan Mengelola Nilai Komponen
- Membuat, Menulis Catatan, dan Menerbitkan Rapor Semester
- Mengelola Pengumuman / Informasi Pesantren

### 5. Mudir Ma'had (Pengawasan - Read-Only)
- Login
- Memantau Pengguna
- Memantau Jadwal Pelajaran
- Memantau Rekap Absensi Santri
- Memantau Absensi Ustadz dan Laporan BKKH
- Memantau Rekap Nilai Santri
- Memantau Rapor Semester Santri (Semua Status)
- Memantau Pengumuman / Informasi Pesantren

### 6. Santri (Aktor Pasif)
- Terdaftar di sistem dan memiliki profil
- Ditautkan ke akun wali santri
- Memiliki riwayat kelas, absensi, nilai, dan rapor semester

## Hubungan Antar Use Case
- Proses pendaftaran anak oleh Wali Santri menghasilkan berkas pendaftaran yang ditinjau oleh Administrasi.
- Saat pendaftaran diterima, sistem secara otomatis menautkan data profil Santri ke akun Wali Santri pengaju.
- Pengelolaan Nilai dan Kehadiran merupakan basis data utama untuk menyusun Rapor Semester. Rapor semester di-snapshot dari rata-rata nilai dan total kehadiran pada periode berjalan sebelum diterbitkan.
- Absensi Ustadz dan BKKH berada dalam satu halaman operasional, tetapi disimpan terpisah: status kehadiran harian dan laporan kegiatan per rentang waktu.
