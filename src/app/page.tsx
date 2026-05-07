import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { RIASEC_TYPES } from "@/lib/constants";

const milestones = ["Isi profil", "Jawab assessment", "Baca kode RIASEC", "Lihat rekomendasi"];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-soft blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 right-8 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between border-b border-line pb-5">
          <div className="flex items-center gap-4">
            <BrandMark size="sm" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand">RIASEC</p>
              <h1 className="mt-1 text-lg font-semibold">Career Path App</h1>
            </div>
          </div>
          <Link
            className="min-h-11 rounded-full bg-paper px-4 py-2.5 text-sm font-semibold text-brand-strong shadow-[0_8px_26px_oklch(0.24_0.035_135_/_0.08)] transition-[transform,background-color,color,box-shadow] duration-200 ease-out hover:bg-brand-soft active:scale-[0.96]"
            href="/login"
          >
            Masuk
          </Link>
        </header>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-brand-strong px-4 py-2 text-sm font-medium text-paper shadow-[0_16px_36px_oklch(0.34_0.13_147_/_0.18)]">
              Untuk santri, siswa, dan calon mahasiswa
            </p>
            <h2 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              Peta minat karir berbasis RIASEC.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              User menjawab assessment, sistem menghitung skor RIASEC, lalu admin merawat data karir,
              jurusan, fakultas, kampus, dan aturan rekomendasi.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="min-h-12 rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold text-paper shadow-[0_18px_44px_oklch(0.44_0.15_147_/_0.22)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-brand-strong active:scale-[0.96]"
                href="/register"
              >
                Mulai assessment
              </Link>
              <Link
                className="min-h-12 rounded-full bg-paper px-6 py-3 text-center text-sm font-semibold text-brand-strong shadow-[inset_0_0_0_1px_var(--line),0_12px_34px_oklch(0.24_0.035_135_/_0.08)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-brand-soft active:scale-[0.96]"
                href="/admin/dashboard"
              >
                Dashboard admin
              </Link>
            </div>
          </div>

          <div className="relative rounded-[2rem] bg-paper p-4 shadow-[var(--shadow)]">
            <div className="rounded-[1.5rem] bg-brand-strong p-5 text-paper shadow-[inset_0_0_0_1px_oklch(0.96_0.018_92_/_0.14)]">
              <div className="flex items-start justify-between gap-4 border-b border-paper/15 pb-5">
                <div>
                  <p className="text-sm text-accent">Contoh hasil</p>
                  <p className="mt-2 text-5xl font-semibold tracking-[-0.08em] tabular-nums">SIE</p>
                </div>
                <div className="rounded-2xl bg-paper/10 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-paper/60">Skor</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">86%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {RIASEC_TYPES.map((type, index) => (
                  <div key={type.code} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-sm font-bold">
                      {type.code}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{type.name}</p>
                      <div className="mt-2 h-2 rounded-full bg-paper/10">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${86 - index * 9}%` }} />
                      </div>
                    </div>
                    <p className="text-sm text-paper/70 tabular-nums">{86 - index * 9}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="alur" className="relative z-10 grid gap-3 border-t border-line pt-5 sm:grid-cols-4">
          {milestones.map((item, index) => (
            <div key={item} className="rounded-2xl bg-paper p-4 shadow-[0_10px_32px_oklch(0.24_0.035_135_/_0.07)]">
              <p className="text-sm font-semibold text-brand tabular-nums">0{index + 1}</p>
              <p className="mt-2 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
