"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EducationLevel } from "@/generated/prisma/client";
import {
  ADMISSION_DOCUMENT_FIELD,
  ADMISSION_DOCUMENT_KINDS,
  ADMISSION_DOCUMENT_URL_COLUMN,
  ADMISSION_DOCUMENT_URL_FIELD,
  checkAdmissionDocumentSubmission,
  type AdmissionDocumentIssue,
  type AdmissionDocumentUpload,
} from "@/lib/admissions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  childName: z.string().trim().min(2, "Nama santri wajib diisi."),
  level: z.enum(["SD", "SMP", "SMA"]),
  gender: z.string().trim().optional(),
  birthPlace: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  previousSchool: z.string().trim().optional(),
  address: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

type AdmissionUrlColumn = (typeof ADMISSION_DOCUMENT_URL_COLUMN)[keyof typeof ADMISSION_DOCUMENT_URL_COLUMN];

function rejectDocument(issue: AdmissionDocumentIssue): never {
  redirect(`/pendaftaran?error=${issue.reason}&doc=${issue.kind}`);
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const EARLIEST_BIRTH_YEAR = 1900;

type BirthDateResult = { ok: true; value: Date | null } | { ok: false; reason: "birthDate" | "birthDateFuture" };

/**
 * Prisma menolak `Invalid Date` dengan galat mentah, jadi tanggal lahir divalidasi
 * sendiri: hanya format YYYY-MM-DD (sesuai <input type="date">), tanggal yang benar
 * ada, tidak di masa depan, dan tidak mustahil tuanya.
 */
function parseBirthDate(raw: string | undefined, now = new Date()): BirthDateResult {
  const value = (raw ?? "").trim();
  if (!value) return { ok: true, value: null };

  const match = DATE_ONLY_RE.exec(value);
  if (!match) return { ok: false, reason: "birthDate" };

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDate || year < EARLIEST_BIRTH_YEAR) return { ok: false, reason: "birthDate" };
  if (date.getTime() > now.getTime()) return { ok: false, reason: "birthDateFuture" };

  return { ok: true, value: date };
}

export async function submitAdmissionAction(formData: FormData) {
  const parent = await requirePermission("admission.submit");
  const parsed = schema.safeParse({
    childName: formData.get("childName"),
    level: formData.get("level"),
    gender: formData.get("gender"),
    birthPlace: formData.get("birthPlace"),
    birthDate: formData.get("birthDate"),
    previousSchool: formData.get("previousSchool"),
    address: formData.get("address"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/pendaftaran?error=invalid");
  }

  // Diperiksa sebelum berkas dibaca: percuma memuat unggahan berukuran besar
  // kalau data teksnya sudah pasti ditolak.
  const birthDate = parseBirthDate(parsed.data.birthDate);
  if (!birthDate.ok) {
    redirect(`/pendaftaran?error=${birthDate.reason}`);
  }

  // Setiap dokumen boleh dilengkapi dengan unggahan berkas atau tautan, dan
  // semuanya diperiksa lebih dulu: pendaftaran tidak boleh tersimpan separuh
  // jalan kalau salah satu dokumen ditolak.
  const documents: AdmissionDocumentUpload[] = [];
  const documentUrls: Partial<Record<AdmissionUrlColumn, string>> = {};

  for (const kind of ADMISSION_DOCUMENT_KINDS) {
    const value = formData.get(ADMISSION_DOCUMENT_FIELD[kind]);
    const file = value instanceof File && value.size > 0 ? value : null;
    const url = formData.get(ADMISSION_DOCUMENT_URL_FIELD[kind]);

    const result = checkAdmissionDocumentSubmission({
      kind,
      upload: file
        ? {
            filename: file.name,
            declaredMimeType: file.type,
            bytes: new Uint8Array(await file.arrayBuffer()),
          }
        : null,
      url: typeof url === "string" ? url : null,
    });

    if (!result.ok) {
      rejectDocument(result.issue);
    }

    if (result.submission.mode === "upload") {
      documents.push(result.submission.document);
    } else if (result.submission.mode === "url") {
      documentUrls[ADMISSION_DOCUMENT_URL_COLUMN[kind]] = result.submission.url;
    }
  }

  const d = parsed.data;
  await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.create({
      data: {
        childName: d.childName,
        level: d.level as EducationLevel,
        gender: d.gender || null,
        birthPlace: d.birthPlace || null,
        birthDate: birthDate.value,
        previousSchool: d.previousSchool || null,
        parentName: parent.name,
        parentPhone: parent.phone ?? "-",
        parentEmail: parent.email.toLowerCase(),
        address: d.address || null,
        note: d.note || null,
        submitterId: parent.id,
        // Dokumen yang dilengkapi lewat tautan disimpan pada kolom URL-nya
        // masing-masing; yang diunggah menjadi baris AdmissionDocument.
        ...documentUrls,
      },
      select: { id: true },
    });

    if (documents.length > 0) {
      await tx.admissionDocument.createMany({
        data: documents.map((doc) => ({
          admissionId: admission.id,
          kind: doc.kind,
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.size,
          data: doc.data,
        })),
      });
    }
  });

  redirect("/pendaftaran?success=1");
}
