# PRODUCT.md

## Product

Pesantren Digital menghubungkan pondok pesantren dengan wali santri. Wali santri memantau nilai, kehadiran, dan informasi anaknya tanpa harus datang ke sekolah. Pengajar mengelola materi, nilai, dan kehadiran. Wali kelas membantu pemantauan kelas binaan. Administrasi meninjau pendaftaran santri baru dan mengelola data. Mudir Ma'had memantau data untuk pengawasan. Mendukung jenjang SD, SMP, dan SMA.

## Users

- **Wali santri**: pengguna utama, membuat akun, mendaftarkan anak, dan memantau perkembangan anak.
- **Wali kelas**: memantau kelas binaan, nilai, absensi, dan informasi untuk wali.
- **Pengajar**: mencatat kehadiran, mengisi nilai, mengirim informasi.
- **Administrasi**: meninjau pendaftaran, mengelola pengguna, kelas, dan informasi.
- **Mudir Ma'had**: memantau pengguna, pembelajaran, nilai, absensi, dan informasi sebagai pengawasan.
- **Santri**: data yang dipantau, tidak memakai aplikasi secara langsung.

## Product Purpose

Calon wali membuat akun wali terlebih dahulu, lalu login untuk mendaftarkan satu atau lebih anak. Form pendaftaran anak menyimpan data santri dan URL dokumen pendukung yang nanti dapat diisi dari Cloudinary. Administrasi meninjau pendaftaran; saat diterima, data santri ditautkan ke akun wali yang mengajukan. Wali login untuk melihat ringkasan anak, rincian nilai dan kehadiran per mata pelajaran, serta informasi sekolah. Wali kelas, pengajar, dan administrasi mengelola kelas, nilai, kehadiran, dan pengumuman dari satu panel. Mudir memantau data tanpa mengelola.

## Brand Tone

Jelas, tenang, dan terpercaya. Nuansa hijau pesantren. UI ringkas, mudah dibaca wali dari ponsel, dan dapat dipasang sebagai aplikasi (PWA).

## Strategic Principles

1. Wali sebagai pusat: setiap layar wali fokus pada perkembangan anak.
2. Data santri terlindungi: wali hanya melihat anaknya sendiri (cek kepemilikan di server).
3. Pendaftaran dipisah: akun wali dibuat dulu, lalu wali mendaftarkan anak dan dokumen pendukung.
4. Jenjang sadar konteks: SD, SMP, SMA memiliki kelas dan informasi sendiri.
5. Akses cepat di lapangan: dapat dipasang sebagai PWA dengan halaman offline.

## Content Rules

- Use Indonesian copy.
- Use direct sentences.
- Avoid em dashes.
- Form errors must explain the fix.
- Labels stay visible above inputs.
