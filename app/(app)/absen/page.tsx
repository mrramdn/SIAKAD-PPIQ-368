import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getAttendanceBoard } from "@/lib/lms";
import { Card, Field, Ring, buttonClasses, inputClasses } from "@/components/ui";
import { createAttendanceSessionAction } from "../actions";
import { AttendanceGrid } from "./AttendanceGrid";

const STATUS_META = [
  { key: "PRESENT", label: "Hadir", color: "var(--green)" },
  { key: "EXCUSED", label: "Izin", color: "var(--primary)" },
  { key: "LATE", label: "Terlambat", color: "var(--amber)" },
  { key: "ABSENT", label: "Alpa", color: "var(--red)" },
] as const;

export default async function AbsenPage({ searchParams }: { searchParams: Promise<{ course?: string; error?: string }> }) {
  const [{ course, error }, user] = await Promise.all([searchParams, requirePermission("attendance.record")]);
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
          <p className="mt-1 text-sm text-ink-3">Ketuk sel untuk mengubah status kehadiran.</p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-line bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error === "forbidden" ? "Anda tidak ditugaskan pada mata pelajaran ini." : "Sesi absensi gagal dibuat. Periksa kembali isian Anda."}
        </div>
      ) : null}

      {courses.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada kelas.</p>
        </Card>
      ) : (
        <>
          {/* recap */}
          <Card pad={18} className="mb-5">
            <div className="grid items-center gap-5 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-4 md:border-r md:border-line md:pr-5">
                <Ring value={rate} size={82} stroke={10} color="var(--green)" label={`${rate}%`} sub="HADIR" />
                <div>
                  <div className="text-[13px] font-semibold text-ink-3">Sesi Terbaru</div>
                  <div className="mt-1 text-[20px] font-extrabold tracking-tight">
                    {counts.PRESENT}/{total} santri
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ink-3">{todayCol >= 0 ? sessions[todayCol].date : "Belum ada sesi"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
                {STATUS_META.map((s, index) => (
                  <div
                    key={s.key}
                    className={
                      index === 0
                        ? ""
                        : index === 1
                          ? "border-l border-line pl-4"
                          : index === 2
                            ? "border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"
                            : "border-l border-t border-line pl-4 pt-4 sm:border-t-0 sm:pt-0"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded" style={{ background: s.color }} />
                      <span className="text-[13px] font-semibold text-ink-2">{s.label}</span>
                    </div>
                    <div className="mt-2 text-[28px] font-extrabold tracking-tight" style={{ color: s.color }}>
                      {counts[s.key]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

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
                  <button type="submit" className={buttonClasses("primary", "md")}>
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
