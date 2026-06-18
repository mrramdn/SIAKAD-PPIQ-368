"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EducationLevel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  childName: z.string().trim().min(2, "Nama santri wajib diisi."),
  level: z.enum(["SD", "SMP", "SMA"]),
  gender: z.string().trim().optional(),
  birthPlace: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  previousSchool: z.string().trim().optional(),
  parentName: z.string().trim().min(2, "Nama orang tua wajib diisi."),
  parentPhone: z.string().trim().min(6, "Nomor HP wajib diisi."),
  parentEmail: z.string().trim().email("Email tidak valid."),
  address: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function submitAdmissionAction(formData: FormData) {
  const parsed = schema.safeParse({
    childName: formData.get("childName"),
    level: formData.get("level"),
    gender: formData.get("gender"),
    birthPlace: formData.get("birthPlace"),
    birthDate: formData.get("birthDate"),
    previousSchool: formData.get("previousSchool"),
    parentName: formData.get("parentName"),
    parentPhone: formData.get("parentPhone"),
    parentEmail: formData.get("parentEmail"),
    address: formData.get("address"),
    note: formData.get("note"),
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
      parentName: d.parentName,
      parentPhone: d.parentPhone,
      parentEmail: d.parentEmail.toLowerCase(),
      address: d.address || null,
      note: d.note || null,
    },
  });

  redirect("/pendaftaran?success=1");
}
