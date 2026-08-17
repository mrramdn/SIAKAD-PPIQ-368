# Use Case Pesantren Digital (Revisi Scope)

## Aktor

1. Wali Santri
2. Pengajar (Ustadz)
3. Wali Kelas
4. Mudir Ma'had
5. Administrasi
6. Santri

Catatan: santri adalah data yang dipantau, bukan pengguna aktif aplikasi. Yang
memegang akun adalah orang tuanya, sehingga pemantauan perkembangan santri
(kehadiran, nilai, rapor) berlangsung dari sisi wali santri.

## Model Peran dan Hak Akses

Sistem menggunakan kontrol akses berbasis peran (role-based access control).
Satu pengguna dapat memegang **lebih dari satu peran**, dan hak aksesnya adalah
**gabungan** hak akses dari seluruh peran yang dipegangnya. Contoh: seorang
pengguna yang berperan sebagai Administrasi sekaligus Mudir Ma'had memperoleh
seluruh fitur Administrasi ditambah seluruh fitur Mudir Ma'had, tanpa duplikasi
untuk fitur yang beririsan.

Pembatasan fitur tidak diputuskan langsung dari nama peran, melainkan dari
daftar hak akses (permission) yang dimiliki peran tersebut. Setiap peran
memetakan ke sekumpulan permission, dan setiap fitur mensyaratkan satu
permission tertentu.

### Tabel Peran dan Fitur

| Peran | Fitur yang dapat diakses |
|---|---|
| Administrasi | Pendaftaran (PPDB), Pengguna, Administrasi Santri, Penanda Tangan Rapor, Absensi Ustadz (pantau), Penerimaan Rapor |
| Pengajar (Ustadz) | Jadwal & Mata Pelajaran, Absensi Santri, Pengelolaan Nilai, Absensi Ustadz & BKKH |
| Wali Kelas | Seluruh fitur Pengajar, ditambah Rapor |
| Mudir Ma'had | Data Akademik (Kelas, Mapel & Pengampu, Jadwal, Peserta Mapel, Kelompok Penilaian, Bobot Komponen Nilai), Absensi Ustadz (pantau) |
| Wali Santri | Pendaftaran Anak, Jadwal, Anak Saya (profil, kehadiran, nilai, rapor) |

Dasbor dan Pengaturan tersedia untuk seluruh peran.

### Administrasi Peran

Pengelolaan akun dan peran dilakukan oleh Administrasi; tidak ada peran super
admin yang terpisah. Karena hak kelola pengguna hanya dimiliki Administrasi,
sistem menjaga agar hak tersebut tidak dapat hilang seluruhnya: akun
Administrasi tidak dapat mencabut peran atau menonaktifkan akunnya sendiri, dan
sistem menolak perubahan yang menyisakan nol akun Administrasi aktif.

## Cakupan Utama (6 Fitur Inti Skripsi)

1. **Pendaftaran (PPDB)**: Wali Santri mendaftarkan anak beserta unggahan
   dokumen; Administrasi meninjau, menerima, atau menolak pendaftaran.
2. **Absensi Santri**: Pengajar dan Wali Kelas mencatat kehadiran santri per
   sesi pelajaran pada mata pelajaran yang ditugaskan kepadanya.
3. **Penjadwalan dan Mata Pelajaran**: Mudir Ma'had menyusun mata pelajaran,
   menetapkan ustadz pengampu, dan mengatur slot jadwal per jenjang. Pengajar,
   Wali Kelas, dan Wali Santri melihat jadwal sesuai konteksnya. Mata pelajaran
   dan jadwal disajikan dalam satu halaman.
4. **Pengelolaan Nilai**: Pengajar dan Wali Kelas mengisi nilai komponen pada
   mata pelajaran yang ditugaskan kepadanya.
5. **Pengelolaan Rapor**: Wali Kelas membuat rapor semester (rekap nilai dan
   kehadiran), menambahkan catatan, serta menerbitkannya. Administrasi memantau
   rapor yang telah terbit untuk keperluan penyerahan kepada wali santri. Wali
   Santri memantau rapor anaknya yang telah berstatus terbit.
6. **Absensi Ustadz dan BKKH**: Pengajar dan Wali Kelas mencatat kehadiran
   pribadi serta mengisi laporan kegiatan harian berdasarkan enam rentang waktu;
   Administrasi dan Mudir Ma'had sama-sama hanya memantau kehadiran dan laporan
   tersebut, tanpa mencatat.

## Use Case per Peran

### 1. Wali Santri
- Login
- Membuat Akun Wali
- Mendaftarkan Anak Baru (PPDB) & Unggah Dokumen
- Memantau Profil Anak
- Memantau Jadwal Pelajaran Anak (seluruh jenjang: SD, SMP, SMA)
- Memantau Rekap Nilai Harian & Kehadiran Anak
- Memantau Rapor Semester Anak (hanya berstatus PUBLISHED)

### 2. Pengajar (Ustadz)
- Login
- Memantau Jadwal Mengajar dan Mata Pelajaran
- Mencatat Kehadiran Sesi Pelajaran pada Mapel yang Ditugaskan
- Mencatat Kehadiran Pribadi
- Mengisi Laporan BKKH Harian
- Mengisi dan Mengelola Nilai Komponen pada Mapel yang Ditugaskan

### 3. Wali Kelas
Seluruh use case Pengajar, ditambah:
- Membuat Rapor Semester Santri (Generate & Hitung Rata-rata)
- Mengisi Catatan Wali Kelas (Homeroom Note) pada Rapor
- Menerbitkan Rapor Semester (Publish)
- Membatalkan Penerbitan Rapor
- Menghapus Rapor yang Masih Berstatus Draf

### 4. Mudir Ma'had (Pengawas)
- Login
- Mengelola Kelas dan Penempatan Santri
- Mengelola Mata Pelajaran, Peserta, dan Ustadz Pengampu
- Menyusun Jadwal Pelajaran (Mengelola Slot)
- Mengelola Kelompok Penilaian dan Bobot Komponen Nilai (termasuk menambah
  komponen nilai baru untuk suatu mapel)
- Memantau Absensi Ustadz dan Laporan BKKH Harian

Catatan: Mudir Ma'had berperan sebagai pengawas ustadz sekaligus pemegang
kewenangan data akademik (kelas, mata pelajaran, jadwal, kelompok penilaian,
bobot nilai). Mudir tidak memiliki akses ke manajemen akun, PPDB, absensi
maupun nilai santri, maupun rapor; absensi dan nilai santri merupakan
kewenangan Pengajar dan Wali Kelas, sedangkan rapor merupakan kewenangan Wali
Kelas.

### 5. Administrasi
- Login
- Meninjau dan Memverifikasi Pendaftaran Anak (PPDB)
- Mengelola Akun, Peran, dan Status Pengguna
- Mengelola Checklist Administrasi Santri
- Mengelola Penanda Tangan Rapor
- Memantau Absensi Ustadz dan Laporan BKKH Harian
- Memantau Penerimaan Rapor (daftar rapor terbit untuk diserahkan ke wali santri)

Catatan: Administrasi tidak mengelola mata pelajaran, kelas, maupun jadwal;
kewenangan tersebut berada pada Mudir Ma'had. Akses Administrasi terhadap
absensi ustadz maupun rapor bersifat pemantauan saja, tanpa kemampuan mencatat
kehadiran ustadz atau mengubah isi rapor.

### 6. Santri (Aktor Pasif)
- Terdaftar di sistem dan memiliki profil
- Ditautkan ke akun wali santri
- Memiliki riwayat kelas, absensi, nilai, dan rapor semester

## Hubungan Antar Use Case
- Proses pendaftaran anak oleh Wali Santri menghasilkan berkas pendaftaran yang
  ditinjau oleh Administrasi.
- Saat pendaftaran diterima, sistem secara otomatis menautkan data profil Santri
  ke akun Wali Santri pengaju.
- Setiap mata pelajaran memiliki ustadz pengampu yang ditetapkan oleh Mudir
  Ma'had. Pengajar maupun Wali Kelas hanya dapat mengubah nilai dan absensi pada
  mata pelajaran yang ditugaskan kepadanya. Kepemilikan mata pelajaran ini
  berlaku sebagai pembatas tambahan di atas hak akses peran.
- Pengelolaan Nilai dan Kehadiran merupakan basis data utama untuk menyusun
  Rapor Semester. Rapor di-snapshot dari rata-rata nilai dan total kehadiran
  pada periode berjalan sebelum diterbitkan, sehingga isinya tidak berubah
  meskipun nilai sumber diedit setelah rapor terbit.
- Rapor yang telah terbit tidak dapat dihapus, agar rekam jejak yang telah
  diterima wali santri tetap utuh. Penghapusan hanya dimungkinkan selama rapor
  masih berstatus draf.
- Absensi Ustadz dan BKKH berada dalam satu halaman operasional, tetapi disimpan
  terpisah: status kehadiran harian dan laporan kegiatan per rentang waktu.
- Status kehadiran ustadz dicatat oleh Pengajar atau Wali Kelas untuk dirinya
  sendiri; Administrasi dan Mudir Ma'had hanya memantau. Laporan BKKH juga
  hanya dapat diisi sendiri oleh Pengajar atau Wali Kelas pada hari yang sama.
