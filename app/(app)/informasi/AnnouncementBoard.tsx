"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Icons, inputClasses, type Tone } from "@/components/ui";
import { LEVELS } from "@/lib/brand";
import { createAnnouncementAction, deleteAnnouncementAction } from "../actions";

type Level = "SD" | "SMP" | "SMA";
type Item = {
  id: string;
  title: string;
  body: string;
  level: Level | null;
  pinned: boolean;
  author: string;
  createdAt: string;
};

const LEVEL_TONE: Record<Level, Tone> = { SD: "accent", SMP: "primary", SMA: "success" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fade-enter fixed inset-0 z-[100] grid place-items-center bg-[oklch(0.27_0.02_165_/_0.45)] p-5 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="pop-enter flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-surface shadow-float" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2">
            <Icons.x size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function AnnouncementBoard({ items, canManage }: { items: Item[]; canManage: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id);
      setToast(res.ok ? "Informasi dihapus" : res.message ?? "Gagal menghapus");
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="view-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-balance">Informasi</h1>
          <p className="mt-1 text-sm text-ink-3 text-pretty">
            {canManage ? "Kirim pengumuman dan informasi ke wali santri." : "Pengumuman dan informasi terbaru dari pesantren."}
          </p>
        </div>
        {canManage ? (
          <Button variant="primary" icon={<Icons.plus size={17} />} onClick={() => setCreating(true)}>
            Buat Informasi
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <Card pad={40}>
            <p className="text-center text-sm text-ink-3">Belum ada informasi.</p>
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} pad={20} className={a.pinned ? "border-primary/40" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned ? (
                    <Badge tone="warning">
                      <Icons.bell size={12} /> Penting
                    </Badge>
                  ) : null}
                  <Badge tone={a.level ? LEVEL_TONE[a.level] : "neutral"}>{a.level ?? "Semua Jenjang"}</Badge>
                </div>
                {canManage ? (
                  <button
                    title="Hapus"
                    disabled={pending}
                    onClick={() => remove(a.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger"
                  >
                    <Icons.trash size={16} />
                  </button>
                ) : null}
              </div>
              <h2 className="mt-3 text-[17px] font-bold tracking-tight text-balance">{a.title}</h2>
              <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink-2 text-pretty">{a.body}</p>
              <div className="mt-3.5 flex items-center gap-2 text-[12px] text-ink-3">
                <Icons.users size={13} />
                <span className="font-semibold text-ink-2">{a.author}</span>
                <span>·</span>
                <span>{a.createdAt}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {creating ? (
        <Modal title="Buat Informasi" onClose={() => setCreating(false)}>
          <form action={createAnnouncementAction}>
            <Field label="Judul">
              <input name="title" required autoFocus placeholder="cth. Jadwal Ujian Akhir Semester" className={inputClasses} />
            </Field>
            <Field label="Isi informasi">
              <textarea name="body" required rows={5} placeholder="Tulis isi pengumuman…" className={inputClasses} />
            </Field>
            <Field label="Jenjang tujuan">
              <select name="level" defaultValue="" className={inputClasses}>
                <option value="">Semua jenjang</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <label className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-ink-2">
              <input type="checkbox" name="pinned" className="h-4 w-4 rounded border-line-strong accent-[var(--primary)]" />
              Tandai sebagai penting
            </label>
            <div className="mt-2 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Kirim Informasi
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[13.5px] font-semibold text-white shadow-float">
          <span className="h-2 w-2 rounded-full bg-[var(--green)]" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
