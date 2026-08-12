import Link from "next/link";
import { requireAnyPermission, userCan } from "@/lib/auth";
import { CourseStatus, EducationLevel } from "@/generated/prisma/client";
import { getCourseOverview, getParentScheduleBoard, getScheduleBoard, getTeachingStaff } from "@/lib/lms";
import { Avatar, Badge, Card, Field, Icons, courseAccent, courseCode, initialsFromName, inputClasses } from "@/components/ui";
import { createCourseAction, createScheduleSlotAction } from "../actions";
import { ScheduleList } from "./ScheduleList";
import { LEVEL_LABEL, LEVEL_FULL, LEVELS } from "@/lib/brand";

// Senin lebih dulu; dayOfWeek mengikuti Date.getDay() (0 = Ahad).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

type Day = { dayOfWeek: number; label: string; slots: React.ComponentProps<typeof ScheduleList>["slots"] };

function DayGrid({ days, canEdit }: { days: Day[]; canEdit: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 18 }}>
      {DISPLAY_ORDER.map((dayIdx) => {
        const day = days[dayIdx];
        return (
          <Card key={dayIdx} pad={16} className="flex flex-col">
            <div className="flex items-baseline justify-between border-b border-line pb-2.5">
              <span className="text-sm font-extrabold uppercase tracking-wider text-ink-1">{day.label}</span>
              <span className="text-xs font-semibold text-ink-3">{day.slots.length} sesi</span>
            </div>
            <ScheduleList slots={day.slots} canEdit={canEdit} />
          </Card>
        );
      })}
    </div>
  );
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; anak?: string; error?: string }>;
}) {
  const [{ level, anak, error }, user] = await Promise.all([
    searchParams,
    requireAnyPermission(["course.view", "schedule.view.own"]),
  ]);

  const canViewCourses = userCan(user, "course.view");

  /* ------------------------------ wali santri ------------------------------ */

  if (!canViewCourses) {
    const children = await getParentScheduleBoard(user.id);

    if (children.length === 0) {
      return (
        <div className="view-enter flex flex-col" style={{ gap: 20 }}>
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight">Jadwal Pelajaran</h1>
            <p className="mt-1 text-sm text-ink-3">Jadwal pelajaran anak Anda per pekan.</p>
          </div>
          <Card pad={40}>
            <p className="text-center text-sm text-ink-3">
              Belum ada anak yang terdaftar. Ajukan lewat menu{" "}
              <Link href="/pendaftaran" className="font-semibold text-primary-700 underline underline-offset-4">
                Daftar Anak
              </Link>
              .
            </p>
          </Card>
        </div>
      );
    }

    const activeChild = children.find((c) => c.childId === anak) ?? children[0];

    return (
      <div className="view-enter flex flex-col" style={{ gap: 20 }}>
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Jadwal Pelajaran</h1>
          <p className="mt-1 text-sm text-ink-3">Jadwal pelajaran anak Anda per pekan.</p>
        </div>

        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map((c) => {
              const active = c.childId === activeChild.childId;
              return (
                <Link
                  key={c.childId}
                  href={`/jadwal?anak=${c.childId}`}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    active ? "border-transparent bg-primary text-white" : "border-line bg-surface text-ink-2"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-ink-2">
          <Badge tone="primary">Kelas {activeChild.className}</Badge>
          <span className="font-semibold">{activeChild.name}</span>
          <span className="text-ink-4">•</span>
          <span>{LEVEL_FULL[activeChild.level]}</span>
        </div>

        <DayGrid days={activeChild.days} canEdit={false} />
      </div>
    );
  }

  /* ------------------------- staf, mudir, dan ustadz ------------------------ */

  const canEdit = userCan(user, "course.manage");

  const activeLevel = Object.values(EducationLevel).includes(level as EducationLevel)
    ? (level as EducationLevel)
    : EducationLevel.SMP;
  const [{ days, courses }, courseOverview, teachingStaff] = await Promise.all([
    getScheduleBoard(user, activeLevel),
    getCourseOverview(user),
    canEdit ? getTeachingStaff() : Promise.resolve([]),
  ]);

  const filteredCourses = courses.filter((c) => c.level === activeLevel);
  const unassignedCourses = canEdit ? courseOverview.filter((course) => !course.assigned).length : 0;

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Jadwal Pelajaran</h1>
        <p className="mt-1 text-sm text-ink-3">
          {canEdit
            ? "Kelola jadwal pelajaran untuk setiap jenjang sekolah."
            : "Jadwal kegiatan belajar mengajar di pondok pesantren."}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
          Jadwal gagal disimpan. Pilih mapel dan hari, lalu isi waktu mulai dengan format jam seperti 07:30.
        </div>
      ) : null}

      <div className="flex gap-2 border-b border-line pb-px overflow-x-auto">
        {LEVELS.map((lvl) => {
          const active = lvl === activeLevel;
          return (
            <Link
              key={lvl}
              href={`/jadwal?level=${lvl}`}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
                active ? "border-primary text-primary" : "border-transparent text-ink-3 hover:text-ink-2"
              }`}
            >
              {LEVEL_FULL[lvl] === LEVEL_LABEL[lvl] ? LEVEL_LABEL[lvl] : `${LEVEL_FULL[lvl]} (${LEVEL_LABEL[lvl]})`}
            </Link>
          );
        })}
      </div>

      {canEdit && (
        <Card pad={18}>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink-3">Tambah Slot Jadwal</h2>
          <form action={createScheduleSlotAction} className="grid gap-4 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] items-end">
            <Field label="Mata Pelajaran">
              <select name="courseId" required className={inputClasses}>
                <option value="">-- Pilih Mapel --</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Hari">
              <select name="dayOfWeek" required className={inputClasses}>
                <option value="1">Senin</option>
                <option value="2">Selasa</option>
                <option value="3">Rabu</option>
                <option value="4">Kamis</option>
                <option value="5">Jumat</option>
                <option value="6">Sabtu</option>
                <option value="0">Ahad</option>
              </select>
            </Field>

            <Field label="Waktu Mulai">
              <input name="startTime" type="time" required className={inputClasses} />
            </Field>

            <Field label="Ruangan (opsional)">
              <input name="room" type="text" placeholder="cth. Kelas 7A" className={inputClasses} />
            </Field>

            <div className="mb-4">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition"
              >
                <Icons.plus size={16} />
                Tambah
              </button>
            </div>
          </form>
        </Card>
      )}

      <DayGrid days={days} canEdit={canEdit} />

      {/* --------------------------- mata pelajaran --------------------------- */}
      <div className="mt-2">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight">Mata Pelajaran</h2>
            <p className="mt-1 text-sm text-ink-3">{courseOverview.length} mata pelajaran untuk jadwal, absensi, nilai, dan rapor.</p>
          </div>
        </div>

        {unassignedCourses > 0 ? (
          <div className="mb-5 rounded-xl border border-line bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
            {unassignedCourses} mata pelajaran lama belum memiliki ustadz pengampu. Buka detail mapel untuk menugaskannya sebelum dipakai mengisi nilai atau absensi.
          </div>
        ) : null}

        {canEdit ? (
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

        {courseOverview.length === 0 ? (
          <Card pad={40}>
            <p className="text-center text-sm text-ink-3">Belum ada mata pelajaran.</p>
          </Card>
        ) : (
          <div className="grid gap-4.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {courseOverview.map((c) => {
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
    </div>
  );
}
