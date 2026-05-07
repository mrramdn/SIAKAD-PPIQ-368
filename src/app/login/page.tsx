import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthShell
      eyebrow="Akses akun"
      title="Masuk untuk membaca arah minatmu."
      description="Satu akun menyimpan profil, riwayat assessment, dan rekomendasi yang bisa dibaca lagi saat sesi bimbingan berikutnya."
      footerLabel="Belum punya akun?"
      footerHref="/register"
      footerCta="Daftar sekarang"
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
