import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceStatus } from "@/generated/prisma/client";
import {
  createAttendanceSessionAction,
  createGradeItemAction,
  createLessonAction,
  enrollStudentAction,
  updateAttendanceRecordAction,
  upsertGradeRecordAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getCourseManagement } from "@/lib/lms";

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCourseDetailPage({ params }: CoursePageProps) {
  await requireAdmin();
  const { id } = await params;
  const { course, verifiedStudents } = await getCourseManagement(id);

  if (!course) {
    notFound();
  }

  const enrolledIds = new Set(course.enrollments.map((enrollment) => enrollment.user.id));
  const availableStudents = verifiedStudents.filter((student) => !enrolledIds.has(student.id));

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/courses" className="text-lg font-semibold">General LMS</Link>
            <p className="mt-1 text-sm text-slate-500">Detail course</p>
          </div>
          <Link href="/admin" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Admin</Link>
        </nav>

        <header className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Course</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{course.description}</p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Tambah lesson</h2>
            <form action={createLessonAction} className="mt-5 space-y-4">
              <input type="hidden" name="courseId" value={course.id} />
              <input name="title" required placeholder="Judul lesson" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
              <input name="description" placeholder="Deskripsi" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
              <textarea name="content" rows={4} placeholder="Konten ringkas" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
              <input name="order" type="number" min={1} required placeholder="Urutan" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
              <button type="submit" className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Simpan lesson</button>
            </form>

            <div className="mt-6 space-y-3">
              {course.lessons.map((lesson) => (
                <article key={lesson.id} className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-400">Lesson {lesson.order}</p>
                  <h3 className="mt-1 font-semibold">{lesson.title}</h3>
                  {lesson.description ? <p className="mt-1 text-sm text-slate-500">{lesson.description}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Enrollment siswa</h2>
            <form action={enrollStudentAction} className="mt-5 flex gap-3 max-sm:flex-col">
              <input type="hidden" name="courseId" value={course.id} />
              <select name="userId" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950">
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>{student.name} · {student.profile?.className ?? "-"}</option>
                ))}
              </select>
              <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Enroll</button>
            </form>

            <div className="mt-6 space-y-3">
              {course.enrollments.map((enrollment) => (
                <article key={enrollment.id} className="rounded-3xl bg-slate-50 p-4">
                  <h3 className="font-semibold">{enrollment.user.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {enrollment.user.profile?.studentNumber ?? "-"} · {enrollment.user.profile?.className ?? "-"} · Progress {enrollment.progress}%
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Absensi</h2>
          <form action={createAttendanceSessionAction} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.7fr_auto]">
            <input type="hidden" name="courseId" value={course.id} />
            <input name="title" required placeholder="Pertemuan 1" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <input name="heldAt" type="datetime-local" required className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Buat sesi</button>
          </form>

          <div className="mt-6 space-y-5">
            {course.attendanceSessions.map((session) => (
              <article key={session.id} className="rounded-3xl border border-slate-100 p-5">
                <h3 className="font-semibold">{session.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(session.heldAt)}</p>
                <div className="mt-4 space-y-3">
                  {session.records.map((record) => (
                    <form key={record.id} action={updateAttendanceRecordAction} className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-[1fr_0.45fr_0.7fr_auto]">
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="attendanceSessionId" value={session.id} />
                      <input type="hidden" name="userId" value={record.user.id} />
                      <p className="text-sm font-medium">{record.user.name}<br /><span className="font-normal text-slate-500">{record.user.profile?.className ?? "-"}</span></p>
                      <select name="status" defaultValue={record.status} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-950">
                        {Object.values(AttendanceStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <input name="note" defaultValue={record.note ?? ""} placeholder="Catatan" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-950" />
                      <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Update</button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Nilai</h2>
          <form action={createGradeItemAction} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_0.35fr_auto]">
            <input type="hidden" name="courseId" value={course.id} />
            <input name="title" required placeholder="Tugas 1" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <input name="description" placeholder="Deskripsi" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <input name="maxScore" type="number" min={1} defaultValue={100} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Buat item</button>
          </form>

          <div className="mt-6 space-y-5">
            {course.gradeItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-100 p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Maksimal {item.maxScore} poin</p>
                <div className="mt-4 space-y-3">
                  {course.enrollments.map((enrollment) => {
                    const record = item.records.find((grade) => grade.user.id === enrollment.user.id);

                    return (
                      <form key={enrollment.id} action={upsertGradeRecordAction} className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-[1fr_0.35fr_0.8fr_auto]">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="gradeItemId" value={item.id} />
                        <input type="hidden" name="userId" value={enrollment.user.id} />
                        <p className="text-sm font-medium">{enrollment.user.name}<br /><span className="font-normal text-slate-500">{enrollment.user.profile?.className ?? "-"}</span></p>
                        <input name="score" type="number" min={0} max={item.maxScore} defaultValue={record?.score ?? 0} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-950" />
                        <input name="feedback" defaultValue={record?.feedback ?? ""} placeholder="Feedback" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-950" />
                        <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Simpan</button>
                      </form>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
