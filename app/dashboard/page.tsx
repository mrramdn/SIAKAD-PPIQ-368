import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLearnerDashboard } from "@/lib/lms";

export default async function DashboardPage() {
  const user = await requireUser();
  const { enrollments, availableCourses } = await getLearnerDashboard(user.id);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-lg font-semibold">
              General LMS
            </Link>
            <p className="mt-1 text-sm text-slate-500">Dashboard user</p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "ADMIN" ? (
              <Link href="/admin" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white">
                Admin
              </Link>
            ) : null}
            <form action="/logout" method="post">
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" type="submit">
                Logout
              </button>
            </form>
          </div>
        </nav>

        <header className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Selamat datang</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Halo, {user.name}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Lihat kursus yang sedang kamu ikuti dan daftar materi yang tersedia di LMS.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Kursus Saya</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{enrollments.length} aktif</span>
            </div>

            <div className="mt-5 space-y-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <article key={enrollment.id} className="rounded-3xl border border-slate-100 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{enrollment.course.title}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{enrollment.course.description}</p>
                      </div>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-900">
                        {enrollment.course._count.lessons} lesson
                      </span>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Progress {enrollment.progress}%</p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                  Belum ada kursus yang diikuti.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Kursus Tersedia</h2>
            <div className="mt-5 space-y-4">
              {availableCourses.length > 0 ? (
                availableCourses.map((course) => (
                  <article key={course.id} className="rounded-3xl bg-slate-50 p-5">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{course.description}</p>
                    <p className="mt-4 text-sm text-slate-600">
                      {course._count.lessons} lesson · {course._count.enrollments} peserta
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">Semua kursus sudah kamu ikuti.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
