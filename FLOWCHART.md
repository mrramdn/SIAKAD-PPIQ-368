# Flowchart Sistem — Pesantren Digital

Dokumen ini memuat alur proses aplikasi setelah penerapan kontrol akses berbasis
peran. Setiap alur ditulis dengan Mermaid sehingga dapat langsung dibaca di
GitHub maupun disalin ke naskah.

---

## 1. Autentikasi dan Otorisasi

Alur ini berlaku untuk **setiap** permintaan halaman di dalam aplikasi. Pengecekan
hak akses dilakukan berdasarkan gabungan peran, bukan satu peran tunggal.

```mermaid
flowchart TD
    A["Pengguna membuka halaman"] --> B{"Punya cookie sesi?"}
    B -- Tidak --> L["Alihkan ke /login"]
    B -- Ya --> C["Cari sesi berdasarkan hash token"]
    C --> D{"Sesi ditemukan<br/>dan belum kedaluwarsa?"}
    D -- Tidak --> E["Hapus sesi kedaluwarsa"] --> L
    D -- Ya --> F["Ambil data pengguna<br/>termasuk roles"]
    F --> G{"Status VERIFIED?"}
    G -- Tidak --> M["Alihkan ke /pending"]
    G -- Ya --> H["Hitung gabungan hak akses<br/>dari seluruh peran"]
    H --> I{"Halaman butuh<br/>hak akses tertentu?"}
    I -- Tidak --> K["Tampilkan halaman"]
    I -- Ya --> J{"Hak akses dimiliki?"}
    J -- Tidak --> N["Alihkan ke /dashboard"]
    J -- Ya --> K
    K --> O["Menu disusun dari gabungan<br/>hak akses, tanpa duplikat"]
```

**Inti perubahan:** satu pengguna dapat memegang beberapa peran. Hak aksesnya
adalah gabungan (union) dari hak akses seluruh peran tersebut, dan menu yang
tampil merupakan gabungan menu yang sudah dihilangkan duplikatnya.

---

## 2. Pendaftaran Santri Baru (PPDB)

```mermaid
flowchart TD
    A["Wali Santri membuat akun"] --> B["Akun berstatus PENDING<br/>dengan peran PARENT"]
    B --> C["Administrasi memverifikasi akun"]
    C --> D["Status menjadi VERIFIED"]
    D --> E["Wali mengisi formulir<br/>pendaftaran anak"]
    E --> F["Unggah dokumen:<br/>KK, akta, rapor, foto"]
    F --> G["Berkas tersimpan<br/>status PENDING"]
    G --> H["Administrasi meninjau berkas"]
    H --> I{"Keputusan"}
    I -- Tolak --> J["Status REJECTED<br/>disertai catatan"]
    I -- Terima --> K["Status ACCEPTED"]
    K --> L["Sistem membuat profil santri"]
    L --> M{"Akun wali pengaju<br/>sudah ada?"}
    M -- Ya --> N["Tautkan santri ke akun tersebut"]
    M -- Tidak --> O["Buat akun wali baru"] --> N
    N --> P["Simpan jejak:<br/>createdStudentId, createdParentId"]
    P --> Q["Santri muncul di menu<br/>Anak Saya milik wali"]
```

---

## 3. Penjadwalan dan Mata Pelajaran

Kewenangan ini dipegang **Mudir Ma'had**, bukan Administrasi.

```mermaid
flowchart TD
    A["Mudir membuka Jadwal dan Mapel"] --> B{"Punya hak<br/>course.manage?"}
    B -- Tidak --> C["Tampilan baca saja<br/>bagi Ustadz dan Wali Kelas"]
    B -- Ya --> D["Buat atau ubah mata pelajaran"]
    D --> E["Tetapkan jenjang:<br/>SD, SMP, atau SMA"]
    E --> F["Tetapkan ustadz pengampu"]
    F --> G["Daftarkan santri peserta"]
    G --> H["Tambah slot jadwal:<br/>hari, jam, ruang"]
    H --> I["Jadwal tampil sesuai konteks"]
    I --> J["Ustadz: jadwal mengajar sendiri"]
    I --> K["Wali Kelas: jadwal mengajar sendiri"]
    I --> L["Mudir: seluruh jadwal"]
    I --> M["Wali Santri: jadwal anaknya<br/>seluruh jenjang"]
```

---

## 4. Absensi Santri

```mermaid
flowchart TD
    A["Ustadz atau Wali Kelas<br/>membuka Absensi Santri"] --> B{"Punya hak<br/>attendance.record?"}
    B -- Tidak --> C["Alihkan ke /dashboard"]
    B -- Ya --> D["Pilih mata pelajaran"]
    D --> E{"Ditugaskan sebagai<br/>pengampu mapel ini?"}
    E -- Tidak --> F["Tolak: hanya pengampu<br/>yang boleh mengisi"]
    E -- Ya --> G["Buat sesi absensi:<br/>judul, tanggal, semester"]
    G --> H["Daftar santri peserta tampil"]
    H --> I["Tandai status per santri:<br/>hadir, sakit, izin, alfa"]
    I --> J["Tersedia aksi<br/>Tandai Semua Hadir"]
    J --> K["Simpan, unik per<br/>sesi dan santri"]
    K --> L["Rekap masuk ke<br/>Anak Saya milik wali"]
    K --> M["Rekap menjadi bahan<br/>penyusunan rapor"]
```

Catatan: hak akses `attendance.record` memberi **kemampuan**, sedangkan
penugasan pengampu menentukan **mata pelajaran mana** yang boleh diisi. Keduanya
diperiksa berurutan.

---

## 5. Pengelolaan Nilai

```mermaid
flowchart TD
    A["Ustadz atau Wali Kelas<br/>membuka Nilai"] --> B{"Punya hak<br/>grade.manage?"}
    B -- Tidak --> C["Alihkan ke /dashboard"]
    B -- Ya --> D["Pilih mata pelajaran"]
    D --> E{"Ditugaskan sebagai<br/>pengampu mapel ini?"}
    E -- Tidak --> F["Tolak"]
    E -- Ya --> G["Buat komponen nilai:<br/>judul, nilai maksimum, tenggat"]
    G --> H["Isi nilai per santri"]
    H --> I["Simpan, unik per<br/>komponen dan santri"]
    I --> J["Rekap tampil di<br/>Anak Saya milik wali"]
    I --> K["Rekap menjadi bahan<br/>penyusunan rapor"]
```

---

## 6. Pengelolaan Rapor

Alur ini melibatkan tiga peran dengan kewenangan berbeda: Wali Kelas menyusun,
Administrasi memantau penyerahan, Wali Santri menerima.

```mermaid
flowchart TD
    A["Wali Kelas membuka Rapor"] --> B{"Punya hak<br/>report.manage?"}
    B -- Tidak --> C{"Punya hak<br/>report.distribute?"}
    C -- Tidak --> D["Alihkan ke /dashboard"]
    C -- Ya --> E["Administrasi:<br/>Penerimaan Rapor, baca saja"]
    B -- Ya --> F["Pilih santri, semester,<br/>tahun ajaran"]
    F --> G["Sistem menghitung<br/>rata-rata nilai per mapel"]
    G --> H["Sistem merekap kehadiran:<br/>hadir, telat, alfa, izin"]
    H --> I["Simpan sebagai salinan<br/>berstatus DRAF"]
    I --> J["Isi catatan wali kelas"]
    J --> K{"Aksi"}
    K -- "Hapus" --> L{"Status masih DRAF?"}
    L -- Ya --> M["Rapor dihapus"]
    L -- Tidak --> N["Ditolak: rapor terbit<br/>tidak dapat dihapus"]
    K -- "Terbitkan" --> O["Status menjadi TERBIT<br/>publishedAt terisi"]
    O --> P["Wali Santri dapat melihat<br/>di tab Rapor"]
    O --> Q["Administrasi memantau<br/>di Penerimaan Rapor"]
    O --> R{"Perlu koreksi?"}
    R -- Ya --> S["Batalkan terbit,<br/>kembali ke DRAF"] --> J
    E --> Q
```

**Alasan rapor disimpan sebagai salinan:** nilai akhir dan rekap kehadiran
di-*snapshot* saat rapor dibuat. Jika nilai sumber diedit setelah rapor terbit,
isi rapor tidak berubah, sehingga dokumen yang sudah diterima wali santri tetap
konsisten.

---

## 7. Absensi Ustadz dan BKKH

```mermaid
flowchart TD
    A["Buka Absensi Ustadz"] --> B{"Punya hak<br/>staff_attendance.view?"}
    B -- Tidak --> C["Alihkan ke /dashboard"]
    B -- Ya --> D{"Hak apa saja<br/>yang dimiliki?"}

    D -- "staff_attendance.self" --> E["Catat kehadiran pribadi"]
    E --> F["Isi laporan BKKH<br/>enam rentang waktu"]
    F --> G{"Tanggal hari ini?"}
    G -- Tidak --> H["Ditolak: BKKH hanya<br/>untuk hari berjalan"]
    G -- Ya --> I["Tersimpan, unik per<br/>ustadz dan tanggal"]

    D -- "staff_attendance.record" --> J["Administrasi mencatat<br/>kehadiran ustadz lain"]
    J --> K["Tersimpan beserta<br/>identitas pencatat"]

    D -- "pengawasan" --> L["Mudir memantau rekap<br/>kehadiran dan BKKH"]

    I --> M["Papan rekap harian<br/>dan bulanan"]
    K --> M
    L --> M
```

Pengguna yang memegang dua peran sekaligus, misalnya Administrasi merangkap
Ustadz, melihat **keduanya**: formulir kehadiran pribadi sekaligus papan
pengawasan seluruh ustadz.

---

## 8. Manajemen Pengguna dan Peran

```mermaid
flowchart TD
    A["Administrasi membuka Pengguna"] --> B{"Punya hak<br/>user.manage?"}
    B -- Tidak --> C["Alihkan ke /dashboard"]
    B -- Ya --> D["Pilih tindakan"]
    D --> E["Buat akun baru"]
    D --> F["Ubah akun"]
    D --> G["Hapus akun"]

    E --> H["Centang satu atau<br/>beberapa peran"]
    F --> H
    H --> I{"Minimal satu<br/>peran dipilih?"}
    I -- Tidak --> J["Ditolak: peran wajib diisi"]
    I -- Ya --> K["Ringkasan fitur yang<br/>akan terbuka ditampilkan"]
    K --> L{"Peran Administrasi dicabut<br/>atau akun dinonaktifkan?"}
    L -- Tidak --> R["Simpan"]
    L -- Ya --> M{"Akun milik sendiri?"}
    M -- Ya --> N["Ditolak: tidak bisa mencabut<br/>peran sendiri"]
    M -- Tidak --> O{"Masih ada Administrasi<br/>aktif yang lain?"}
    O -- Tidak --> P["Ditolak: sisakan minimal<br/>satu Administrasi aktif"]
    O -- Ya --> Q{"Masih mengampu<br/>mata pelajaran?"}
    Q -- Ya --> S["Ditolak: alihkan<br/>mata pelajaran dulu"]
    Q -- Tidak --> R

    G --> T{"Akun milik sendiri?"}
    T -- Ya --> U["Ditolak"]
    T -- Tidak --> Q
```

**Alasan pagar pengaman:** tidak ada peran super admin terpisah. Karena hak
`user.manage` hanya dimiliki Administrasi, hilangnya seluruh akun Administrasi
aktif membuat pengelolaan pengguna tidak dapat dipulihkan dari dalam aplikasi.
Dua pemeriksaan di atas mencegah kondisi tersebut.

---

## 9. Alur Menyeluruh per Peran

```mermaid
flowchart LR
    subgraph WS["Wali Santri"]
        WS1["Daftarkan anak"]
        WS2["Pantau kehadiran"]
        WS3["Pantau nilai"]
        WS4["Terima rapor"]
    end

    subgraph AD["Administrasi"]
        AD1["Tinjau PPDB"]
        AD2["Kelola akun dan peran"]
        AD3["Catat kehadiran ustadz"]
        AD4["Pantau penerimaan rapor"]
    end

    subgraph US["Ustadz"]
        US1["Absensi santri"]
        US2["Isi nilai"]
        US3["Kehadiran pribadi dan BKKH"]
    end

    subgraph WK["Wali Kelas"]
        WK1["Seluruh tugas Ustadz"]
        WK2["Susun dan terbitkan rapor"]
    end

    subgraph MD["Mudir Ma'had"]
        MD1["Kelola mapel dan jadwal"]
        MD2["Awasi kehadiran ustadz"]
    end

    WS1 --> AD1
    AD1 --> WS2
    MD1 --> US1
    MD1 --> US2
    US1 --> WK2
    US2 --> WK2
    WK2 --> WS4
    WK2 --> AD4
    US3 --> MD2
    AD3 --> MD2
    AD2 -.->|"menentukan hak akses"| US
    AD2 -.->|"menentukan hak akses"| WK
    AD2 -.->|"menentukan hak akses"| MD
```

Satu akun dapat berada di lebih dari satu kotak peran di atas. Dalam kondisi
tersebut, akun memperoleh gabungan seluruh alur yang dimiliki peran-perannya.
