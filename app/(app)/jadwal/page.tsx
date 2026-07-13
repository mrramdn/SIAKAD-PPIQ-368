import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getScheduleBoard } from "@/lib/lms";
import { Card, Field, Icons, inputClasses } from "@/components/ui";
import { createScheduleSlotAction } from "../actions";
import { ScheduleList } from "./ScheduleList";
import { EducationLevel, UserRole } from "@/generated/prisma/client";
import { LEVEL_LABEL, LEVEL_FULL, LEVELS } from "@/lib/brand";

export default async function JadwalPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const [{ level }, user] = await Promise.all([searchParams, requireVerifiedUser()]);

  const activeLevel = Object.values(EducationLevel).includes(level as EducationLevel)
    ? (level as EducationLevel)
    : EducationLevel.SMP;
  const { days, courses } = await getScheduleBoard(activeLevel);

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER || user.role === UserRole.HOMEROOM;

  // Filter courses to only show those of the active level for scheduling
  const filteredCourses = courses.filter((c) => c.level === activeLevel);

  // Indonesian day names mapping starting from Monday (Senin) to Sunday (Ahad)
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Jadwal Pelajaran</h1>
          <p className="mt-1 text-sm text-ink-3">
            {canEdit
              ? "Kelola jadwal pelajaran untuk setiap jenjang sekolah."
              : "Jadwal kegiatan belajar mengajar di pondok pesantren."}
          </p>
        </div>
      </div>

      {/* Level selector tabs */}
      <div className="flex gap-2 border-b border-line pb-px overflow-x-auto">
        {LEVELS.map((lvl) => {
          const active = lvl === activeLevel;
          return (
            <Link
              key={lvl}
              href={`/jadwal?level=${lvl}`}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-3 hover:text-ink-2"
              }`}
            >
              {LEVEL_FULL[lvl]} ({LEVEL_LABEL[lvl]})
            </Link>
          );
        })}
      </div>

      {/* Add Slot Form (Staff only) */}
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
              <input
                name="startTime"
                type="text"
                required
                placeholder="cth. 07:30"
                className={inputClasses}
              />
            </Field>

            <Field label="Ruangan (opsional)">
              <input
                name="room"
                type="text"
                placeholder="cth. Kelas 7A"
                className={inputClasses}
              />
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

      {/* Schedule Board Grid */}
      <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7" style={{ gap: 18 }}>
        {displayOrder.map((dayIdx) => {
          const day = days[dayIdx];
          return (
            <Card key={dayIdx} pad={14} className="flex flex-col gap-3 min-h-[220px]">
              <div className="border-b border-line pb-2">
                <span className="text-sm font-extrabold text-ink-1 uppercase tracking-wider">
                  {day.label}
                </span>
                <span className="ml-1.5 text-xs font-semibold text-ink-3">
                  ({day.slots.length})
                </span>
              </div>
              <div className="flex-1">
                <ScheduleList slots={day.slots} canEdit={canEdit} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
