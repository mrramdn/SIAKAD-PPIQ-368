"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { signInWithPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await signInWithPassword(email, password);

  if (!user) {
    redirect("/login?error=invalid");
  }

  redirect(user.role === UserRole.ADMIN ? "/admin" : "/dashboard");
}
