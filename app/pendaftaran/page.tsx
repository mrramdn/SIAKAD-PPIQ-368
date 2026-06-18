import Link from "next/link";
import { Icons, inputClasses } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { LEVEL_FULL, LEVELS } from "@/lib/brand";
import { submitAdmissionAction } from "./actions";

type PageProps = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function PendaftaranPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.success) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6 py-12 text-ink">
        <div className="w-full max-w-md rounded-[22px] border border-line bg-surface p-8 text-center shadow-float">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success">
            <Icons.check2 size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-balance">Pendaftaran terkirim</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2 text-pretty">
            Terima kasih. Data pendaftaran santri sudah kami terima. Tim {APP_NAME} akan meninjau dan menghubungi Anda lewat
            kontak yang didaftarkan.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }

  const errorMessage = params.error ? "Periksa kembali data wajib: nama santri, jenjang, nama & kontak orang tua." : null;

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-float lg:grid-cols-[0.85fr_1.15fr]">
        <div className="p-8 text-white sm:p-10" style={{ background: "var(--primary-700)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Icons.cap size={20} style={{ color: "#fff" }} />
            </span>
            <span className="text-lg font-extrabold">{APP_NAME}</span>
          </Link>
          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Pendaftaran Santri Baru</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-balance">
              Daftarkan putra/putri Anda ke pesantren.
            </h1>
            <p className="mt-4 opacity-90 text-pretty">
              Isi formulir penerimaan santri baru. Setelah diterima admin, akun wali santri otomatis dibuat agar Anda dapat
              memantau nilai, kehadiran, dan informasi anak.
            </p>
            <div className="mt-8 space-y-2.5">
              {LEVELS.map((l) => (
                <div key={l} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-sm font-bold">{l}</span>
                  <span className="text-sm font-semibold">{LEVEL_FULL[l]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Formulir Pendaftaran</h2>
          <p className="mt-2 text-sm text-ink-3">Data bertanda wajib digunakan untuk verifikasi.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
          ) : null}

          <form action={submitAdmissionAction} className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nama lengkap santri *</span>
              <input name="childName" required className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Jenjang *</span>
              <select name="level" required defaultValue="" className={inputClasses}>
                <option value="" disabled>
                  Pilih jenjang
                </option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_FULL[l]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Jenis kelamin</span>
              <select name="gender" defaultValue="" className={inputClasses}>
                <option value="">-</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Tempat lahir</span>
              <input name="birthPlace" className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Tanggal lahir</span>
              <input name="birthDate" type="date" className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Asal sekolah</span>
              <input name="previousSchool" className={inputClasses} />
            </label>

            <div className="sm:col-span-2 mt-1 border-t border-line pt-4 text-[12.5px] font-bold uppercase tracking-wider text-ink-3">
              Data Orang Tua / Wali
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nama orang tua *</span>
              <input name="parentName" required className={inputClasses} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Nomor HP *</span>
              <input name="parentPhone" required className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Email orang tua *</span>
              <input name="parentEmail" type="email" required className={inputClasses} />
              <span className="mt-1 block text-xs text-ink-3">Email ini akan menjadi akun login wali santri.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Alamat</span>
              <textarea name="address" rows={2} className={inputClasses} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-ink-2">Catatan</span>
              <textarea name="note" rows={2} className={inputClasses} />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.99] sm:col-span-2"
            >
              Kirim Pendaftaran
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
