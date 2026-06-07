import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getAttendanceBoard } from "@/lib/lms";
import { Card, Field, Ring, inputClasses } from "@/components/ui";
import { createAttendanceSessionAction } from "../actions";
import { AttendanceGrid } from "./AttendanceGrid";

const STATUS_META = [
  { key: "PRESENT", label: "Hadir", color: "var(--green)" },
  { key: "EXCUSED", label: "Izin", color: "var(--primary)" },
  { key: "LATE", label: "Terlambat", color: "var(--amber)" },
  { key: "ABSENT", label: "Alpa", color: "var(--red)" },
] as const;

export default async function AbsenPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const [{ course }, user] = await Promise.all([searchParams, requireVerifiedUser()]);
  const { courses, activeCourseId, sessions, rows, canEdit } = await getAttendanceBoard(user, course);

  const todayCol = sessions.length - 1;
  const counts: Record<string, number> = { PRESENT: 0, EXCUSED: 0, LATE: 0, ABSENT: 0 };
  if (todayCol >= 0) {
    for (const r of rows) {
      const m = r.marks[todayCol] ?? "PRESENT";
      counts[m] = (counts[m] ?? 0) + 1;
    }
  }
  const total = rows.length;
  const rate = total ? Math.round((counts.PRESENT / total) * 100) : 0;

  return (
    <div className="view-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Absensi</h1>
          <p className="mt-1 text-sm text-ink-3">{canEdit ? "Ketuk sel untuk mengubah status kehadiran." : "Rekap kehadiran kamu per sesi."}</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada kelas.</p>
        </Card>
      ) : (
        <>
          {/* recap */}
          <div className="mb-5 grid items-stretch gap-4.5 lg:grid-cols-[260px_1fr]" style={{ gap: 18 }}>
            <Card pad={20} className="flex items-center gap-4.5" style={{ gap: 18 }}>
              <Ring value={rate} size={92} stroke={11} color="var(--green)" label={`${rate}%`} sub="HADIR" />
              <div>
                <div className="text-[13px] font-semibold text-ink-3">Kehadiran Sesi Terbaru</div>
                <div className="mt-1 text-[22px] font-extrabold tracking-tight">
                  {counts.PRESENT}/{total} siswa
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">{todayCol >= 0 ? sessions[todayCol].date : "-"}</div>
              </div>
            </Card>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))" }}>
              {STATUS_META.map((s) => (
                <Card key={s.key} pad={16}>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded" style={{ background: s.color }} />
                    <span className="text-[13px] font-semibold text-ink-2">{s.label}</span>
                  </div>
                  <div className="mt-2 text-[28px] font-extrabold tracking-tight" style={{ color: s.color }}>
                    {counts[s.key]}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* course tabs */}
          <div className="mb-3.5 flex gap-2 overflow-x-auto pb-1">
            {courses.map((c) => {
              const active = c.id === activeCourseId;
              return (
                <Link
                  key={c.id}
                  href={`/absen?course=${c.id}`}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    active ? "border-transparent bg-primary text-white" : "border-line bg-surface text-ink-2"
                  }`}
                >
                  {c.title}
                </Link>
              );
            })}
          </div>

          {/* add session */}
          {canEdit && activeCourseId ? (
            <Card pad={16} className="mb-3.5">
              <form action={createAttendanceSessionAction} className="grid gap-3 md:grid-cols-[1fr_0.8fr_auto]">
                <input type="hidden" name="courseId" value={activeCourseId} />
                <Field label="Judul sesi">
                  <input name="title" required placeholder="cth. Pertemuan 5" className={inputClasses} />
                </Field>
                <Field label="Tanggal & waktu">
                  <input name="heldAt" type="datetime-local" required className={inputClasses} />
                </Field>
                <div className="flex items-end">
                  <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                    Buat sesi
                  </button>
                </div>
              </form>
            </Card>
          ) : null}

          <AttendanceGrid sessions={sessions} rows={rows} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
