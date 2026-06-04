import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getStudents } from "@/lib/lms";

export default async function AdminStudentsPage() {
  await requireAdmin();
  const students = await getStudents();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-lg font-semibold">General LMS</Link>
            <p className="mt-1 text-sm text-slate-500">Data siswa</p>
          </div>
          <Link href="/admin/users" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Verifikasi User</Link>
        </nav>

        <header className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Students</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Siswa LMS</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Pantau status siswa, kelas, enrollment, absensi, dan nilai.</p>
        </header>

        <section className="mt-8 grid gap-4">
          {students.map((student) => (
            <article key={student.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{student.name}</h2>
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-900">{student.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    NIS {student.profile?.studentNumber ?? "-"} · Kelas {student.profile?.className ?? "-"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><b>{student._count.enrollments}</b><br />Course</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><b>{student._count.attendanceRecords}</b><br />Absen</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><b>{student._count.gradeRecords}</b><br />Nilai</div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
