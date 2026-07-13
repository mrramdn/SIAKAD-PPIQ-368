"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EducationLevel } from "@/generated/prisma/client";
import { requireParent } from "@/lib/auth";
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
  familyCardUrl: z.string().trim().url().optional().or(z.literal("")),
  birthCertificateUrl: z.string().trim().url().optional().or(z.literal("")),
  previousReportUrl: z.string().trim().url().optional().or(z.literal("")),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function submitAdmissionAction(formData: FormData) {
  const parent = await requireParent();
  const parsed = schema.safeParse({
    childName: formData.get("childName"),
    level: formData.get("level"),
    gender: formData.get("gender"),
    birthPlace: formData.get("birthPlace"),
    birthDate: formData.get("birthDate"),
    previousSchool: formData.get("previousSchool"),
    address: formData.get("address"),
    note: formData.get("note"),
    familyCardUrl: formData.get("familyCardUrl"),
    birthCertificateUrl: formData.get("birthCertificateUrl"),
    previousReportUrl: formData.get("previousReportUrl"),
    photoUrl: formData.get("photoUrl"),
  });

  if (!parsed.success) {
    redirect("/pendaftaran?error=invalid");
  }

  const d = parsed.data;
  await prisma.admission.create({
    data: {
      childName: d.childName,
      level: d.level as EducationLevel,
      gender: d.gender || null,
      birthPlace: d.birthPlace || null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
      previousSchool: d.previousSchool || null,
      parentName: parent.name,
      parentPhone: parent.phone ?? "-",
      parentEmail: parent.email.toLowerCase(),
      address: d.address || null,
      note: d.note || null,
      submitterId: parent.id,
      familyCardUrl: d.familyCardUrl || null,
      birthCertificateUrl: d.birthCertificateUrl || null,
      previousReportUrl: d.previousReportUrl || null,
      photoUrl: d.photoUrl || null,
    },
  });

  redirect("/pendaftaran?success=1");
}
