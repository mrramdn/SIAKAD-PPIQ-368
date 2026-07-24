import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { inputClasses } from "@/components/ui";
import { AuthShell } from "@/components/AuthShell";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
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
    <AuthShell
      eyebrow="Akses portal pesantren"
      title="Satu pintu untuk setiap peran di pesantren."
      description="Wali memantau perkembangan anak, ustadz mengelola pembelajaran, Administrasi menangani operasional, dan Mudir mengawasi kegiatan harian."
      asideFooter={
        <div className="mono border-t border-white/15 pt-5 text-xs leading-6 text-white/70">
          <p className="font-sans font-semibold text-white/85">Akun demo</p>
          <div className="mt-2 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email}>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/60">{account.role}</p>
                <p>{account.email} · {account.password}</p>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Selamat datang kembali</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Masuk ke akun</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-ink-3">Gunakan email dan password yang terdaftar pada sistem pesantren.</p>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <form action={loginAction} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-2">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClasses} placeholder="nama@pesantren.id" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-2">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className={inputClasses} placeholder="Masukkan password" />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
        >
          Masuk
        </button>
      </form>

      <details className="mono mt-7 border-y border-line py-3 text-xs text-ink-3 lg:hidden">
        <summary className="cursor-pointer font-sans text-sm font-semibold text-ink-2">Lihat akun demo</summary>
        <div className="mt-3 grid gap-2 leading-6">
          {DEMO_ACCOUNTS.map((account) => (
            <div key={account.email}>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-ink-3">{account.role}</p>
              <p>{account.email} · {account.password}</p>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-7 text-center text-sm text-ink-3">
        Belum punya akun wali?{" "}
        <Link href="/register" className="font-semibold text-primary-700 underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
          Buat akun wali
        </Link>
      </p>
    </AuthShell>
  );
}
