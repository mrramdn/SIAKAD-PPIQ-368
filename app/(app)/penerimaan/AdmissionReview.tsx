"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Icons, type Tone } from "@/components/ui";
import { reviewAdmissionAction } from "../actions";

type Status = "PENDING" | "ACCEPTED" | "REJECTED";
type Level = "SD" | "SMP" | "SMA";

type AdmissionDocument = {
  kind: string;
  label: string;
  required: boolean;
  // "upload" = berkas tersimpan di sistem, "link" = tautan luar, null = kosong.
  source: "upload" | "link" | null;
  href: string | null;
  filename: string | null;
  typeLabel: string | null;
  sizeLabel: string | null;
  isImage: boolean;
  linkLabel: string | null;
};

type Admission = {
  id: string;
  childName: string;
  level: Level;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  previousSchool: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string | null;
  note: string | null;
  status: Status;
  createdAt: string;
  documents: AdmissionDocument[];
};

const STATUS_LABEL: Record<Status, string> = { PENDING: "Menunggu", ACCEPTED: "Diterima", REJECTED: "Ditolak" };
const STATUS_TONE: Record<Status, Tone> = { PENDING: "warning", ACCEPTED: "success", REJECTED: "danger" };
const STATUS_COLOR: Record<Status, string> = { PENDING: "var(--amber)", ACCEPTED: "var(--green)", REJECTED: "var(--red)" };
const LEVEL_TONE: Record<Level, Tone> = { SD: "accent", SMP: "primary", SMA: "success" };
const TABS: (Status | "ALL")[] = ["PENDING", "ACCEPTED", "REJECTED", "ALL"];
const TAB_LABEL: Record<Status | "ALL", string> = { PENDING: "Menunggu", ACCEPTED: "Diterima", REJECTED: "Ditolak", ALL: "Semua" };

function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-medium text-ink-2">{value}</div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: AdmissionDocument }) {
  if (!doc.href || !doc.source) {
    return (
      <div className="flex min-h-[68px] items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 py-2.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-3">
          <Icons.x size={16} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-ink-2">{doc.label}</div>
          <div className={`mt-0.5 text-[11.5px] font-semibold ${doc.required ? "text-danger" : "text-ink-3"}`}>
            {doc.required ? "Belum diunggah (wajib)" : "Belum diunggah (opsional)"}
          </div>
        </div>
      </div>
    );
  }

  const isLink = doc.source === "link";
  const meta = isLink
    ? `Tautan · ${doc.linkLabel ?? "tautan eksternal"}`
    : [doc.filename, doc.typeLabel, doc.sizeLabel].filter(Boolean).join(" · ");

  return (
    <a
      href={doc.href}
      target="_blank"
      // Berlaku untuk kedua jenis; tautan luar tidak boleh mendapat akses
      // window.opener maupun membocorkan referrer halaman tinjauan.
      rel="noopener noreferrer"
      className="flex min-h-[68px] items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-2"
    >
      {doc.isImage && !isLink ? (
        <Image
          src={doc.href}
          alt={doc.label}
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
        />
      ) : (
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${isLink ? "bg-accent-soft text-[oklch(0.42_0.1_200)]" : "bg-primary-soft text-primary-700"}`}
        >
          {isLink ? <Icons.chevR size={16} /> : <Icons.doc size={16} />}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-ink-2">{doc.label}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-ink-3">{meta}</div>
      </div>
    </a>
  );
}

export function AdmissionReview({ admissions }: { admissions: Admission[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Status | "ALL">("PENDING");
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "warn" } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(
    () => ({
      ALL: admissions.length,
      PENDING: admissions.filter((a) => a.status === "PENDING").length,
      ACCEPTED: admissions.filter((a) => a.status === "ACCEPTED").length,
      REJECTED: admissions.filter((a) => a.status === "REJECTED").length,
    }),
    [admissions],
  );

  const list = admissions.filter((a) => tab === "ALL" || a.status === tab);

  function review(id: string, decision: "ACCEPTED" | "REJECTED", name: string) {
    startTransition(async () => {
      const res = await reviewAdmissionAction({ admissionId: id, decision });
      if (res.ok) {
        setToast({ msg: decision === "ACCEPTED" ? `${name} diterima, akun wali ditautkan` : `${name} ditolak`, tone: decision === "ACCEPTED" ? "ok" : "warn" });
        setOpen(null);
        router.refresh();
      } else {
        setToast({ msg: res.message ?? "Gagal memproses.", tone: "warn" });
      }
    });
  }

  return (
    <div className="view-enter">
      <div className="mb-5">
        <h1 className="text-[26px] font-extrabold tracking-tight text-balance">Pendaftaran Santri</h1>
        <p className="mt-1 text-sm text-ink-3 text-pretty">
          Tinjau pendaftaran santri baru. Menerima pendaftaran otomatis membuat atau menautkan akun wali dan data santri.
        </p>
      </div>

      <Card pad={0} className="mb-4 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-line">
          {(["PENDING", "ACCEPTED", "REJECTED"] as Status[]).map((status) => (
            <div key={status} className="p-4 text-center sm:p-5">
              <div className="text-2xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: STATUS_COLOR[status] }}>
                {counts[status]}
              </div>
              <div className="mt-1.5 text-[12px] font-semibold text-ink-3 sm:text-[12.5px]">{STATUS_LABEL[status]}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-3.5 flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${tab === t ? "bg-primary text-white" : "text-ink-2"}`}
          >
            {TAB_LABEL[t]}
            <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${tab === t ? "bg-white/25" : "bg-surface-2"}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {list.length === 0 ? (
          <Card pad={40}>
            <p className="text-center text-sm text-ink-3">Tidak ada pendaftaran pada kategori ini.</p>
          </Card>
        ) : (
          list.map((a) => {
            const expanded = open === a.id;
            return (
              <Card key={a.id} pad={0} className="overflow-hidden">
                <button onClick={() => setOpen(expanded ? null : a.id)} className="flex w-full items-center gap-3.5 p-4 text-left transition hover:bg-surface-2">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary-700">{a.level}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{a.childName}</div>
                    <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                      Wali: {a.parentName} · {a.parentPhone}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <Badge tone={LEVEL_TONE[a.level]}>{a.level}</Badge>
                    <div className="mt-1 text-[11.5px] text-ink-3">{a.createdAt}</div>
                  </div>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  <Icons.chevD size={18} style={{ color: "var(--text-3)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>

                {expanded ? (
                  <div className="border-t border-line p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Detail label="Jenjang" value={a.level} />
                      <Detail label="Jenis Kelamin" value={a.gender === "L" ? "Laki-laki" : a.gender === "P" ? "Perempuan" : null} />
                      <Detail label="Tempat, Tgl Lahir" value={[a.birthPlace, a.birthDate].filter(Boolean).join(", ") || null} />
                      <Detail label="Asal Sekolah" value={a.previousSchool} />
                      <Detail label="Email Wali" value={a.parentEmail} />
                      <Detail label="Telepon" value={a.parentPhone} />
                      <Detail label="Alamat" value={a.address} />
                      <Detail label="Catatan" value={a.note} />
                    </div>
                    <div className="mt-5 border-t border-line pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Dokumen Pendukung</span>
                        {a.documents.some((doc) => doc.required && !doc.href) ? (
                          <Badge tone="danger">Berkas wajib belum lengkap</Badge>
                        ) : null}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {a.documents.map((doc) => (
                          <DocumentCard key={doc.kind} doc={doc} />
                        ))}
                      </div>
                    </div>
                    {a.status === "PENDING" ? (
                      <div className="mt-5 flex justify-end gap-2.5">
                        <Button variant="danger" disabled={pending} onClick={() => review(a.id, "REJECTED", a.childName)}>
                          Tolak
                        </Button>
                        <Button variant="primary" disabled={pending} icon={<Icons.check2 size={16} />} onClick={() => review(a.id, "ACCEPTED", a.childName)}>
                          Terima Santri
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[13.5px] font-semibold text-white shadow-float">
          <span className="h-2 w-2 rounded-full" style={{ background: toast.tone === "ok" ? "var(--green)" : "var(--amber)" }} />
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
