"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
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
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setIsSubmitting(false);
      setError("Email atau password tidak cocok. Periksa kembali data login Anda.");
      return;
    }

    const session = await getSession();
    const destination = callbackUrl || (session?.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Masuk</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">Lanjutkan bimbingan karir</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Gunakan email dan password yang sudah terdaftar.</p>
      </div>

      <FormField label="Email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required />

      {error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium leading-6 text-danger">
          {error}
        </p>
      ) : null}

      <SubmitButton isPending={isPending} pendingText="Memeriksa akun...">
        Masuk ke aplikasi
      </SubmitButton>
    </form>
  );
}
