"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui";
import { deleteScheduleSlotAction } from "../actions";

type Slot = {
  id: string;
  startTime: string;
  room: string;
  courseId: string;
  courseTitle: string;
  level: string;
  teacher: string;
};

export function ScheduleList({ slots, canEdit }: { slots: Slot[]; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      startTransition(async () => {
        const res = await deleteScheduleSlotAction(id);
        if (!res.ok) {
          alert(res.message || "Gagal menghapus jadwal");
        } else {
          router.refresh();
        }
      });
    }
  }

  if (slots.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl bg-surface-2 border border-dashed border-line">
        <span className="text-[13px] text-ink-3">Tidak ada jadwal</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:border-line-strong"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-md">
                {slot.startTime}
              </span>
              {slot.room && (
                <span className="text-[11px] font-bold text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded border border-line">
                  {slot.room}
                </span>
              )}
            </div>
            <div className="mt-1.5 truncate text-[14.5px] font-bold text-ink-1">
              {slot.courseTitle}
            </div>
            <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
              {slot.teacher}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => handleDelete(slot.id)}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-3 hover:bg-danger-soft hover:text-danger hover:border-danger-soft transition disabled:opacity-50"
              title="Hapus Jadwal"
            >
              <Icons.trash size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
