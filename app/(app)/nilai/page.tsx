import Link from "next/link";
import { requireAcademicViewer } from "@/lib/auth";
import { getGradebook } from "@/lib/lms";
import { Avatar, Badge, Card, Field, buttonClasses, inputClasses, scoreColor, PASS_THRESHOLD } from "@/components/ui";
import { createGradeItemAction } from "../actions";
import { Gradebook } from "./Gradebook";

export default async function NilaiPage({ searchParams }: { searchParams: Promise<{ course?: string; error?: string }> }) {
  const [{ course, error }, user] = await Promise.all([searchParams, requireAcademicViewer()]);
  const { courses, activeCourseId, columns, rows, canEdit } = await getGradebook(user, course);

  const classAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : 0;
  const passing = rows.filter((r) => r.avg >= PASS_THRESHOLD).length;
  const top = rows.length ? [...rows].sort((a, b) => b.avg - a.avg)[0] : null;

  return (
    <div className="view-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Nilai</h1>
          <p className="mt-1 text-sm text-ink-3">
            {canEdit ? "Klik sel untuk mengubah nilai. Rata-rata dihitung otomatis." : "Pantau rekap nilai santri sebagai bahan pengawasan akademik."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-line bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error === "forbidden" ? "Anda tidak ditugaskan pada mata pelajaran ini." : "Komponen nilai gagal dibuat. Periksa kembali isian Anda."}
        </div>
      ) : null}

      {courses.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada kelas.</p>
        </Card>
      ) : (
        <>
          {/* summary */}
          <Card pad={18} className="mb-5">
            <div className="grid grid-cols-2 gap-y-4 lg:grid-cols-4" style={{ gap: "16px 20px" }}>
              <div>
                <div className="text-[13px] font-semibold text-ink-3">Rata-rata Kelas</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: scoreColor(classAvg) }}>
                    {classAvg}
                  </span>
                  <Badge tone={classAvg >= PASS_THRESHOLD ? "success" : "warning"}>{classAvg >= PASS_THRESHOLD ? "Tuntas" : "Perlu perhatian"}</Badge>
                </div>
              </div>
              <div className="border-l border-line pl-4 lg:pl-5">
                <div className="text-[13px] font-semibold text-ink-3">Tuntas (≥{PASS_THRESHOLD})</div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight">
                  {passing}
                  <span className="text-[17px] text-ink-3">/{rows.length}</span>
                </div>
              </div>
              <div className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <div className="text-[13px] font-semibold text-ink-3">Nilai Tertinggi</div>
                {top ? (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <Avatar initials={top.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} color="var(--green)" size={32} />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-bold">{top.name.split(" ")[0]}</div>
                      <div className="text-[12px] font-bold text-success">{top.avg}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-ink-3">-</div>
                )}
              </div>
              <div className="min-w-0 border-l border-t border-line pl-4 pt-4 lg:pl-5 lg:pt-0 lg:border-t-0">
                <div className="text-[13px] font-semibold text-ink-3">Komponen</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {columns.length ? columns.map((c) => <Badge key={c.id} tone="neutral">{c.title}</Badge>) : <span className="text-sm text-ink-3">-</span>}
                </div>
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
                  href={`/nilai?course=${c.id}`}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    active ? "border-transparent bg-primary text-white" : "border-line bg-surface text-ink-2"
                  }`}
                >
                  {c.title}
                </Link>
              );
            })}
          </div>

          {/* add component */}
          {canEdit && activeCourseId ? (
            <Card pad={16} className="mb-3.5">
              <form action={createGradeItemAction} className="grid gap-3 md:grid-cols-[1fr_0.5fr_0.7fr_auto]">
                <input type="hidden" name="courseId" value={activeCourseId} />
                <Field label="Komponen baru">
                  <input name="title" required placeholder="cth. UH 1" className={inputClasses} />
                </Field>
                <Field label="Nilai maks">
                  <input name="maxScore" type="number" min={1} defaultValue={100} className={inputClasses} />
                </Field>
                <Field label="Tenggat (opsional)">
                  <input name="dueAt" type="date" className={inputClasses} />
                </Field>
                <div className="flex items-end">
                  <button type="submit" className={buttonClasses("primary", "md")}>
                    Tambah
                  </button>
                </div>
              </form>
            </Card>
          ) : null}

          <Gradebook columns={columns} rows={rows} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
