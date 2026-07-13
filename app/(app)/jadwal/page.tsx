import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getParentScheduleBoard, getScheduleBoard } from "@/lib/lms";
import { Badge, Card, Field, Icons, inputClasses } from "@/components/ui";
import { createScheduleSlotAction } from "../actions";
import { ScheduleList } from "./ScheduleList";
import { EducationLevel, UserRole } from "@/generated/prisma/client";
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
  const [{ level, anak, error }, user] = await Promise.all([searchParams, requireVerifiedUser()]);

  /* ------------------------------ wali santri ------------------------------ */

  if (user.role === UserRole.PARENT) {
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

  /* ------------------------- staf, admin, dan mudir ------------------------ */

  const activeLevel = Object.values(EducationLevel).includes(level as EducationLevel)
    ? (level as EducationLevel)
    : EducationLevel.SMP;
  const { days, courses } = await getScheduleBoard(activeLevel);

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;
  const filteredCourses = courses.filter((c) => c.level === activeLevel);

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
              {LEVEL_FULL[lvl]} ({LEVEL_LABEL[lvl]})
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
    </div>
  );
}
