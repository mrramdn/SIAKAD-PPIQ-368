import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { getChildDetail, getChildReportCards, formatPeriod } from "@/lib/lms";
import { Badge, Card, Icons, Progress, Ring, SectionTitle, scoreColor, scoreTone } from "@/components/ui";
import { ChildTabs } from "./ChildTabs";

const ATT_META = [
  { key: "PRESENT", label: "Hadir", color: "var(--green)" },
  { key: "LATE", label: "Terlambat", color: "var(--amber)" },
  { key: "EXCUSED", label: "Izin", color: "var(--teal)" },
  { key: "ABSENT", label: "Alpa", color: "var(--red)" },
] as const;

export default async function ChildDetailPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const user = await requireParent();

  const [data, reportCards] = await Promise.all([
    getChildDetail(user.id, childId),
    getChildReportCards(user.id, childId),
  ]);

  if (!data || !reportCards) notFound();

  const { child, overall, courses } = data;

  const detailTab = (
    <div className="flex flex-col gap-4">
      {courses.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Santri belum terdaftar di mata pelajaran apa pun.</p>
        </Card>
      ) : (
        courses.map((c) => (
          <Card key={c.id} pad={20}>
            <SectionTitle
              title={c.title}
              sub={`Pengajar: ${c.teacher}`}
              action={<Badge tone={scoreTone(c.courseAvg)}>Rata {c.courseAvg || "-"}</Badge>}
            />

            {/* grades */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {c.grades.length === 0 ? (
                <p className="text-sm text-ink-3">Belum ada komponen nilai.</p>
              ) : (
                c.grades.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{g.title}</div>
                      <div className="mt-1.5">
                        <Progress value={g.value ?? 0} color={g.value === null ? "var(--text-3)" : scoreColor(g.value)} h={6} />
                      </div>
                    </div>
                    <div className="w-9 text-right text-[15px] font-extrabold tabular-nums" style={{ color: g.value === null ? "var(--text-3)" : scoreColor(g.value) }}>
                      {g.value ?? "–"}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* attendance recap */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
              <span className="text-[12.5px] font-bold uppercase tracking-wide text-ink-3">Kehadiran {c.attRate}%</span>
              {ATT_META.map((m) => (
                <span key={m.key} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                  <span className="tabular-nums text-ink-3">{c.marks[m.key]}</span>
                </span>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const reportCardTab = (
    <div className="flex flex-col gap-4">
      {reportCards.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada rapor semester yang terbit.</p>
        </Card>
      ) : (
        reportCards.map((rc) => {
          // Compute total attendance for this report card
          const totalAtt = rc.entries.reduce(
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
            <Card key={rc.id} pad={20}>
              {/* Rapor Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-line pb-3.5 mb-4 gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-ink-1">
                    {formatPeriod({ semester: rc.semester, academicYear: rc.academicYear })}
                  </h2>
                  {rc.publishedAt && (
                    <p className="mt-0.5 text-xs text-ink-3 font-semibold">
                      Diterbitkan pada {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(rc.publishedAt)}
                    </p>
                  )}
                </div>
                <Badge tone="success">Terbit</Badge>
              </div>

              {/* Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-4" style={{ minWidth: 400 }}>
                  <thead>
                    <tr className="bg-surface-2 border-b border-line">
                      <th className="sticky left-0 z-[2] min-w-[160px] bg-surface-2 px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink-2">Mata Pelajaran</th>
                      <th className="px-3.5 py-2 text-center text-xs font-bold uppercase tracking-wide text-ink-2 w-24">Nilai Akhir</th>
                      <th className="px-3.5 py-2 text-center text-xs font-bold uppercase tracking-wide text-ink-2 w-32">Kehadiran (H/I/T/A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rc.entries.map((e) => (
                      <tr key={e.id} className="border-b border-line last:border-0 hover:bg-surface-2/20 transition-colors">
                        <td className="sticky left-0 z-[1] bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink-1 whitespace-nowrap">{e.courseTitle}</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="text-sm font-extrabold" style={{ color: scoreColor(e.finalScore) }}>
                            {e.finalScore}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-xs font-semibold text-ink-2">
                          <span className="text-success">{e.present}</span>
                          <span className="text-ink-4 mx-0.5">/</span>
                          <span className="text-primary">{e.excused}</span>
                          <span className="text-ink-4 mx-0.5">/</span>
                          <span className="text-amber-600">{e.late}</span>
                          <span className="text-ink-4 mx-0.5">/</span>
                          <span className="text-danger">{e.absent}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Attendance Summary & Note */}
              <div className="grid gap-4.5 md:grid-cols-[1.2fr_1.8fr] border-t border-line pt-4" style={{ gap: 18 }}>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">Rekap Kehadiran</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                    <div className="rounded-lg bg-success-soft p-1.5">
                      <div className="text-[10px] font-bold text-[oklch(0.42_0.13_150)]">H</div>
                      <div className="text-sm font-extrabold text-[oklch(0.42_0.13_150)]">{totalAtt.present}</div>
                    </div>
                    <div className="rounded-lg bg-primary-soft p-1.5">
                      <div className="text-[10px] font-bold text-primary-700">I</div>
                      <div className="text-sm font-extrabold text-primary-700">{totalAtt.excused}</div>
                    </div>
                    <div className="rounded-lg bg-warning-soft p-1.5">
                      <div className="text-[10px] font-bold text-[oklch(0.48_0.12_75)]">T</div>
                      <div className="text-sm font-extrabold text-[oklch(0.48_0.12_75)]">{totalAtt.late}</div>
                    </div>
                    <div className="rounded-lg bg-danger-soft p-1.5">
                      <div className="text-[10px] font-bold text-[oklch(0.46_0.16_25)]">A</div>
                      <div className="text-sm font-extrabold text-[oklch(0.46_0.16_25)]">{totalAtt.absent}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">Catatan Wali Kelas</h3>
                  <div className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink-2 italic min-h-[50px] flex items-center">
                    {rc.homeroomNote ? `"${rc.homeroomNote}"` : "Belum ada catatan wali kelas."}
                  </div>
                </div>
              </div>
            </Card>
          )
        })
      )}
    </div>
  );

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      <Link href="/anak" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink-2">
        <Icons.chevL size={16} /> Kembali ke Anak Saya
      </Link>

      {/* header */}
      <Card pad={22}>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-bold text-primary-700">{child.level}</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-balance">{child.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                <Badge tone="primary">{child.className}</Badge>
                <span className="mono">{child.studentNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-1">
              <Ring value={overall.avg} size={76} stroke={8} color={scoreColor(overall.avg)} label={String(overall.avg || "-")} />
              <span className="text-[12px] font-semibold text-ink-3">Rata Nilai</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Ring value={overall.attRate} size={76} stroke={8} color={scoreColor(overall.attRate)} label={`${overall.attRate}%`} />
              <span className="text-[12px] font-semibold text-ink-3">Kehadiran</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <ChildTabs
        detailTab={detailTab}
        reportCardTab={reportCardTab}
        reportCardsCount={reportCards.length}
      />
    </div>
  );
}
