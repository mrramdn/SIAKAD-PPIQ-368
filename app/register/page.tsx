import Link from "next/link";
import { redirect } from "next/navigation";
import { Icons, inputClasses } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { registerParentAction } from "./actions";

type RegisterPageProps = { searchParams: Promise<{ error?: string }> };

const errorMessages: Record<string, string> = {
  invalid: "Lengkapi nama, email, nomor HP, dan password minimal 6 karakter.",
  email: "Email sudah terdaftar. Silakan login untuk mendaftarkan anak.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect("/dashboard");

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12 text-ink">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-float lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-8 text-white sm:p-10" style={{ background: "var(--primary-700)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Icons.cap size={20} style={{ color: "#fff" }} />
            </span>
            <span className="text-lg font-extrabold">{APP_NAME}</span>
          </Link>
          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Akun Wali Santri</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-balance">
              Buat akun wali sebelum mendaftarkan anak.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed opacity-90 text-pretty">
              Satu akun wali dapat dipakai untuk beberapa anak. Setelah akun dibuat, lanjutkan ke formulir pendaftaran santri.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Daftar Akun Wali</h2>
          <p className="mt-2 text-sm text-ink-3">Gunakan email aktif untuk login dan memantau proses pendaftaran.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
          ) : null}

          <form action={registerParentAction} className="mt-8 grid gap-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nama wali *</span>
              <input name="name" required autoComplete="name" className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Email *</span>
              <input name="email" type="email" required autoComplete="email" className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nomor HP *</span>
              <input name="phone" required autoComplete="tel" className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Password *</span>
              <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClasses} />
            </label>
            <button type="submit" className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.96]">
              Buat Akun dan Lanjutkan
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            Sudah punya akun wali?{" "}
            <Link href="/login" className="font-semibold text-primary-700 underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
