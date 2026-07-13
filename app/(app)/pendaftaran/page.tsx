import Link from "next/link";
import { Card, Icons, inputClasses } from "@/components/ui";
import { UserRole } from "@/generated/prisma/client";
import { requireVerifiedUser } from "@/lib/auth";
import { LEVEL_FULL, LEVELS } from "@/lib/brand";
import { submitAdmissionAction } from "./actions";

type PageProps = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function PendaftaranPage({ searchParams }: PageProps) {
  const [params, user] = await Promise.all([searchParams, requireVerifiedUser()]);

  if (user.role !== UserRole.PARENT) {
    return (
      <div className="view-enter">
        <Card pad={40} className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary-700">
            <Icons.users size={24} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Khusus akun wali santri</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Peninjauan pendaftaran santri baru untuk staf ada di menu Penerimaan.
          </p>
          <Link
            href={user.role === UserRole.ADMIN ? "/penerimaan" : "/dashboard"}
            className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            {user.role === UserRole.ADMIN ? "Buka Penerimaan" : "Kembali ke Dashboard"}
          </Link>
        </Card>
      </div>
    );
  }

  if (params.success) {
    return (
      <div className="view-enter">
        <Card pad={40} className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success">
            <Icons.check2 size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-balance">Pendaftaran terkirim</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2 text-pretty">
            Data pendaftaran santri sudah kami terima. Administrasi akan meninjau pendaftaran; setelah diterima, anak akan
            muncul di menu Anak Saya.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/anak" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600">
              Lihat Anak Saya
            </Link>
            <Link href="/pendaftaran" className="rounded-xl border border-line-strong px-5 py-3 text-sm font-semibold text-ink-2 transition hover:bg-surface-2">
              Daftarkan anak lain
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const errorMessage = params.error ? "Periksa kembali data wajib: nama santri, jenjang, dan format URL dokumen." : null;

  return (
    <div className="view-enter mx-auto flex w-full max-w-3xl flex-col" style={{ gap: 20 }}>
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Pendaftaran Santri Baru</h1>
        <p className="mt-1 text-sm text-ink-3">
          Diajukan oleh <strong className="text-ink">{user.name}</strong> ({user.email}). Data wali diambil dari akun login.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</div>
      ) : null}

      <Card pad={24}>
        <form action={submitAdmissionAction} className="grid gap-5 sm:grid-cols-2">
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

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Alamat</span>
            <textarea name="address" rows={2} className={inputClasses} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Catatan</span>
            <textarea name="note" rows={2} className={inputClasses} />
          </label>

          <div className="sm:col-span-2 mt-1 border-t border-line pt-4 text-[12.5px] font-bold uppercase tracking-wider text-ink-3">
            Dokumen Pendukung
          </div>
          <p className="sm:col-span-2 -mt-3 text-xs leading-relaxed text-ink-3">
            Sementara isi URL dokumen. Integrasi upload Cloudinary dapat memakai field yang sama nanti.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Kartu Keluarga</span>
            <input name="familyCardUrl" type="url" placeholder="https://..." className={inputClasses} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Akta Kelahiran</span>
            <input name="birthCertificateUrl" type="url" placeholder="https://..." className={inputClasses} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Rapor Terakhir</span>
            <input name="previousReportUrl" type="url" placeholder="https://..." className={inputClasses} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-2">Pas Foto</span>
            <input name="photoUrl" type="url" placeholder="https://..." className={inputClasses} />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.99] sm:col-span-2"
          >
            Kirim Pendaftaran
          </button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-3">
        Ingin memantau anak yang sudah terdaftar?{" "}
        <Link href="/anak" className="font-semibold text-primary-700 underline underline-offset-4">
          Cek Anak Saya
        </Link>
      </p>
    </div>
  );
}
