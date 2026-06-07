"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Field, Icons, inputClasses, initialsFromName } from "@/components/ui";
import { updateProfileAction } from "../actions";

type Role = "ADMIN" | "TEACHER" | "STUDENT";
const ROLE_LABEL: Record<Role, string> = { ADMIN: "Admin", TEACHER: "Guru", STUDENT: "Siswa" };

const TABS = [
  ["profil", "Profil"],
  ["notif", "Notifikasi"],
  ["tampilan", "Tampilan"],
] as const;

const NOTIF = [
  ["email", "Notifikasi Email", "Terima ringkasan harian melalui email"],
  ["tugas", "Tugas Baru", "Beri tahu saat ada tugas atau materi baru"],
  ["nilai", "Nilai Keluar", "Beri tahu saat nilai dipublikasikan"],
  ["absen", "Pengingat Absensi", "Ingatkan untuk mencatat kehadiran"],
] as const;

export function ProfileForm({
  profile,
}: {
  profile: { name: string; email: string; role: Role; className: string | null; phone: string | null; isStudent: boolean };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("profil");
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [toggles, setToggles] = useState<Record<string, boolean>>({ email: true, tugas: true, nilai: false, absen: true });
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function save() {
    startTransition(async () => {
      const res = await updateProfileAction({ name, phone });
      setToast(res.ok ? "Perubahan disimpan" : res.message ?? "Gagal menyimpan");
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="view-enter" style={{ maxWidth: 760 }}>
      <h1 className="text-[26px] font-extrabold tracking-tight">Pengaturan</h1>
      <p className="mb-5 mt-1 text-sm text-ink-3">Kelola profil dan preferensi akun.</p>

      <div className="mb-5 flex gap-1.5 border-b border-line">
        {TABS.map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px px-4 py-2.5 text-sm font-semibold ${
              tab === id ? "border-b-2 border-primary text-primary-700" : "text-ink-3"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === "profil" ? (
        <Card pad={24}>
          <div className="mb-6 flex items-center gap-4">
            <Avatar initials={initialsFromName(profile.name)} color={profile.role === "STUDENT" ? "var(--violet)" : "var(--primary)"} size={64} />
            <div>
              <div className="text-lg font-bold">{profile.name}</div>
              <div className="text-[13.5px] text-ink-3">{ROLE_LABEL[profile.role]}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
            </Field>
            <Field label="Peran">
              <input value={ROLE_LABEL[profile.role]} disabled className={`${inputClasses} bg-surface-2 text-ink-3`} />
            </Field>
            <Field label="Email">
              <input value={profile.email} disabled className={`${inputClasses} bg-surface-2 text-ink-3`} />
            </Field>
            {profile.isStudent ? (
              <Field label="No. Telepon">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" className={inputClasses} />
              </Field>
            ) : (
              <div />
            )}
          </div>
          <div className="mt-2 flex justify-end gap-2.5">
            <Button variant="primary" onClick={save} disabled={pending}>
              Simpan Perubahan
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === "notif" ? (
        <Card pad={8}>
          {NOTIF.map(([k, t, d], i) => (
            <div key={k} className={`flex items-center gap-3.5 px-4 py-4 ${i < NOTIF.length - 1 ? "border-b border-line" : ""}`}>
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold">{t}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">{d}</div>
              </div>
              <button
                onClick={() => setToggles((p) => ({ ...p, [k]: !p[k] }))}
                className="relative h-[26px] w-11 shrink-0 rounded-full transition"
                style={{ background: toggles[k] ? "var(--primary)" : "var(--border-strong)" }}
                aria-pressed={toggles[k]}
              >
                <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-soft transition-all" style={{ left: toggles[k] ? 21 : 3 }} />
              </button>
            </div>
          ))}
        </Card>
      ) : null}

      {tab === "tampilan" ? (
        <Card pad={24}>
          <div className="mb-3.5 text-[14.5px] font-semibold">Warna Aksen</div>
          <div className="flex gap-3">
            {["var(--primary)", "var(--violet)", "var(--green)", "var(--amber)", "var(--red)"].map((c, i) => (
              <button
                key={c}
                className="h-[42px] w-[42px] rounded-xl shadow-soft"
                style={{ background: c, border: i === 0 ? "3px solid var(--text)" : "3px solid transparent" }}
              />
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">Pengaturan tampilan bersifat demo pada versi ini.</p>
        </Card>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[13.5px] font-semibold text-white shadow-float">
          <Icons.check2 size={16} style={{ color: "var(--green)" }} />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
