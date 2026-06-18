import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Icons } from "@/components/ui";
import { APP_NAME, APP_TAGLINE, LEVEL_FULL, LEVELS } from "@/lib/brand";

const features = [
  "Pantau nilai dan kehadiran anak secara berkala",
  "Informasi dan pengumuman langsung dari pesantren",
  "Pendaftaran santri baru untuk SD, SMP, dan SMA",
] as const;

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-7">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--primary)" }}>
              <Icons.cap size={20} style={{ color: "#fff" }} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">{APP_NAME}</span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            {user ? "Buka Dashboard" : "Login Wali"}
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-700">
              {APP_TAGLINE}
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
              Hubungkan pesantren dengan wali santri.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-2 text-pretty">
              Orang tua memantau nilai, kehadiran, dan informasi anak. Guru mengelola kelas dan penilaian. Admin meninjau
              pendaftaran santri baru dari satu panel.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pendaftaran"
                className="rounded-xl bg-primary px-6 py-3 text-center font-semibold text-white transition hover:bg-primary-600"
              >
                Daftar Santri Baru
              </Link>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-xl border border-line-strong px-6 py-3 text-center font-semibold text-ink-2 transition hover:bg-surface-2"
              >
                {user ? "Buka Dashboard" : "Login Wali / Guru"}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {LEVELS.map((l) => (
                <span key={l} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink-2">
                  <span className="grid h-5 w-5 place-items-center rounded bg-primary-soft text-[11px] text-primary-700">{l}</span>
                  {LEVEL_FULL[l]}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-line bg-surface p-6 shadow-pop">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Ringkasan</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Satu sistem, banyak peran</h2>
            <div className="mt-6 space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-700">
                    <Icons.check2 size={17} />
                  </span>
                  <p className="text-sm font-semibold text-ink">{feature}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-primary p-4 text-white">
              <p className="text-sm font-bold">Akun demo</p>
              <p className="mono mt-2 text-[13px]">admin@pesantren.id / password123</p>
              <p className="mono text-[13px]">wali@pesantren.id / password123</p>
              <p className="mono text-[13px]">guru@pesantren.id / password123</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
