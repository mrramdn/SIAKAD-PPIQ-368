import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonType } from "@/generated/prisma/client";
import { requireVerifiedUser } from "@/lib/auth";
import { getCourseManagement } from "@/lib/lms";
import { Avatar, Badge, Card, Field, Icons, inputClasses, buttonClasses, courseAccent, courseCode, initialsFromName } from "@/components/ui";
import { createLessonAction, enrollStudentAction } from "../../actions";

const LESSON_LABEL: Record<LessonType, string> = {
  TEXT: "Bacaan",
  VIDEO: "Video",
  QUIZ: "Kuis",
  ASSIGNMENT: "Tugas",
};

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser();
  const { id } = await params;

  // Staff view; Mudir can supervise without write controls.
  const { course, verifiedStudents } = await getCourseManagement(id);
  if (!course) notFound();
  const accent = courseAccent(course.id);
  const enrolledIds = new Set(course.enrollments.map((e) => e.student.id));
  const availableStudents = verifiedStudents.filter((s) => !enrolledIds.has(s.id));
  const isAdmin = user.role === "ADMIN";
  const canManageLessons = user.role === "ADMIN" || user.role === "TEACHER";
  const nextOrder = course.lessons.length + 1;

  return (
    <div className="view-enter">
      <Link href="/learning" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2">
        <Icons.chevL size={17} />
        Kembali ke Pembelajaran
      </Link>

      <div
        className="relative mb-5 overflow-hidden rounded-[22px] p-6 text-white lg:p-8"
        style={{ background: `color-mix(in oklch, ${accent.color}, #000 20%)` }}
      >
        <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative">
          <span className="mono rounded-md bg-black/20 px-2.5 py-1 text-[12.5px] font-semibold">{courseCode(course.title)}</span>
          <h1 className="my-3 text-2xl font-extrabold tracking-tight lg:text-3xl">{course.title}</h1>
          <p className="max-w-[560px] text-[14.5px] leading-relaxed opacity-90">{course.description}</p>
          <div className="mt-4 text-[13.5px]">
            <strong>{course.enrollments.length}</strong> santri · <strong>{course.lessons.length}</strong> materi · status {course.status}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Link href={`/nilai?course=${course.id}`} className={buttonClasses("ghost", "sm")}>
          <Icons.chart size={15} /> Kelola Nilai
        </Link>
        <Link href={`/absen?course=${course.id}`} className={buttonClasses("ghost", "sm")}>
          <Icons.check2 size={15} /> Kelola Absensi
        </Link>
      </div>

      <div className="grid items-start gap-4.5 lg:grid-cols-[1fr_360px]" style={{ gap: 18 }}>
        {/* lessons */}
        <Card pad={20}>
          <h2 className="mb-4 text-base font-bold">Materi Kelas</h2>
          {canManageLessons ? (
            <form action={createLessonAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="order" value={nextOrder} />
              <div className="sm:col-span-2">
                <Field label="Judul materi">
                  <input name="title" required placeholder="cth. Pengantar Materi" className={inputClasses} />
                </Field>
              </div>
              <Field label="Tipe">
                <select name="type" defaultValue={LessonType.TEXT} className={inputClasses}>
                  {Object.values(LessonType).map((t) => (
                    <option key={t} value={t}>
                      {LESSON_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Durasi">
                <input name="duration" placeholder="cth. 12 mnt" className={inputClasses} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Konten ringkas">
                  <textarea name="content" rows={3} placeholder="Ringkasan materi" className={inputClasses} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                  Simpan materi ke-{nextOrder}
                </button>
              </div>
            </form>
          ) : null}

          <div className={canManageLessons ? "mt-5 flex flex-col gap-2" : "flex flex-col gap-2"}>
            {course.lessons.length === 0 ? (
              <p className="text-sm text-ink-3">Belum ada materi.</p>
            ) : (
              course.lessons.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface text-[12px] font-bold text-ink-2">{l.order}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.title}</div>
                    <div className="text-[12px] text-ink-3">
                      {LESSON_LABEL[l.type]}
                      {l.duration ? ` · ${l.duration}` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* enrollment */}
        <Card pad={20}>
          <h2 className="mb-4 text-base font-bold">Peserta ({course.enrollments.length})</h2>
          {isAdmin ? (
            <form action={enrollStudentAction} className="mb-4 flex gap-2">
              <input type="hidden" name="courseId" value={course.id} />
              <select name="studentId" className={inputClasses} disabled={availableStudents.length === 0}>
                {availableStudents.length === 0 ? (
                  <option>Semua santri sudah terdaftar</option>
                ) : (
                  availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.className}
                    </option>
                  ))
                )}
              </select>
              <button
                type="submit"
                disabled={availableStudents.length === 0}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
              >
                Enroll
              </button>
            </form>
          ) : null}

          <div className="flex flex-col gap-2">
            {course.enrollments.length === 0 ? (
              <p className="text-sm text-ink-3">Belum ada peserta.</p>
            ) : (
              course.enrollments.map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-xl bg-surface-2 p-2.5">
                  <Avatar initials={initialsFromName(e.student.name)} color={accent.color} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{e.student.name}</div>
                    <div className="mono text-[11px] text-ink-3">{e.student.studentNumber}</div>
                  </div>
                  <Badge tone="neutral">{e.progress}%</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
