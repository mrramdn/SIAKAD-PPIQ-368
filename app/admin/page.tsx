import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/lms";

const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function AdminPage() {
  const user = await requireAdmin();
  const overview = await getAdminOverview();
  const stats = [
    { label: "User", value: overview.totalUsers },
    { label: "Pending", value: overview.pendingUsers },
    { label: "Course", value: overview.totalCourses },
    { label: "Enrollment", value: overview.totalEnrollments },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-lg font-semibold">
              General LMS
            </Link>
            <p className="mt-1 text-sm text-slate-400">Admin panel</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
              User Dashboard
            </Link>
            <Link href="/admin/users" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
              Verifikasi
            </Link>
            <Link href="/admin/courses" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
              Courses
            </Link>
            <form action="/logout" method="post">
              <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200" type="submit">
                Logout
              </button>
            </form>
          </div>
        </nav>

        <header className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Admin LMS</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Halo, {user.name}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Pantau data LMS: verifikasi siswa, kursus, lesson, enrollment, absensi, dan nilai.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 text-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Daftar Course</h2>
              <p className="mt-1 text-sm text-slate-500">Data awal dari seed database.</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
            <div className="grid grid-cols-[1.2fr_0.6fr_0.7fr] bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500 max-md:hidden">
              <span>Course</span>
              <span>Konten</span>
              <span>Dibuat</span>
            </div>
            {overview.courses.map((course) => (
              <article key={course.id} className="grid gap-4 border-t border-slate-100 px-5 py-4 md:grid-cols-[1.2fr_0.6fr_0.7fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{course.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{course.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{course.description}</p>
                  <p className="mt-2 text-xs text-slate-400">Creator: {course.createdBy?.name ?? "System"}</p>
                </div>
                <p className="text-sm text-slate-600">
                  {course._count.lessons} lesson · {course._count.enrollments} peserta
                </p>
                <p className="text-sm text-slate-600">{formatter.format(course.createdAt)}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
