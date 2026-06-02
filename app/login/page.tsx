import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/60 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <Link href="/" className="text-lg font-semibold">
            General LMS
          </Link>
          <div className="mt-20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Login</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Masuk sebagai admin atau user.
            </h1>
            <p className="mt-4 text-slate-300">
              Gunakan akun demo dari seed database untuk mengakses dashboard LMS.
            </p>
          </div>
          <div className="mt-12 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
            <p>Admin: admin@example.com / password123</p>
            <p className="mt-1">User: user@example.com / password123</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-950">Masuk ke LMS</h2>
          <p className="mt-2 text-sm text-slate-500">Session disimpan memakai HTTP-only cookie.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action={loginAction} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                placeholder="admin@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                placeholder="password123"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
