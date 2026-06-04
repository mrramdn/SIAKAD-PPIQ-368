import Link from "next/link";
import { CourseStatus } from "@/generated/prisma/client";
import { createCourseAction, updateCourseAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminCourses } from "@/lib/lms";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const courses = await getAdminCourses();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-lg font-semibold">General LMS</Link>
            <p className="mt-1 text-sm text-slate-500">Manajemen course</p>
          </div>
          <Link href="/admin/students" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Data Siswa</Link>
        </nav>

        <header className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Course builder</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Masukkan course dan materi</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Buat course, atur status, lalu masuk ke detail course untuk lesson, enrollment, absen, dan nilai.</p>
        </header>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Tambah course</h2>
          <form action={createCourseAction} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_0.45fr_auto]">
            <input name="title" required placeholder="Judul course" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <input name="description" required placeholder="Deskripsi singkat" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <select name="status" defaultValue={CourseStatus.PUBLISHED} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950">
              {Object.values(CourseStatus).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Tambah</button>
          </form>
        </section>

        <section className="mt-8 grid gap-5">
          {courses.map((course) => (
            <article key={course.id} className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{course.title}</h2>
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-900">{course.status}</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{course.description}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {course._count.lessons} lesson · {course._count.enrollments} siswa · {course._count.attendanceSessions} sesi absen · {course._count.gradeItems} item nilai
                  </p>
                </div>
                <Link href={`/admin/courses/${course.id}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Kelola
                </Link>
              </div>

              <form action={updateCourseAction} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_0.35fr_auto]">
                <input type="hidden" name="courseId" value={course.id} />
                <input name="title" defaultValue={course.title} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
                <input name="description" defaultValue={course.description} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
                <select name="status" defaultValue={course.status} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950">
                  {Object.values(CourseStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button type="submit" className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50">Update</button>
              </form>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
