# PRODUCT.md

## Product

Pesantren Digital adalah sistem informasi manajemen terintegrasi yang menghubungkan pondok pesantren dengan wali santri. Sistem ini berfokus pada **5 Fitur Inti**:
1. **Pendaftaran (PPDB)**: Pengelolaan calon santri baru secara online.
2. **Absensi**: Pencatatan kehadiran santri per sesi pelajaran.
3. **Penjadwalan**: Penyusunan jadwal pelajaran per jenjang.
4. **Pengelolaan Nilai**: Pencatatan nilai harian dan komponen nilai pelajaran.
5. **Pengelolaan Rapor**: Penyusunan dan penerbitan rapor semester yang di-snapshot secara permanen.

Wali santri dapat memantau jadwal pelajaran, nilai harian, rekap absensi, dan rapor semester anaknya dari ponsel. Pengajar dan Wali Kelas mengelola nilai, kehadiran, jadwal, dan menerbitkan rapor. Administrasi meninjau pendaftaran baru dan mengelola status pengguna. Mudir Ma'had melakukan pengawasan read-only pada seluruh data akademik. Mendukung jenjang SD, SMP, dan SMA.

## Users

- **Wali santri**: Pengguna utama yang membuat akun, mendaftarkan anak, memantau jadwal, absensi harian, nilai harian, dan rapor semester anak.
- **Wali kelas**: Memantau kelas binaan, mengelola nilai, absensi, serta mengisi catatan wali kelas dan menerbitkan rapor semester.
- **Pengajar**: Mencatat kehadiran santri, mengelola slot jadwal, dan mengisi komponen nilai pelajaran.
- **Administrasi**: Meninjau pendaftaran PPDB, mengelola verifikasi status pengguna, serta mengelola jadwal, absensi, nilai, dan rapor.
- **Mudir Ma'had**: Melakukan pengawasan (read-only) terhadap data pengguna, jadwal, absensi, nilai, rapor, dan informasi pesantren.
- **Santri**: Data profil santri yang dipantau. Tidak berinteraksi dengan aplikasi secara langsung.

## Product Purpose

Wali santri membuat akun terlebih dahulu, lalu mendaftarkan satu atau lebih anak beserta dokumen pendukung (Kartu Keluarga, Akta Kelahiran, Rapor Sebelumnya, Pas Foto) dengan URL dokumen siap diintegrasikan ke Cloudinary. Administrasi meninjau pendaftaran dan menautkan santri ke akun wali pengaju. Wali santri dapat melihat dasbor perkembangan anak, rincian nilai harian, absensi harian, jadwal, dan rapor semester. 

Staff pengajar/administrasi menyusun jadwal pelajaran per jenjang, mengisi nilai, dan mencatat absensi. Di akhir semester, staff menghitung dan menguji rata-rata nilai dan kehadiran, merekapnya menjadi Rapor Semester, menuliskan catatan wali kelas, lalu menerbitkannya. Wali santri memantau rapor semester anaknya secara instan setelah status rapor diubah menjadi `PUBLISHED`.

## Brand Tone

Jelas, tenang, dan terpercaya. Nuansa hijau pesantren. UI ringkas, responsif, mudah dibaca wali santri melalui ponsel, dan dapat dipasang sebagai aplikasi web progresif (PWA).

## Strategic Principles

1. **Wali sebagai Pusat**: Setiap layar portal wali santri berfokus pada perkembangan akademik dan kehadiran anak.
2. **Keamanan Data Santri**: Wali santri hanya diizinkan melihat data anak kandung mereka sendiri (guard kepemilikan di server).
3. **Pendaftaran Dua Tahap**: Akun wali dibuat terlebih dahulu, baru kemudian wali mendaftarkan data anak dan dokumen pendukungnya.
4. **Pemisahan Jenjang Konteks**: Data jadwal pelajaran, mata pelajaran, dan rapor dipisahkan berdasarkan jenjang SD, SMP, dan SMA.
5. **Akses Cepat & PWA**: Memanfaatkan service worker untuk mendukung akses cepat dan halaman fallback offline.

## Content Rules

- Menggunakan salinan berbahasa Indonesia yang sopan dan lugas.
- Kalimat langsung dan ringkas.
- Hindari penggunaan tanda em dash (—) dalam salinan bahasa Indonesia.
- Pesan error formulir wajib menjelaskan solusi atau tindakan perbaikan.
- Label formulir harus selalu terlihat di atas input.

