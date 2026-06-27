# Revisi Use Case Pesantren Digital

## Aktor

1. Wali Santri
2. Administrasi
3. Pengajar
4. Mudir Ma'had
5. Santri

Catatan: santri adalah data yang dipantau, bukan pengguna aktif aplikasi.

## Relasi Akun Wali dan Anak

- Satu akun wali santri dapat memiliki lebih dari satu anak.
- Email wali menjadi identitas akun login.
- Jika wali mendaftarkan anak kedua dengan email yang sama, sistem menautkan santri baru ke akun wali yang sudah ada.
- Jika email sudah dipakai akun non-wali, administrasi perlu memakai email wali lain.

## Use Case Wali Santri

- Login
- Pendaftaran Anak
- Melihat Anak Saya
- Melihat Informasi Akademik
- Melihat Informasi Pembelajaran
- Melihat Data Rapor
- Melihat Informasi Pengumuman

## Use Case Administrasi

- Login
- Meninjau Pendaftaran Anak
- Mengelola Data Pengguna
- Mengelola Akun Pengguna
- Mengelola Pembelajaran
- Mengelola Absensi
- Mengelola Nilai
- Mengelola Rapor
- Mengelola Informasi Pengumuman

## Use Case Pengajar

- Login
- Melihat Informasi Akademik
- Mengelola Informasi Pembelajaran
- Mengelola Absensi Ustadz dan BKKH
- Mengelola Absensi Santri
- Mengelola Nilai
- Mengelola Rapor
- Mengelola Informasi Pengumuman

## Use Case Mudir Ma'had

- Login
- Melihat Data Pengguna
- Melihat Informasi Akademik
- Melihat Informasi Pembelajaran
- Melihat Absensi Ustadz dan BKKH
- Melihat Absensi Santri
- Melihat Nilai
- Melihat Rapor
- Melihat Informasi Pengumuman

## Use Case Santri

- Terdaftar sebagai data santri
- Ditautkan ke akun wali santri
- Memiliki data kelas, nilai, absensi, dan rapor

## Catatan Diagram

- Hubungkan `Pendaftaran Anak` dari Wali Santri ke proses `Meninjau Pendaftaran Anak` oleh Administrasi.
- Tambahkan relasi `include` dari `Meninjau Pendaftaran Anak` ke `Membuat/Menautkan Akun Wali` dan `Membuat Data Santri`.
- Tambahkan kardinalitas konseptual: `1 Wali Santri` dapat memiliki `1..n Santri`.
- Mudir Ma'had diberi akses pengawasan saja, sehingga gunakan label `Melihat` bukan `Mengelola`.
