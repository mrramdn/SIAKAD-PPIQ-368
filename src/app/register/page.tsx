import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Assessment RIASEC"
      title="Buat akun, lalu mulai dari profil dasar."
      description="Aplikasi akan menghitung kecenderungan RIASEC dan menghubungkannya dengan karir, jurusan, fakultas, dan kampus."
      footerLabel="Sudah punya akun?"
      footerHref="/login"
      footerCta="Masuk"
    >
      <RegisterForm />
    </AuthShell>
  );
}
