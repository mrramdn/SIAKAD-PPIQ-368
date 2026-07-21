# PRODUCT.md

## Product

Pesantren Digital adalah sistem informasi manajemen terintegrasi yang menghubungkan pondok pesantren dengan wali santri. Sistem ini berfokus pada **6 Fitur Inti**:
1. **Pendaftaran (PPDB)**: Pengelolaan calon santri baru secara online.
2. **Absensi**: Pencatatan kehadiran santri per sesi pelajaran.
3. **Penjadwalan**: Penyusunan jadwal pelajaran per jenjang.
4. **Pengelolaan Nilai**: Pencatatan nilai harian dan komponen nilai pelajaran.
5. **Pengelolaan Rapor**: Penyusunan dan penerbitan rapor semester yang di-snapshot secara permanen.
6. **Absensi Ustadz dan BKKH**: Pencatatan kehadiran ustadz serta laporan manual kegiatan harian berdasarkan rentang waktu.

Wali santri dapat memantau jadwal pelajaran, nilai harian, rekap absensi, dan rapor semester anaknya dari ponsel. Pengajar mengelola nilai dan kehadiran pada mata pelajaran yang ditugaskan. Wali Kelas mengelola rapor. Administrasi menangani PPDB, akun, data dasar mata pelajaran, peserta, jadwal, dan operasional pesantren. Mudir Ma'had mengawasi kehadiran, BKKH, jadwal mengajar, serta hasil akademik ustadz secara read-only. Mendukung jenjang SD, SMP, dan SMA.

## Users

- **Wali santri**: Pengguna utama yang membuat akun, mendaftarkan anak, memantau jadwal, absensi harian, nilai harian, dan rapor semester anak.
- **Wali kelas**: Memantau kelas binaan, mengelola nilai dan absensi, mengisi BKKH pribadi, serta membuat, memberi catatan, dan menerbitkan rapor semester.
- **Pengajar**: Mencatat kehadiran santri dan nilai pada mata pelajaran yang diampu, serta mengisi absensi dan BKKH pribadi.
- **Administrasi**: Meninjau PPDB, mengelola akun dan role, menugaskan ustadz pada mata pelajaran, mendaftarkan peserta, menyusun jadwal, mengelola informasi, serta mencatat absensi ustadz.
- **Mudir Ma'had**: Mengawasi kehadiran dan laporan BKKH ustadz sebagai fokus utama, dengan akses read-only pada jadwal mengajar dan hasil akademik. Mudir tidak mengelola akun atau PPDB.
- **Santri**: Data profil santri yang dipantau. Tidak berinteraksi dengan aplikasi secara langsung.

## Product Purpose

Wali santri membuat akun terlebih dahulu, lalu mendaftarkan satu atau lebih anak beserta dokumen pendukung (Kartu Keluarga, Akta Kelahiran, Rapor Sebelumnya, Pas Foto) dengan URL dokumen siap diintegrasikan ke Cloudinary. Administrasi meninjau pendaftaran dan menautkan santri ke akun wali pengaju. Wali santri dapat melihat dasbor perkembangan anak, rincian nilai harian, absensi harian, jadwal, dan rapor semester. 

Administrasi menyiapkan mata pelajaran, peserta, ustadz pengampu, dan jadwal. Pengajar maupun Wali Kelas mengisi nilai dan absensi hanya pada mata pelajaran yang ditugaskan. Di akhir semester, Wali Kelas merekap nilai dan kehadiran menjadi Rapor Semester, menuliskan catatan, lalu menerbitkannya. Mudir memantau hasil akademik tanpa mengubah data. Wali santri melihat rapor anaknya setelah status berubah menjadi `PUBLISHED`.

## Brand Tone

Jelas, tenang, dan terpercaya. Nuansa hijau pesantren. UI ringkas, responsif, mudah dibaca wali santri melalui ponsel, dan dapat dipasang sebagai aplikasi web progresif (PWA).

## Strategic Principles

1. **Wali sebagai Pusat**: Setiap layar portal wali santri berfokus pada perkembangan akademik dan kehadiran anak.
2. **Keamanan Data Santri**: Wali santri hanya diizinkan melihat data anak kandung mereka sendiri (guard kepemilikan di server).
3. **Pendaftaran Dua Tahap**: Akun wali dibuat terlebih dahulu, baru kemudian wali mendaftarkan data anak dan dokumen pendukungnya.
4. **Pemisahan Jenjang Konteks**: Data jadwal pelajaran, mata pelajaran, dan rapor dipisahkan berdasarkan jenjang SD, SMP, dan SMA.
5. **Akses Cepat & PWA**: Memanfaatkan service worker untuk mendukung akses cepat dan halaman fallback offline.
6. **Kewenangan Minimum**: Administrasi mengelola operasional dan akun, pengajar mengelola mapel yang diampu, Wali Kelas mengelola rapor, dan Mudir hanya mengawasi.

## Content Rules

- Menggunakan salinan berbahasa Indonesia yang sopan dan lugas.
- Kalimat langsung dan ringkas.
- Hindari penggunaan tanda em dash (—) dalam salinan bahasa Indonesia.
- Pesan error formulir wajib menjelaskan solusi atau tindakan perbaikan.
- Label formulir harus selalu terlihat di atas input.
