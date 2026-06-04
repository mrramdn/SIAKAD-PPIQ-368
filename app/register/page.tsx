import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { registerStudentAction } from "@/app/register/actions";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Nama, email, password, NIS, dan kelas wajib diisi.",
  password: "Password minimal 8 karakter.",
  email: "Email sudah dipakai akun lain.",
  studentNumber: "NIS sudah terdaftar.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user) {
    redirect(user.status === "VERIFIED" ? "/dashboard" : "/pending");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/60 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <Link href="/" className="text-lg font-semibold">
            General LMS
          </Link>
          <div className="mt-16">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Registrasi siswa</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Buat akun siswa, lalu tunggu verifikasi admin.
            </h1>
            <p className="mt-4 text-slate-300">
              Akun baru tidak langsung bisa belajar. Admin harus memverifikasi data siswa terlebih dahulu.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-semibold">Data siswa</h2>
          <p className="mt-2 text-sm text-slate-500">Isi data utama untuk proses verifikasi.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action={registerStudentAction} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nama lengkap</span>
              <input name="name" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">NIS</span>
              <input name="studentNumber" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Kelas</span>
              <input name="className" required placeholder="XI-A" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nomor HP</span>
              <input name="phone" autoComplete="tel" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Alamat</span>
              <textarea name="address" rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" />
            </label>
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 sm:col-span-2">
              Daftar dan tunggu verifikasi
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-slate-950 underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
