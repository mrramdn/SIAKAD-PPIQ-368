import Link from "next/link";
import { redirect } from "next/navigation";
import { Semester } from "@/generated/prisma/client";
import { requireAnyPermission, requirePermission, userCan } from "@/lib/auth";
import {
  getAdministrationBoard,
  getAssessmentGroupBoard,
  getClassBoard,
  getCourseBoard,
  getEnrollmentBoard,
  getGradeWeightBoard,
} from "@/lib/akademik";
import { getCurrentPeriod } from "@/lib/lms";
import type { Permission } from "@/lib/permissions";
import { getReportSignatories } from "@/lib/rapor";
import { AdministrasiManager } from "./AdministrasiManager";
import { BobotManager } from "./BobotManager";
import { KelasManager } from "./KelasManager";
import { KelompokManager } from "./KelompokManager";
import { MapelManager } from "./MapelManager";
import { PenandaTanganManager } from "./PenandaTanganManager";
import { PesertaManager } from "./PesertaManager";

type TabKey = "kelas" | "mapel" | "peserta" | "kelompok" | "bobot" | "penandatangan" | "administrasi";

const TABS: { key: TabKey; label: string; permission: Permission }[] = [
  { key: "kelas", label: "Kelas", permission: "class.manage" },
  { key: "mapel", label: "Mapel & Pengampu", permission: "course.manage" },
  { key: "peserta", label: "Peserta Mapel", permission: "course.manage" },
  { key: "kelompok", label: "Kelompok Penilaian", permission: "assessment.configure" },
  { key: "bobot", label: "Bobot Komponen Nilai", permission: "assessment.configure" },
  { key: "penandatangan", label: "Penanda Tangan Rapor", permission: "assessment.configure" },
  { key: "administrasi", label: "Administrasi Santri", permission: "administration.manage" },
];

const ACADEMIC_YEAR_RE = /^\d{4}\/\d{4}$/;

async function KelasSection() {
  await requirePermission("class.manage");
  const board = await getClassBoard();
  return <KelasManager {...board} />;
}

async function MapelSection() {
  const user = await requirePermission("course.manage");
  const board = await getCourseBoard();
  return (
    <MapelManager
      {...board}
      canConfigureAssessment={userCan(user, "assessment.configure")}
      canManageClass={userCan(user, "class.manage")}
    />
  );
}

async function PesertaSection() {
  await requirePermission("course.manage");
  const board = await getEnrollmentBoard();
  return <PesertaManager {...board} />;
}

async function KelompokSection() {
  await requirePermission("assessment.configure");
  const groups = await getAssessmentGroupBoard();
  return <KelompokManager groups={groups} />;
}

async function BobotSection({ semester, academicYear }: { semester?: string; academicYear?: string }) {
  await requirePermission("assessment.configure");
  const current = getCurrentPeriod();
  const period = {
    semester: semester === Semester.GANJIL || semester === Semester.GENAP ? semester : current.semester,
    academicYear: academicYear && ACADEMIC_YEAR_RE.test(academicYear) ? academicYear : current.academicYear,
  };
  const board = await getGradeWeightBoard(period.semester, period.academicYear);
  return <BobotManager courses={board.courses} period={board.period} periods={board.periods} />;
}

async function PenandaTanganSection() {
  await requirePermission("assessment.configure");
  const signatories = await getReportSignatories();
  return <PenandaTanganManager initial={signatories} />;
}

async function AdministrasiSection() {
  await requirePermission("administration.manage");
  const board = await getAdministrationBoard();
  return <AdministrasiManager {...board} />;
}

export default async function AkademikPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; semester?: string; tahun?: string }>;
}) {
  const [{ tab, semester, tahun }, user] = await Promise.all([
    searchParams,
    requireAnyPermission(["class.manage", "course.manage", "assessment.configure", "administration.manage"]),
  ]);

  const availableTabs = TABS.filter((t) => userCan(user, t.permission));
  if (availableTabs.length === 0) {
    redirect("/dashboard");
  }

  const activeTab = availableTabs.find((t) => t.key === tab)?.key ?? availableTabs[0].key;

  return (
    <div className="view-enter">
      <div className="mb-5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Setup Akademik</h1>
        <p className="mt-1 text-sm text-ink-3">
          Kelola kelas, mata pelajaran, peserta mapel, kelompok penilaian, bobot nilai, penanda tangan rapor, dan
          administrasi santri dalam satu tempat.
        </p>
      </div>

      <div className="mb-5 flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {availableTabs.map((t) => (
          <Link
            key={t.key}
            href={`/akademik?tab=${t.key}`}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
              activeTab === t.key ? "bg-primary text-white" : "text-ink-2"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "kelas" ? <KelasSection /> : null}
      {activeTab === "mapel" ? <MapelSection /> : null}
      {activeTab === "peserta" ? <PesertaSection /> : null}
      {activeTab === "kelompok" ? <KelompokSection /> : null}
      {activeTab === "bobot" ? <BobotSection semester={semester} academicYear={tahun} /> : null}
      {activeTab === "penandatangan" ? <PenandaTanganSection /> : null}
      {activeTab === "administrasi" ? <AdministrasiSection /> : null}
    </div>
  );
}
