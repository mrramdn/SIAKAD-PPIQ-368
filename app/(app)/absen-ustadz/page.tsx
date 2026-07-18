import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getStaffAttendanceBoard, getStaffAttendanceRecap, toDateKey, dateKeyToDb } from "@/lib/lms";
import { Badge, Card, Icons, buttonClasses, inputClasses } from "@/components/ui";
import { saveStaffAttendanceAction } from "../actions";

const STATUS_META = [
  { key: "PRESENT", label: "Hadir", color: "var(--green)" },
  { key: "EXCUSED", label: "Izin", color: "var(--primary)" },
  { key: "LATE", label: "Terlambat", color: "var(--amber)" },
  { key: "ABSENT", label: "Alpa", color: "var(--red)" },
] as const;

const ROLE_LABEL: Record<string, string> = { TEACHER: "Pengajar", HOMEROOM: "Wali Kelas" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

function shiftDateKey(dateKey: string, days: number): string {
  const d = dateKeyToDb(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function AbsenUstadzPage({ searchParams }: { searchParams: Promise<{ tanggal?: string; error?: string }> }) {
  const [{ tanggal, error }, user] = await Promise.all([searchParams, requireVerifiedUser()]);
  if (user.role === "PARENT") redirect("/dashboard");

  const todayKey = toDateKey(new Date());
  const dateKey = tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : todayKey;
  const [board, recap] = await Promise.all([getStaffAttendanceBoard(dateKey), getStaffAttendanceRecap(dateKey)]);

  const isAdmin = user.role === "ADMIN";
  const isToday = dateKey === todayKey;
  const marked = board.filter((r) => r.status !== null).length;

  return (
    <div className="view-enter flex flex-col" style={{ gap: 18 }}>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Absensi Ustadz</h1>
          <p className="mt-1 text-sm text-ink-3">
            {isAdmin
              ? "Catat kehadiran harian pengajar dan wali kelas."
              : user.role === "MUDIR"
                ? "Pantau kehadiran harian pengajar dan wali kelas."
                : "Tandai kehadiran Anda hari ini dan lihat rekap bulanan."}
          </p>
        </div>
        <form action="/absen-ustadz" method="GET" className="flex items-end gap-2">
          <div>
            <label htmlFor="tanggal" className="mb-1 block text-xs font-semibold text-ink-3">Tanggal</label>
            <input id="tanggal" type="date" name="tanggal" defaultValue={dateKey} className={inputClasses} />
          </div>
          <button type="submit" className={buttonClasses("ghost", "md")}>Tampilkan</button>
        </form>
      </div>

      {error ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold" style={{ color: "var(--red)" }}>
          {error === "forbidden"
            ? "Anda hanya dapat menandai kehadiran sendiri untuk hari ini."
            : "Data absensi tidak valid. Coba lagi."}
        </div>
      ) : null}

      <Card pad={20}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">{dateFmt.format(dateKeyToDb(dateKey))}</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">{marked} dari {board.length} ustadz tercatat</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/absen-ustadz?tanggal=${shiftDateKey(dateKey, -1)}`} className={buttonClasses("ghost", "sm")} aria-label="Hari sebelumnya">
              <Icons.chevR size={15} style={{ transform: "rotate(180deg)" }} />
            </Link>
            {!isToday ? (
              <Link href="/absen-ustadz" className={buttonClasses("soft", "sm")}>Hari ini</Link>
            ) : null}
            <Link href={`/absen-ustadz?tanggal=${shiftDateKey(dateKey, 1)}`} className={buttonClasses("ghost", "sm")} aria-label="Hari berikutnya">
              <Icons.chevR size={15} />
            </Link>
          </div>
        </div>

        {board.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-3">Belum ada akun pengajar atau wali kelas terverifikasi.</p>
        ) : (
          <div className="divide-y divide-line">
            {board.map((row) => {
              const canEdit = isAdmin || (isToday && row.id === user.id);
              const meta = STATUS_META.find((s) => s.key === row.status);
              return (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">{row.name}</span>
                      {row.id === user.id ? <Badge tone="primary">Anda</Badge> : null}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-3">{ROLE_LABEL[row.role] ?? row.role}</div>
                  </div>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_META.map((s) => {
                        const active = row.status === s.key;
                        return (
                          <form key={s.key} action={saveStaffAttendanceAction}>
                            <input type="hidden" name="teacherId" value={row.id} />
                            <input type="hidden" name="date" value={dateKey} />
                            <input type="hidden" name="status" value={s.key} />
                            <button
                              type="submit"
                              className="rounded-full border px-3 py-2 text-[12.5px] font-semibold transition"
                              style={
                                active
                                  ? { background: s.color, borderColor: s.color, color: "#fff" }
                                  : { borderColor: "var(--border)", color: "var(--text-2)" }
                              }
                            >
                              {s.label}
                            </button>
                          </form>
                        );
                      })}
                    </div>
                  ) : (
                    <span
                      className="rounded-full border px-3 py-1.5 text-[12.5px] font-semibold"
                      style={
                        meta
                          ? { background: meta.color, borderColor: meta.color, color: "#fff" }
                          : { borderColor: "var(--border)", color: "var(--text-3)" }
                      }
                    >
                      {meta ? meta.label : "Belum tercatat"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card pad={0} className="overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="text-base font-bold tracking-tight">Rekap {monthFmt.format(dateKeyToDb(dateKey))}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">Jumlah hari per status kehadiran dalam sebulan.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 480 }}>
            <thead>
              <tr className="bg-surface-2">
                <th className="sticky left-0 z-[2] min-w-[180px] bg-surface-2 px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-2">Nama</th>
                {STATUS_META.map((s) => (
                  <th key={s.key} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: s.color }}>
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recap.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="sticky left-0 z-[1] bg-surface px-5 py-3">
                    <div className="whitespace-nowrap text-sm font-semibold">{r.name}</div>
                    <div className="text-[11.5px] text-ink-3">{ROLE_LABEL[r.role] ?? r.role}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-extrabold tabular-nums" style={{ color: "var(--green)" }}>{r.present}</td>
                  <td className="px-4 py-3 text-center text-sm font-extrabold tabular-nums" style={{ color: "var(--primary)" }}>{r.excused}</td>
                  <td className="px-4 py-3 text-center text-sm font-extrabold tabular-nums" style={{ color: "var(--amber)" }}>{r.late}</td>
                  <td className="px-4 py-3 text-center text-sm font-extrabold tabular-nums" style={{ color: "var(--red)" }}>{r.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
