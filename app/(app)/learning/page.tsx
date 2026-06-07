import { CourseStatus } from "@/generated/prisma/client";
import { requireVerifiedUser } from "@/lib/auth";
import { getLearningOverview } from "@/lib/lms";
import { Card, Field, inputClasses } from "@/components/ui";
import { createCourseAction } from "../actions";
import { CourseCards } from "./CourseCards";

export default async function LearningPage() {
  const user = await requireVerifiedUser();
  const courses = await getLearningOverview(user);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="view-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Pembelajaran</h1>
          <p className="mt-1 text-sm text-ink-3">{courses.length} kelas tersedia</p>
        </div>
      </div>

      {isAdmin ? (
        <Card pad={20} className="mb-5">
          <h2 className="mb-4 text-base font-bold">Tambah Kelas</h2>
          <form action={createCourseAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <Field label="Judul kelas">
              <input name="title" required placeholder="cth. Matematika Dasar" className={inputClasses} />
            </Field>
            <Field label="Deskripsi singkat">
              <input name="description" required placeholder="Ringkasan materi kelas" className={inputClasses} />
            </Field>
            <input type="hidden" name="status" value={CourseStatus.PUBLISHED} />
            <div className="flex items-end">
              <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                Tambah
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <CourseCards courses={courses} />
    </div>
  );
}
