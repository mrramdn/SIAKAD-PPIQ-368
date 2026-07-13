"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Icons } from "@/components/ui";
import { saveHomeroomNoteAction, publishReportCardAction } from "../../actions";

export function HomeroomNoteForm({
  reportCardId,
  initialNote,
  status,
  canEdit,
}: {
  reportCardId: string;
  initialNote: string;
  status: "DRAFT" | "PUBLISHED";
  canEdit: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();

  const isDraft = status === "DRAFT";

  function handleSave() {
    startTransition(async () => {
      const res = await saveHomeroomNoteAction({ reportCardId, note });
      if (!res.ok) {
        alert(res.message || "Gagal menyimpan catatan");
      } else {
        alert("Catatan wali kelas berhasil disimpan!");
        router.refresh();
      }
    });
  }

  function handlePublish() {
    if (confirm("Apakah Anda yakin ingin menerbitkan rapor ini? Setelah diterbitkan, nilai dan catatan tidak dapat diubah kembali.")) {
      startTransition(async () => {
        const res = await publishReportCardAction(reportCardId);
        if (!res.ok) {
          alert(res.message || "Gagal menerbitkan rapor");
        } else {
          alert("Rapor berhasil diterbitkan!");
          router.refresh();
        }
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-2">Catatan Wali Kelas</label>
        {isDraft && canEdit ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            rows={4}
            className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-sm text-ink outline-none transition focus:border-primary disabled:opacity-50"
            placeholder="Masukkan catatan perkembangan belajar santri..."
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-ink-2 italic">
            {note ? `"${note}"` : "Belum ada catatan wali kelas."}
          </div>
        )}
      </div>

      {isDraft && canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button
            type="button"
            variant="soft"
            disabled={isPending}
            onClick={handleSave}
            icon={<Icons.check2 size={16} />}
          >
            Simpan Catatan
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={isPending}
            onClick={handlePublish}
            icon={<Icons.award size={16} />}
            className="!bg-[oklch(0.58_0.19_142)] hover:!bg-[oklch(0.52_0.19_142)] text-white"
          >
            Terbitkan Rapor
          </Button>
        </div>
      )}
    </div>
  );
}
