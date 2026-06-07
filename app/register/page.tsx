import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Icons, inputClasses } from "@/components/ui";
import { registerStudentAction } from "@/app/register/actions";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Nama, email, password, no. induk, dan kelas wajib diisi.",
  password: "Password minimal 8 karakter.",
  email: "Email sudah dipakai akun lain.",
  studentNumber: "No. induk sudah terdaftar.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user) {
    redirect(user.status === "VERIFIED" ? "/dashboard" : "/pending");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-float lg:grid-cols-[0.85fr_1.15fr]">
        <div className="p-8 text-white sm:p-10" style={{ background: "var(--primary-700)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Icons.cap size={20} style={{ color: "#fff" }} />
            </span>
            <span className="text-lg font-extrabold">General LMS</span>
          </Link>
          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Registrasi siswa</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">Buat akun, lalu tunggu verifikasi admin.</h1>
            <p className="mt-4 opacity-90">Akun baru tidak langsung aktif. Admin harus memverifikasi data siswa terlebih dahulu.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Data siswa</h2>
          <p className="mt-2 text-sm text-ink-3">Isi data utama untuk proses verifikasi.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
          ) : null}

          <form action={registerStudentAction} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nama lengkap</span>
              <input name="name" required className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Password</span>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">No. Induk</span>
              <input name="studentNumber" required className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Kelas / Grup</span>
              <input name="className" required placeholder="cth. XI-A" className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nomor HP</span>
              <input name="phone" autoComplete="tel" className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Alamat</span>
              <textarea name="address" rows={3} className={inputClasses} />
            </label>
            <button type="submit" className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600 sm:col-span-2">
              Daftar dan tunggu verifikasi
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-primary-700 underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
