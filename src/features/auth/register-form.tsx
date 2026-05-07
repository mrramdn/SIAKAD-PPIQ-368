"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ApiError = {
  message?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRouting, startTransition] = useTransition();
  const isPending = isSubmitting || isRouting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setIsSubmitting(false);
      setError(payload.message || "Registrasi gagal. Periksa nama, email, dan password Anda.");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setIsSubmitting(false);
      setError("Akun dibuat, tetapi login otomatis gagal. Silakan masuk dari halaman login.");
      return;
    }

    const session = await getSession();
    const destination = session?.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Daftar</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">Mulai peta minat pribadi</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Buat akun untuk menyimpan profil, hasil assessment, dan rekomendasi.</p>
      </div>

      <FormField label="Nama lengkap" name="name" autoComplete="name" required placeholder="Nama santri atau siswa" />
      <FormField label="Email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        helper="Gunakan minimal 8 karakter."
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium leading-6 text-danger">
          {error}
        </p>
      ) : null}

      <SubmitButton isPending={isPending} pendingText="Membuat akun...">
        Buat akun
      </SubmitButton>
    </form>
  );
}
