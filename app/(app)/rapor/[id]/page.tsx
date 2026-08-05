import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnyPermission, userCan } from "@/lib/auth";
import { getReportCardDetail, formatPeriod } from "@/lib/lms";
import { Badge, Card, Icons, scoreColor } from "@/components/ui";
import { HomeroomNoteForm } from "./HomeroomNoteForm";

export default async function RaporDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAnyPermission(["report.manage", "report.distribute"]);

  const canEdit = userCan(user, "report.manage");

  const reportCard = await getReportCardDetail(id);
  if (!reportCard) {
    notFound();
  }

  const { student, semester, academicYear, status, publishedAt, homeroomNote, entries } = reportCard;

  // Compute attendance totals across all courses
  const totalAtt = entries.reduce(
    (acc, e) => {
      acc.present += e.present;
      acc.late += e.late;
      acc.absent += e.absent;
      acc.excused += e.excused;
      return acc;
    },
    { present: 0, late: 0, absent: 0, excused: 0 }
  );

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      {/* Back button */}
      <Link
        href={`/rapor?class=${student.className}&semester=${semester}&year=${academicYear}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink-2 transition"
      >
        <Icons.chevL size={16} /> Kembali ke Rapor Kelas {student.className}
      </Link>

      {/* Header Info Card */}
      <Card pad={20}>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-bold text-primary-700">
              {student.level}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-1">{student.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                <Badge tone="primary">Kelas {student.className}</Badge>
                <span className="mono">{student.studentNumber}</span>
                <span className="text-ink-4">•</span>
                <span>{formatPeriod({ semester, academicYear })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === "DRAFT" ? (
              <Badge tone="warning">Draft</Badge>
            ) : (
              <div className="flex flex-col items-end">
                <Badge tone="success">Terbit</Badge>
                {publishedAt && (
                  <span className="mt-1 text-[11px] text-ink-3 font-semibold">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(publishedAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Table of Entries */}
      <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]" style={{ gap: 20 }}>
        {/* Left Side: Course grades and detailed attendance */}
        <div className="flex flex-col gap-4">
          <Card pad={0} className="overflow-hidden">
            <div className="border-b border-line bg-surface-2 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-2">Hasil Pembelajaran</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 450 }}>
                <thead>
                  <tr className="bg-surface-2/50 border-b border-line">
                    <th className="sticky left-0 z-[2] min-w-[160px] bg-surface-2 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-ink-2">Mata Pelajaran</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-ink-2 w-24">Nilai Akhir</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-ink-2 w-36">Kehadiran (H/I/T/A)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-0 hover:bg-surface-2/20 transition-colors">
                      <td className="sticky left-0 z-[1] bg-surface px-4 py-3.5 text-sm font-semibold text-ink-1 whitespace-nowrap">{e.courseTitle}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-base font-extrabold" style={{ color: scoreColor(e.finalScore) }}>
                          {e.finalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-ink-2">
                        <span className="text-success">{e.present}</span>
                        <span className="text-ink-4 mx-1">/</span>
                        <span className="text-primary">{e.excused}</span>
                        <span className="text-ink-4 mx-1">/</span>
                        <span className="text-amber-600">{e.late}</span>
                        <span className="text-ink-4 mx-1">/</span>
                        <span className="text-danger">{e.absent}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Side: Overall Attendance Summary & Homeroom Note */}
        <div className="flex flex-col gap-4">
          {/* Attendance Summary */}
          <Card pad={18}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-3">Rekap Kehadiran Semester</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-success-soft p-2.5">
                <div className="text-xs font-bold text-[oklch(0.42_0.13_150)]">Hadir</div>
                <div className="mt-1 text-2xl font-extrabold text-[oklch(0.42_0.13_150)]">{totalAtt.present}</div>
              </div>
              <div className="rounded-xl bg-primary-soft p-2.5">
                <div className="text-xs font-bold text-primary-700">Izin</div>
                <div className="mt-1 text-2xl font-extrabold text-primary-700">{totalAtt.excused}</div>
              </div>
              <div className="rounded-xl bg-warning-soft p-2.5">
                <div className="text-xs font-bold text-[oklch(0.48_0.12_75)]">Lambat</div>
                <div className="mt-1 text-2xl font-extrabold text-[oklch(0.48_0.12_75)]">{totalAtt.late}</div>
              </div>
              <div className="rounded-xl bg-danger-soft p-2.5">
                <div className="text-xs font-bold text-[oklch(0.46_0.16_25)]">Alpa</div>
                <div className="mt-1 text-2xl font-extrabold text-[oklch(0.46_0.16_25)]">{totalAtt.absent}</div>
              </div>
            </div>
            <div className="mt-3.5 text-center text-[12px] text-ink-3 font-semibold">
              H: Hadir • I: Izin • T: Terlambat • A: Alpa
            </div>
          </Card>

          {/* Homeroom Note Form component */}
          <Card pad={18}>
            <HomeroomNoteForm
              reportCardId={id}
              initialNote={homeroomNote || ""}
              status={status}
              canEdit={canEdit}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
