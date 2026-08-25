import Link from "next/link";
import { requireAnyPermission, userCan } from "@/lib/auth";
import { EducationLevel } from "@/generated/prisma/client";
import { getCourseOverview, getParentScheduleBoard, getScheduleBoard } from "@/lib/lms";
import { Avatar, Badge, Card, Icons, courseAccent, courseCode, initialsFromName } from "@/components/ui";
import { DayGrid } from "./ScheduleList";
import { LEVEL_LABEL, LEVEL_FULL, LEVELS } from "@/lib/brand";

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; anak?: string }>;
}) {
  const [{ level, anak }, user] = await Promise.all([
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
                Pendaftaran
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

  const canManageAcademics = userCan(user, "course.manage");

  const activeLevel = Object.values(EducationLevel).includes(level as EducationLevel)
    ? (level as EducationLevel)
    : EducationLevel.SMP;
  const [{ days }, courseOverview] = await Promise.all([getScheduleBoard(user, activeLevel), getCourseOverview(user)]);

  const unassignedCourses = canManageAcademics ? courseOverview.filter((course) => !course.assigned).length : 0;

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Jadwal Pelajaran</h1>
        <p className="mt-1 text-sm text-ink-3">
          {canManageAcademics
            ? "Jadwal pelajaran per jenjang. Kelola slot dan mata pelajaran lewat menu Administrasi Akademik."
            : "Jadwal kegiatan belajar mengajar di pondok pesantren."}
        </p>
      </div>

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

      <DayGrid days={days} canEdit={false} />

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
            {unassignedCourses} mata pelajaran lama belum memiliki ustadz pengampu. Buka{" "}
            <Link href="/akademik" className="underline underline-offset-2">
              Administrasi Akademik
            </Link>{" "}
            untuk menugaskannya sebelum dipakai mengisi nilai atau absensi.
          </div>
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
