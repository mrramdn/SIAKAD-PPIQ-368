import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { getChildDetail } from "@/lib/lms";
import { Badge, Card, Icons, Progress, Ring, SectionTitle, scoreColor, scoreTone } from "@/components/ui";

const ATT_META = [
  { key: "PRESENT", label: "Hadir", color: "var(--green)" },
  { key: "LATE", label: "Terlambat", color: "var(--amber)" },
  { key: "EXCUSED", label: "Izin", color: "var(--violet)" },
  { key: "ABSENT", label: "Alpa", color: "var(--red)" },
] as const;

export default async function ChildDetailPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const user = await requireParent();
  const data = await getChildDetail(user.id, childId);

  if (!data) notFound();

  const { child, overall, courses } = data;

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
}
