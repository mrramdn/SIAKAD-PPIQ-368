"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Icons } from "@/components/ui";
import { markAllPresentAction, setAttendanceStatusAction } from "../actions";

type Status = "PRESENT" | "EXCUSED" | "LATE" | "ABSENT";
type Row = { studentId: string; name: string; studentNumber: string; marks: (Status | null)[] };
type Session = { id: string; title: string; date: string };

const META: Record<Status, { code: string; label: string; color: string; soft: string }> = {
  PRESENT: { code: "H", label: "Hadir", color: "var(--green)", soft: "var(--green-soft)" },
  EXCUSED: { code: "I", label: "Izin", color: "var(--primary)", soft: "var(--primary-soft)" },
  LATE: { code: "T", label: "Terlambat", color: "var(--amber)", soft: "var(--amber-soft)" },
  ABSENT: { code: "A", label: "Alpa", color: "var(--red)", soft: "var(--red-soft)" },
};
const ORDER: Status[] = ["PRESENT", "EXCUSED", "LATE", "ABSENT"];

export function AttendanceGrid({
  sessions,
  rows: initialRows,
  canEdit,
}: {
  sessions: Session[];
  rows: Row[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [, startTransition] = useTransition();
  const todayCol = sessions.length - 1;

  function cycle(rowIdx: number, colIdx: number) {
    if (!canEdit) return;
    const session = sessions[colIdx];
    const cur = rows[rowIdx].marks[colIdx] ?? "PRESENT";
    const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, marks: r.marks.map((m, c) => (c === colIdx ? next : m)) } : r)));
    startTransition(async () => {
      await setAttendanceStatusAction({ sessionId: session.id, userId: rows[rowIdx].studentId, status: next });
    });
  }

  function markAll() {
    if (!canEdit || todayCol < 0) return;
    setRows((prev) => prev.map((r) => ({ ...r, marks: r.marks.map((m, c) => (c === todayCol ? "PRESENT" : m)) })));
    startTransition(async () => {
      await markAllPresentAction(sessions[todayCol].id);
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return (
      <Card pad={40}>
        <p className="text-center text-sm text-ink-3">Belum ada sesi absensi di kelas ini.</p>
      </Card>
    );
  }

  return (
    <>
      {canEdit ? (
        <div className="mb-3.5 flex justify-end">
          <Button variant="soft" size="sm" icon={<Icons.check2 size={15} />} onClick={markAll}>
            Tandai semua hadir
          </Button>
        </div>
      ) : null}

      <Card pad={0} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 620 }}>
            <thead>
              <tr className="bg-surface-2">
                <th className="sticky left-0 z-[2] min-w-[200px] bg-surface-2 px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-2">
                  Siswa
                </th>
                {sessions.map((s, i) => (
                  <th
                    key={s.id}
                    className="px-3.5 py-3 text-center text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: i === todayCol ? "var(--primary-700)" : "var(--text-2)" }}
                  >
                    {s.date}
                    {i === todayCol ? <div className="text-[9px] font-bold text-primary">TERBARU</div> : null}
                  </th>
                ))}
                <th className="px-3.5 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-2">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const present = r.marks.filter((m) => m === "PRESENT").length;
                const pct = r.marks.length ? Math.round((present / r.marks.length) * 100) : 0;
                return (
                  <tr key={r.studentId} className="border-t border-line">
                    <td className="sticky left-0 z-[1] bg-surface px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-right text-[12px] font-semibold text-ink-3">{ri + 1}</span>
                        <Avatar initials={r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} color="var(--primary)" size={30} />
                        <div className="whitespace-nowrap text-[13.5px] font-semibold">{r.name}</div>
                      </div>
                    </td>
                    {r.marks.map((m, ci) => {
                      const meta = META[m ?? "PRESENT"];
                      return (
                        <td key={ci} className="px-1.5 py-2 text-center">
                          <button
                            onClick={() => cycle(ri, ci)}
                            disabled={!canEdit}
                            className="grid h-[30px] w-[30px] place-items-center rounded-lg text-[12.5px] font-bold transition active:scale-90"
                            style={{
                              background: meta.soft,
                              color: meta.color,
                              border: ci === todayCol ? `1.5px solid ${meta.color}` : "1.5px solid transparent",
                              cursor: canEdit ? "pointer" : "default",
                            }}
                          >
                            {meta.code}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3.5 py-2.5 text-center">
                      <span
                        className="text-[13.5px] font-bold"
                        style={{ color: pct >= 90 ? "var(--green)" : pct >= 75 ? "var(--amber)" : "var(--red)" }}
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-line bg-surface-2 px-4 py-3">
          {ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <span
                className="grid h-[22px] w-[22px] place-items-center rounded-md text-[11px] font-bold"
                style={{ background: META[s].soft, color: META[s].color }}
              >
                {META[s].code}
              </span>
              {META[s].label}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
