import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const features = [
  "Manajemen kursus dan materi belajar",
  "Registrasi siswa dengan verifikasi admin",
  "Absensi dan nilai per course",
] as const;

export default async function Home() {
  const user = await getCurrentUser();
  const dashboardPath = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            General LMS
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <Link
                href={dashboardPath}
                className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Buka Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              Learning Management System
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Platform belajar general untuk kursus, materi, dan progres peserta.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              LMS ini dibuat sebagai fondasi awal yang fleksibel: siswa bisa registrasi, admin memverifikasi akun, lalu course, absen, dan nilai dikelola dari panel admin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? dashboardPath : "/login"}
                className="rounded-full bg-cyan-300 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Mulai Sekarang
              </Link>
              {!user ? (
                <Link
                  href="/register"
                  className="rounded-full bg-white px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Registrasi Siswa
                </Link>
              ) : null}
              <a
                href="#fitur"
                className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Lihat Fitur
              </a>
            </div>
          </div>

          <div id="fitur" className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur">
            <div className="rounded-3xl bg-slate-900 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Overview</p>
              <h2 className="mt-3 text-2xl font-semibold">Fondasi LMS</h2>
              <div className="mt-6 space-y-4">
                {features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-medium text-slate-100">{feature}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-cyan-300 p-4 text-slate-950">
                <p className="text-sm font-semibold">Demo akun</p>
                <p className="mt-2 text-sm">Admin: admin@example.com / password123</p>
                <p className="text-sm">Siswa: user@example.com / password123</p>
                <p className="text-sm">Pending: pending@example.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
