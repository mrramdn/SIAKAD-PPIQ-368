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
    return <p className="py-3 text-[13px] text-ink-3">Tidak ada jadwal.</p>;
  }

  return (
    <div className="divide-y divide-line">
      {slots.map((slot) => (
        <div key={slot.id} className="flex items-center gap-3 py-2.5">
          <span className="mono w-12 shrink-0 text-[13px] font-bold text-primary">{slot.startTime}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink-1">{slot.courseTitle}</div>
            <div className="truncate text-[12px] text-ink-3">
              {slot.teacher}
              {slot.room !== "-" ? ` • ${slot.room}` : ""}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => handleDelete(slot.id)}
              disabled={isPending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger transition disabled:opacity-50"
              title="Hapus Jadwal"
            >
              <Icons.trash size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
