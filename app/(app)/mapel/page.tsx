import Link from "next/link";
import { CourseStatus } from "@/generated/prisma/client";
import { requireStaffViewer } from "@/lib/auth";
import { getCourseOverview, getTeachingStaff } from "@/lib/lms";
import { LEVEL_FULL } from "@/lib/brand";
import { Avatar, Badge, Card, Field, Icons, inputClasses, courseAccent, courseCode, initialsFromName } from "@/components/ui";
import { createCourseAction } from "../actions";

export default async function MapelPage() {
  const user = await requireStaffViewer();
  const isAdmin = user.role === "ADMIN";
  const [courses, teachingStaff] = await Promise.all([
    getCourseOverview(user),
    isAdmin ? getTeachingStaff() : Promise.resolve([]),
  ]);
  const unassignedCourses = isAdmin ? courses.filter((course) => !course.assigned).length : 0;

  return (
    <div className="view-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Mata Pelajaran</h1>
          <p className="mt-1 text-sm text-ink-3">{courses.length} mata pelajaran untuk jadwal, absensi, nilai, dan rapor.</p>
        </div>
      </div>

      {unassignedCourses > 0 ? (
        <div className="mb-5 rounded-xl border border-line bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
          {unassignedCourses} mata pelajaran lama belum memiliki ustadz pengampu. Buka detail mapel untuk menugaskannya sebelum dipakai mengisi nilai atau absensi.
        </div>
      ) : null}

      {isAdmin ? (
        <Card pad={20} className="mb-5">
          <h2 className="mb-4 text-base font-bold">Tambah Mata Pelajaran</h2>
          <form action={createCourseAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_auto]">
            <Field label="Nama mata pelajaran">
              <input name="title" required placeholder="cth. Matematika" className={inputClasses} />
            </Field>
            <Field label="Deskripsi singkat">
              <input name="description" required placeholder="Ringkasan mata pelajaran" className={inputClasses} />
            </Field>
            <Field label="Ustadz pengampu">
              <select name="teacherId" required className={inputClasses} defaultValue="">
                <option value="" disabled>Pilih ustadz</option>
                {teachingStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
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

      {courses.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada mata pelajaran.</p>
        </Card>
      ) : (
        <div className="grid gap-4.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {courses.map((c) => {
            const accent = courseAccent(c.id);
            return (
              <Link key={c.id} href={`/mapel/${c.id}`} className="block">
                <Card hover pad={0} className="overflow-hidden">
                  <div
                    className="relative flex h-20 items-end p-4"
                    style={{ background: `color-mix(in oklch, ${accent.color}, #000 18%)` }}
                  >
                    <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-white/10" />
                    <div className="relative flex w-full items-end justify-between">
                      <span className="mono rounded-md bg-black/20 px-2.5 py-1 text-xs font-semibold text-white">{courseCode(c.title)}</span>
                      <Badge tone="neutral">{LEVEL_FULL[c.level] ?? c.level}</Badge>
                    </div>
                  </div>
                  <div style={{ padding: 18 }}>
                    <h3 className="text-[17px] font-bold tracking-tight">{c.title}</h3>
                    <p className="mt-1.5 line-clamp-2 min-h-[38px] text-[13px] leading-relaxed text-ink-3">{c.description}</p>
                    <div className="my-3 flex items-center gap-2">
                      <Avatar initials={initialsFromName(c.teacher)} color={accent.color} size={28} />
                      <span className="text-[13px] font-medium text-ink-2">{c.teacher}</span>
                    </div>
                    <div className="flex gap-4 text-[12.5px] text-ink-3">
                      <span className="flex items-center gap-1.5">
                        <Icons.users size={15} />
                        {c.students} santri
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icons.calendar size={15} />
                        {c.scheduleSlots} slot jadwal
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
