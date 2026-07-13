"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Badge, Button, Card, Icons } from "@/components/ui";
import { generateReportCardAction, publishReportCardAction } from "../actions";
import { Semester } from "@/generated/prisma/client";

type ReportCard = { id: string; status: "DRAFT" | "PUBLISHED"; publishedAt: Date | null } | null;
type Student = {
  studentId: string;
  name: string;
  studentNumber: string;
  level: string;
  reportCard: ReportCard;
};

export function ReportBoardTable({
  students,
  semester,
  academicYear,
  canEdit,
}: {
  students: Student[];
  semester: Semester;
  academicYear: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCreate(studentId: string) {
    startTransition(async () => {
      const res = await generateReportCardAction({ studentId, semester, academicYear });
      if (!res.ok) {
        alert(res.message || "Gagal membuat rapor");
      } else {
        router.refresh();
      }
    });
  }

  function handlePublish(reportCardId: string) {
    if (confirm("Apakah Anda yakin ingin menerbitkan rapor ini? Setelah diterbitkan, rapor tidak bisa diubah.")) {
      startTransition(async () => {
        const res = await publishReportCardAction(reportCardId);
        if (!res.ok) {
          alert(res.message || "Gagal menerbitkan rapor");
        } else {
          router.refresh();
        }
      });
    }
  }

  if (students.length === 0) {
    return (
      <Card pad={40}>
        <p className="text-center text-sm text-ink-3">Tidak ada santri di kelas ini.</p>
      </Card>
    );
  }

  return (
    <Card pad={0} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr className="bg-surface-2">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-2 w-12 text-center">No</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-2">Santri</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-2 w-28">Status Rapor</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-2 w-72">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s.studentId} className="border-t border-line hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 text-center text-sm text-ink-3">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={s.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} color="var(--primary)" size={32} />
                    <div>
                      <div className="text-sm font-semibold text-ink-1">{s.name}</div>
                      <div className="mono text-[11px] text-ink-3">{s.studentNumber} • {s.level}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {!s.reportCard ? (
                    <Badge tone="neutral">Belum Dibuat</Badge>
                  ) : s.reportCard.status === "DRAFT" ? (
                    <Badge tone="warning">Draft</Badge>
                  ) : (
                    <Badge tone="success">Terbit</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {!s.reportCard ? (
                      canEdit && (
                        <Button
                          disabled={isPending}
                          size="sm"
                          variant="primary"
                          onClick={() => handleCreate(s.studentId)}
                          icon={<Icons.plus size={14} />}
                        >
                          Buat Rapor
                        </Button>
                      )
                    ) : (
                      <>
                        <Link href={`/rapor/${s.reportCard.id}`}>
                          <Button size="sm" variant="soft" icon={<Icons.doc size={14} />}>
                            {s.reportCard.status === "DRAFT" && canEdit ? "Detail & Catatan" : "Lihat Rapor"}
                          </Button>
                        </Link>

                        {s.reportCard.status === "DRAFT" && canEdit && (
                          <Button
                            disabled={isPending}
                            size="sm"
                            variant="primary"
                            onClick={() => handlePublish(s.reportCard!.id)}
                            icon={<Icons.check2 size={14} />}
                            className="!bg-[oklch(0.58_0.19_142)] hover:!bg-[oklch(0.52_0.19_142)] text-white"
                          >
                            Terbitkan
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
