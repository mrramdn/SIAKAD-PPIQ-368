import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Icons, inputClasses } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { loginAction } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Email dan password wajib diisi.",
  invalid: "Email atau password tidak sesuai.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user) {
    redirect(user.status === "VERIFIED" ? "/dashboard" : "/pending");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-float lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-8 text-white sm:p-10" style={{ background: "var(--primary-700)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Icons.cap size={20} style={{ color: "#fff" }} />
            </span>
            <span className="text-lg font-extrabold">{APP_NAME}</span>
          </Link>
          <div className="mt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Login</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-balance">Masuk ke akun pesantren.</h1>
            <p className="mt-4 opacity-90 text-pretty">
              Wali santri memantau anak. Wali kelas dan pengajar mengelola kelas. Administrasi meninjau pendaftaran.
            </p>
          </div>
          <div className="mono mt-12 rounded-xl bg-white/10 p-4 text-[13px]">
            <p>admin@pesantren.id / password123</p>
            <p className="mt-1">wali@pesantren.id / password123</p>
            <p className="mt-1">guru@pesantren.id / password123</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Masuk</h2>
          <p className="mt-2 text-sm text-ink-3">Session disimpan memakai HTTP-only cookie.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
          ) : null}

          <form action={loginAction} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputClasses} placeholder="admin@example.com" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Password</span>
              <input name="password" type="password" required autoComplete="current-password" className={inputClasses} placeholder="password123" />
            </label>
            <button type="submit" className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600">
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            Belum punya akun wali?{" "}
            <Link href="/register" className="font-semibold text-primary-700 underline underline-offset-4">
              Buat akun wali
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
