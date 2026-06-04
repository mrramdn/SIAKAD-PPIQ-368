import Link from "next/link";
import { UserStatus } from "@/generated/prisma/client";
import { updateUserStatusAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/lms";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAdminUsers();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-lg font-semibold">General LMS</Link>
            <p className="mt-1 text-sm text-slate-400">Verifikasi akun</p>
          </div>
          <Link href="/admin/students" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">Data Siswa</Link>
        </nav>

        <header className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-200">Admin approval</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Verifikasi user baru</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Akun siswa baru harus diverifikasi sebelum bisa masuk dashboard belajar.</p>
        </header>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-white text-slate-950">
          {users.map((user) => (
            <article key={user.id} className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1fr_0.5fr_0.7fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{user.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{user.role}</span>
                  <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-900">{user.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                {user.profile ? (
                  <p className="mt-2 text-sm text-slate-500">NIS {user.profile.studentNumber} · Kelas {user.profile.className}</p>
                ) : null}
              </div>
              <p className="text-sm text-slate-500">{user.profile?.phone ?? "Tidak ada nomor HP"}</p>
              <form action={updateUserStatusAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="userId" value={user.id} />
                {[UserStatus.VERIFIED, UserStatus.REJECTED, UserStatus.SUSPENDED].map((status) => (
                  <button
                    key={status}
                    name="status"
                    value={status}
                    className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    type="submit"
                  >
                    {status}
                  </button>
                ))}
              </form>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
