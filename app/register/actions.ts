"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { UserRole, UserStatus } from "@/generated/prisma/client";
import { createUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function registerStudentAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const studentNumber = String(formData.get("studentNumber") ?? "").trim();
  const className = String(formData.get("className") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !email || !password || !studentNumber || !className) {
    redirect("/register?error=missing");
  }

  if (password.length < 8) {
    redirect("/register?error=password");
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existingUser) {
    redirect("/register?error=email");
  }

  const existingStudent = await prisma.studentProfile.findUnique({ where: { studentNumber }, select: { id: true } });

  if (existingStudent) {
    redirect("/register?error=studentNumber");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING,
      profile: {
        create: {
          studentNumber,
          className,
          phone: phone || null,
          address: address || null,
        },
      },
    },
    select: { id: true },
  });

  await createUserSession(user.id);
  redirect("/pending");
}
