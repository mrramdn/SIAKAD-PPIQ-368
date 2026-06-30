# Revisi Use Case Pesantren Digital

## Aktor

1. Wali Santri
2. Wali Kelas
3. Pengajar
4. Administrasi
5. Mudir Ma'had
6. Santri

Catatan: santri adalah data yang dipantau, bukan pengguna aktif aplikasi.

## Relasi Akun Wali dan Anak

- Satu akun wali santri dapat memiliki lebih dari satu anak.
- Wali membuat akun terlebih dahulu, lalu login untuk mendaftarkan anak.
- Pendaftaran anak dapat menyimpan URL dokumen pendukung: KK, akta kelahiran, rapor terakhir, dan pas foto. Upload file disiapkan untuk integrasi Cloudinary.
- Administrasi meninjau pendaftaran dan menautkan data santri ke akun wali pengaju.

## Use Case Wali Santri

- Login
- Buat Akun Wali
- Pendaftaran Anak
- Melihat Anak Saya
- Melihat Informasi Akademik
- Melihat Informasi Pembelajaran
- Melihat Data Rapor
- Melihat Informasi Pengumuman

## Use Case Wali Kelas

- Login
- Melihat Informasi Akademik
- Melihat Informasi Pembelajaran
- Mengelola Absensi Santri
- Mengelola Nilai
- Melihat Data Rapor
- Mengelola Informasi Pengumuman

## Use Case Administrasi

- Login
- Meninjau Pendaftaran Anak dan Dokumen
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

- Hubungkan `Buat Akun Wali` ke `Pendaftaran Anak`.
- Hubungkan `Pendaftaran Anak` dari Wali Santri ke proses `Meninjau Pendaftaran Anak dan Dokumen` oleh Administrasi.
- Tambahkan relasi `include` dari `Meninjau Pendaftaran Anak dan Dokumen` ke `Membuat Data Santri`.
- Tambahkan kardinalitas konseptual: `1 Wali Santri` dapat memiliki `1..n Santri`.
- Mudir Ma'had diberi akses pengawasan saja, sehingga gunakan label `Melihat` bukan `Mengelola`.
