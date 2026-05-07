import { RIASEC_TYPES } from "@/lib/constants";

const milestones = [
  "Isi profil",
  "Jawab asesmen",
  "Lihat kode RIASEC",
  "Dapatkan rekomendasi",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f0e7] text-[#211a13]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e8c47d]/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 right-8 h-80 w-80 rounded-full bg-[#8fb59b]/40 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between border-b border-[#211a13]/10 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7c5b2f]">RIASEC</p>
            <h1 className="mt-1 text-lg font-semibold">Career Path App</h1>
          </div>
          <a
            className="rounded-full border border-[#211a13]/15 bg-white/60 px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            href="#alur"
          >
            Lihat alur
          </a>
        </header>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.06fr_0.94fr] lg:py-20">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-[#211a13] px-4 py-2 text-sm font-medium text-[#f6f0e7] shadow-lg shadow-[#211a13]/10">
              Untuk santri, siswa, dan calon mahasiswa
            </p>
            <h2 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              Peta minat karir berbasis RIASEC.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5f5144] sm:text-xl">
              User mengisi asesmen, sistem menghitung skor RIASEC, lalu admin mengelola data karir,
              jurusan, fakultas, kampus, dan aturan rekomendasi.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-full bg-[#b85c38] px-6 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-[#b85c38]/20 transition hover:-translate-y-0.5 hover:bg-[#9f4c2d]"
                href="/register"
              >
                Mulai asesmen
              </a>
              <a
                className="rounded-full border border-[#211a13]/15 bg-white/50 px-6 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white"
                href="/admin/dashboard"
              >
                Dashboard admin
              </a>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-[#211a13]/10 bg-[#fffaf2]/80 p-4 shadow-2xl shadow-[#4f3824]/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-[#211a13] p-5 text-[#f6f0e7]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm text-[#e8c47d]">Contoh hasil</p>
                  <p className="mt-2 text-5xl font-semibold tracking-[-0.08em]">SIE</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Skor</p>
                  <p className="mt-1 text-2xl font-semibold">86%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {RIASEC_TYPES.map((type, index) => (
                  <div key={type.code} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                      {type.code}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{type.name}</p>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-[#e8c47d]"
                          style={{ width: `${86 - index * 9}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-white/70">{86 - index * 9}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="alur" className="relative z-10 grid gap-3 border-t border-[#211a13]/10 pt-5 sm:grid-cols-4">
          {milestones.map((item, index) => (
            <div key={item} className="rounded-2xl bg-white/55 p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#b85c38]">0{index + 1}</p>
              <p className="mt-2 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
