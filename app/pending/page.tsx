import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function PendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "VERIFIED") {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const statusText = {
    PENDING: "Akun kamu menunggu verifikasi admin.",
    REJECTED: "Akun kamu belum disetujui admin.",
    SUSPENDED: "Akun kamu sedang dinonaktifkan.",
  }[user.status] ?? "Akun kamu belum bisa mengakses LMS.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 text-slate-950">
      <section className="w-full max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-2xl shadow-slate-300/60">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-700">Verifikasi admin</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Belum bisa masuk kelas</h1>
        <p className="mt-4 text-slate-500">{statusText}</p>
        <p className="mt-3 text-sm text-slate-400">Email akun: {user.email}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <form action="/logout" method="post">
            <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Logout
            </button>
          </form>
          <Link href="/" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
