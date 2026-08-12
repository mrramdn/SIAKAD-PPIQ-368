# Skenario Uji (Black-Box) — SIM Pondok Pesantren Integritas Qur'ani 368

Dokumen ini memetakan setiap skenario uji ke akun dan data konkret hasil `pnpm db:seed`.
Semua data di bawah dibuat ulang secara idempoten oleh `prisma/seed.ts`, sehingga hasil
uji dapat direproduksi kapan pun.

Periode aktif seed: **Semester Ganjil 2026/2027**.

---

## 1. Akun demo

Seluruh akun demo memakai satu kata sandi yang sama: **`password123`**.
Kata sandi ini **tidak ditampilkan di mana pun dalam aplikasi**; hanya dicatat di
dokumen ini untuk keperluan pengujian.

### Staf

| Peran | Nama | Email |
| --- | --- | --- |
| Administrasi | Ustadz Rahmat Hidayat, S.Pd. | `administrasi@ppiq368.sch.id` |
| Mudir Ma'had | Ustadz Abdurrahman Fauzi, Lc. | `mudir@ppiq368.sch.id` |
| Ustadz + Wali Kelas SD-A (**dua peran**) | Ustadz Hamdan Mutaqin, S.Pd. | `hamdan.mutaqin@ppiq368.sch.id` |
| Wali Kelas SMP-A | Ustadz Salman Al Ghifari, Lc. | `salman.ghifari@ppiq368.sch.id` |
| Wali Kelas SMA-A | Ustadz Ridwan Nurhakim, S.Pd. | `ridwan.nurhakim@ppiq368.sch.id` |
| Ustadz (Tahfidz) | Ustadz Taufiq Ramadhan, Lc. | `taufiq.ramadhan@ppiq368.sch.id` |
| Ustadz (Akademik umum) | Ustadz Hafidz Maulana, S.Pd. | `hafidz.maulana@ppiq368.sch.id` |
| Ustadz (Bahasa & kitab) | Ustadz Imron Nawawi, S.Pd.I. | `imron.nawawi@ppiq368.sch.id` |

### Wali santri

| Nama | Email | Anak |
| --- | --- | --- |
| Bapak Hasan Basri | `wali.hasan@ppiq368.sch.id` | **Zaid Abdullah Basri (20261001)** dan **Fatih Ahmad Basri (20262001)** |
| Bapak Mahmud Sanusi | `wali.mahmud@ppiq368.sch.id` | Ibrahim Alfarizi (20261002) |
| Bapak Iskandar Ali | `wali.iskandar@ppiq368.sch.id` | Naufal Hakim Ramadhan (20261003) |
| Bapak Rosyid Anwar | `wali.rosyid@ppiq368.sch.id` | Rifqi Nur Hidayat (20262002) |
| Bapak Jamaludin Akbar | `wali.jamaludin@ppiq368.sch.id` | Ilham Baihaqi (20262003) |
| Bapak Sofyan Hadi | `wali.sofyan@ppiq368.sch.id` | Umar Faruq Wibowo (20263001) |
| Ibu Nurhayati Sri Wahyuni | `wali.nurhayati@ppiq368.sch.id` | Hafizh Abdul Aziz (20263002) |
| Ibu Dewi Ratnasari | `wali.dewi@ppiq368.sch.id` | Bilal Arrahman Saputra (20262005, belum berkelas) |

### Kelas & santri

| Kelas | Jenjang | Wali kelas | Santri (NIS) |
| --- | --- | --- | --- |
| SD-A | SD | Ustadz Hamdan Mutaqin, S.Pd. | Zaid Abdullah Basri (20261001), Ibrahim Alfarizi (20261002), Naufal Hakim Ramadhan (20261003), Yusuf Maulana Sidik (20261004) |
| SMP-A | SMP | Ustadz Salman Al Ghifari, Lc. | Fatih Ahmad Basri (20262001), Rifqi Nur Hidayat (20262002), Ilham Baihaqi (20262003), Ahmad Zaki Mubarok (20262004) |
| SMA-A | SMA | Ustadz Ridwan Nurhakim, S.Pd. | Umar Faruq Wibowo (20263001), Hafizh Abdul Aziz (20263002), Aqil Farhan Nugraha (20263003), Salim Fadhlurrahman (20263004) |
| — | SMP | (belum ditempatkan) | Bilal Arrahman Saputra (20262005) |

Format NIS: 8 digit — 4 digit tahun masuk, 1 digit kode jenjang (1 = SD, 2 = SMP,
3 = SMA), 3 digit nomor urut.

### Kelompok penilaian (mengikuti naskah BAB III)

| Kelompok | Jenis | Nilai maks. bawaan | Jumlah mapel (per kelas × 3 kelas) |
| --- | --- | --- | --- |
| Akademik | Nilai mata pelajaran | 7 | 19 × 3 = 57 |
| Akhlak | Penilaian sikap | 7 | 4 kriteria (Kebersihan, Tata Tertib, Budaya / Perilaku, Jumlah Keseluruhan) |
| Tahfidz | Nilai mata pelajaran | 7 | 6 × 3 = 18 |
| Ekstrakurikuler | Nilai mata pelajaran | 6 | 6 × 3 = 18 |

Total 31 mata pelajaran per kelas (93 mapel untuk 3 kelas).

---

## 2. Tabel skenario uji

| No | Skenario | Akun | Langkah | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| U-01 | Wali santri memiliki **dua anak** | `wali.hasan@ppiq368.sch.id` | Login → menu **Anak Saya** | Muncul dua kartu anak: Zaid Abdullah Basri (SD-A) dan Fatih Ahmad Basri (SMP-A); masing-masing bisa dibuka dan punya rapor terbit sendiri |
| U-02 | Satu akun memegang **dua peran** (TEACHER + HOMEROOM) | `hamdan.mutaqin@ppiq368.sch.id`, verifikasi oleh `administrasi@ppiq368.sch.id` | Login sebagai administrasi → **Pengguna** → cari Ustadz Hamdan Mutaqin; lalu login sebagai Ustadz Hamdan | Akun tercatat dengan dua peran sekaligus (Ustadz + Wali Kelas) dan memperoleh gabungan izin keduanya: **Nilai/Absen/BKKH** untuk mapel yang diampu sekaligus **Rapor** kelas binaan SD-A |
| U-03 | Santri **belum ditempatkan** di kelas | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Kelas** | Bilal Arrahman Saputra (20262005) tampil pada daftar "Santri belum ditempatkan" dan dapat ditempatkan ke kelas mana pun |
| U-04 | Mapel **tanpa ustadz pengampu** | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Mapel & Pengampu** → cari "Komputer" kelas **SD-A** | Kolom pengampu kosong / "Belum ada pengampu"; mapel tetap dapat disunting untuk menetapkan pengampu |
| U-05 | Mapel **tanpa peserta** | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Peserta Mapel** → kelas **SMA-A** → mapel **Berkuda** | Jumlah peserta aktif 0; tombol pendaftaran massal tersedia. Mapel ini juga tidak muncul sebagai baris pada rapor santri SMA-A |
| U-06 | Rapor status **DRAFT** | `salman.ghifari@ppiq368.sch.id` | Login → **Rapor** → kelas SMP-A → **Ahmad Zaki Mubarok (20262004)** | Status "Draf"; wali kelas masih bisa menghitung ulang, mengisi nilai sikap (masih 0), dan mengirim ke administrasi |
| U-07 | Rapor status **SUBMITTED** | `salman.ghifari@ppiq368.sch.id` / `administrasi@ppiq368.sch.id` | Buka rapor **Rifqi Nur Hidayat (20262002)** | Status "Menunggu ACC"; wali kelas tidak bisa menyunting lagi, administrasi melihat tombol ACC/Kembalikan |
| U-08 | Rapor status **APPROVED** | `administrasi@ppiq368.sch.id` | Buka rapor **Ilham Baihaqi (20262003)** | Status "Disetujui" dengan catatan administrasi; tersedia tombol **Terbitkan** |
| U-09 | Rapor status **REJECTED** | `ridwan.nurhakim@ppiq368.sch.id` | Login → **Rapor** → kelas SMA-A → **Umar Faruq Wibowo (20263001)** | Status "Dikembalikan" beserta alasan administrasi ("Rekap ketidakhadiran belum sesuai buku absensi asrama…"); rapor bisa disusun ulang dan dikirim kembali |
| U-10 | Rapor status **PUBLISHED** | `wali.hasan@ppiq368.sch.id` | Login → **Anak Saya** → Fatih Ahmad Basri → tab **Rapor** | Lembar rapor terbit tampil lengkap dan dapat dicetak; hal serupa untuk Zaid Abdullah Basri |
| U-11 | **Palang ACC** karena administrasi belum lunas | `administrasi@ppiq368.sch.id` | Buka rapor **Rifqi Nur Hidayat (20262002)** → tekan **ACC Rapor** | Ditolak dengan pesan "Administrasi belum lunas: Daftar Ulang. Rapor tidak bisa di-ACC." |
| U-12 | Administrasi **lunas** | `administrasi@ppiq368.sch.id` | Buka rapor **Ilham Baihaqi (20262003)** atau **Fatih Ahmad Basri (20262001)** | Seluruh checklist administrasi (3 item) tercentang; ACC dan penerbitan rapor berhasil |
| U-13 | Pendaftaran (PPDB) **dengan berkas** | `administrasi@ppiq368.sch.id` | Login → **Pendaftaran** → **Zaidan Arkan Pratama** (status Menunggu) | Dua berkas terlampir (Kartu Keluarga, Akta Kelahiran) dan dapat diunduh dari halaman detail |
| U-14 | Pendaftaran (PPDB) **tanpa berkas** | `administrasi@ppiq368.sch.id` | Login → **Pendaftaran** → **Bilal Arrahman Saputra** (status Diterima) | Tidak ada lampiran berkas; pendaftaran sudah diterima dan tertaut ke santri 20262005 serta akun wali `wali.dewi@ppiq368.sch.id` |
| U-15 | Mapel dengan **total bobot komponen ≠ 100** | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Bobot Komponen Nilai** → cari **Fisika (SMP-A)** | Ditandai bermasalah: UTS 40 + UAS 50 = **90%**. Menyimpan bobot yang tidak berjumlah 100% ditolak dengan pesan "Total bobot komponen … harus 100%" |
| U-16 | **Penanda tangan rapor** dapat diubah administrasi | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Penanda Tangan Rapor** → ubah nama/jabatan → **Simpan Perubahan** | Nilai tersimpan pada tabel `AppSetting`; lembar rapor mana pun (mis. rapor Fatih Ahmad Basri) langsung mencetak nama & jabatan yang baru |
| U-17 | Taksonomi kelompok penilaian sesuai naskah | `administrasi@ppiq368.sch.id` | Login → **Setup Akademik → Kelompok Penilaian** | Terdapat empat kelompok: Akademik, Akhlak (sikap), Tahfidz, Ekstrakurikuler; setiap kelompok dapat disunting/ditambah tanpa mengubah kode |
| U-18 | Rekap ketidakhadiran rapor terisi | `salman.ghifari@ppiq368.sch.id` | Buka rapor mana pun di SMP-A | Kolom Sakit/Izin/Lain-lain terisi sesuai absensi tiga pertemuan yang diseed (setiap santri memiliki pola berbeda yang mencakup Sakit, Izin, Terlambat, dan Alpa) |

---

## 3. Catatan pelaksanaan

- Seed bersifat **idempoten**: menjalankan `pnpm db:seed` dua kali menghasilkan jumlah
  baris yang sama persis.
- Seed menolak berjalan bila database berisi data di luar data demo
  (`assertSeedableDatabase()`); paksa dengan `SEED_FORCE=1 pnpm db:seed` hanya bila
  benar-benar yakin.
- Nilai setiap komponen (UTS/UAS) dihitung deterministik dari NIS + nama mapel,
  sehingga angka pada tangkapan layar tetap sama setelah reseed.
