# PRODUCT.md

## Product

Career Path RIASEC App membantu santri, siswa, dan calon mahasiswa memahami minat karir melalui asesmen RIASEC. Aplikasi menampilkan hasil skor, kode dominan, rekomendasi karir, jurusan, fakultas, dan kampus. Admin mengelola pertanyaan, data master, aturan rekomendasi, dan monitoring hasil assessment.

## Register

product

## Users

- Santri dan siswa yang membutuhkan arahan karir setelah sesi bimbingan.
- Calon mahasiswa yang butuh pilihan jurusan dan kampus yang masuk akal.
- Admin pesantren atau pembimbing yang mengelola data assessment dan rekomendasi.

## Product Purpose

User harus bisa menyelesaikan satu alur lengkap tanpa bingung: daftar, login, isi profil, jawab assessment, membaca hasil, lalu melihat rekomendasi. Admin harus bisa merawat data tanpa perlu akses database langsung.

## Brand Tone

Tenang, akademik, Islami secara halus, dan dapat dipercaya. UI tidak boleh terasa seperti SaaS generik. Logo Pondok Pesantren Integritas Qurani menjadi jangkar visual utama.

## Visual Anchors

- Logo di `public/logo.png` wajib dipakai pada halaman auth dan shell utama.
- Hijau logo menjadi warna primer.
- Aksen kuning dari logo dipakai untuk highlight ringan.
- Merah buku pada logo hanya untuk status penting atau aksen sangat kecil.

## Strategic Principles

1. Clarity first: santri harus tahu langkah berikutnya tanpa membaca instruksi panjang.
2. Backend-first stays visible: UI harus mengikuti kemampuan API yang sudah ada.
3. Admin is maintenance, not decoration: tabel, filter, dan form harus cepat dipakai.
4. Assessment feels guided: pertanyaan harus terasa seperti proses bimbingan, bukan ujian berat.
5. Recommendation explains why: hasil harus menghubungkan kode RIASEC dengan karir dan jurusan.

## Anti-References

- Purple SaaS gradients.
- Generic glass cards.
- Emoji as icons.
- Overly corporate blue dashboard.
- Dense government-form layout.
- Gradient text.
- Side-stripe card accents.
- Identical icon-card grids.

## Content Rules

- Use Indonesian copy.
- Use direct sentences.
- Avoid em dashes.
- Form errors must explain the fix.
- Labels stay visible above inputs.
