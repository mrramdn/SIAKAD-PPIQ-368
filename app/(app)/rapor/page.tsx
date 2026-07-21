import Link from "next/link";
import { requireReportViewer } from "@/lib/auth";
import { getReportBoard, getCurrentPeriod, formatPeriod } from "@/lib/lms";
import { Card, Field, inputClasses } from "@/components/ui";
import { ReportBoardTable } from "./ReportBoardTable";
import { Semester, UserRole } from "@/generated/prisma/client";

export default async function RaporPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; semester?: string; year?: string }>;
}) {
  const [{ class: className, semester, year }, user] = await Promise.all([
    searchParams,
    requireReportViewer(),
  ]);

  const canEdit = user.role === UserRole.HOMEROOM;

  const currentPeriod = getCurrentPeriod();
  const activeSemester = Object.values(Semester).includes(semester as Semester)
    ? (semester as Semester)
    : currentPeriod.semester;
  const activeYear = year && /^\d{4}\/\d{4}$/.test(year) ? year : currentPeriod.academicYear;
  const period = { semester: activeSemester, academicYear: activeYear };

  const { classes, activeClass, students } = await getReportBoard(period, className || undefined);

  // Generate a list of academic years for the dropdown filter (e.g. last year, current year, next year)
  const currentYearNum = new Date().getFullYear();
  const academicYears = [
    `${currentYearNum - 1}/${currentYearNum}`,
    `${currentYearNum}/${currentYearNum + 1}`,
    `${currentYearNum + 1}/${currentYearNum + 2}`,
  ];

  return (
    <div className="view-enter flex flex-col" style={{ gap: 20 }}>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Rapor Santri</h1>
          <p className="mt-1 text-sm text-ink-3">
            {canEdit
              ? "Kelola nilai akhir, absensi, catatan wali kelas, dan penerbitan rapor."
              : "Pantau berkas rapor santri yang terbit per periode."}
          </p>
        </div>
      </div>

      {/* Filter Period form */}
      <Card pad={16} className="bg-surface-2">
        <form method="GET" action="/rapor" className="grid gap-3.5 sm:grid-cols-3 items-end">
          {activeClass && <input type="hidden" name="class" value={activeClass} />}
          
          <Field label="Semester">
            <select name="semester" defaultValue={activeSemester} className={inputClasses}>
              <option value={Semester.GANJIL}>Ganjil</option>
              <option value={Semester.GENAP}>Genap</option>
            </select>
          </Field>

          <Field label="Tahun Ajaran">
            <select name="year" defaultValue={activeYear} className={inputClasses}>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </Field>

          <div className="mb-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </Card>

      {classes.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Belum ada kelas atau santri terdaftar.</p>
        </Card>
      ) : (
        <>
          {/* Class tabs selection */}
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-line">
            {classes.map((cls) => {
              const active = cls === activeClass;
              return (
                <Link
                  key={cls}
                  href={`/rapor?class=${cls}&semester=${activeSemester}&year=${activeYear}`}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    active ? "border-transparent bg-primary text-white" : "border-line bg-surface text-ink-2"
                  }`}
                >
                  Kelas {cls}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink-2">
              Periode Aktif: <span className="text-primary">{formatPeriod(period)}</span>
            </span>
            <span className="text-xs text-ink-3 font-semibold">
              Total: {students.length} Santri
            </span>
          </div>

          <ReportBoardTable
            students={students}
            semester={activeSemester}
            academicYear={activeYear}
            canEdit={canEdit}
          />
        </>
      )}
    </div>
  );
}
