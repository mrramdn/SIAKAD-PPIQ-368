import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerLabel: string;
  footerHref: string;
  footerCta: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerHref,
  footerCta,
}: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative flex min-h-[42rem] flex-col justify-between overflow-hidden bg-brand-strong px-6 py-7 text-paper sm:px-10 lg:min-h-dvh lg:px-12">
          <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-12 right-6 h-72 w-72 rounded-full bg-brand/50 blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <BrandMark size="md" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">RIASEC</p>
              <p className="mt-1 text-base font-semibold">Integritas Qurani</p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-16 lg:py-0">
            <p className="mb-5 inline-flex rounded-full bg-paper/10 px-4 py-2 text-sm font-medium text-paper shadow-[0_1px_0_rgba(255,255,255,0.12)]">
              {eyebrow}
            </p>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-8 text-paper/80 sm:text-lg">{description}</p>
          </div>

          <div className="relative z-10 grid gap-3 border-t border-paper/15 pt-5 text-sm text-paper/75 sm:grid-cols-3">
            <p>Assessment 30 pertanyaan</p>
            <p>Skor RIASEC otomatis</p>
            <p>Rekomendasi karir dan jurusan</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[30rem]">
            <div className="rounded-[2rem] bg-paper p-5 shadow-[var(--shadow)] sm:p-7">
              <div className="rounded-[1.375rem] bg-background p-5 shadow-[inset_0_0_0_1px_var(--line)] sm:p-6">
                {children}
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              {footerLabel}{" "}
              <Link
                href={footerHref}
                className="font-semibold text-brand-strong underline-offset-4 transition-colors hover:text-brand focus-visible:rounded-sm"
              >
                {footerCta}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
