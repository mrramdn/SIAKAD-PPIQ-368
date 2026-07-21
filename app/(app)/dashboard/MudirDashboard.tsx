import Link from "next/link";
import {
  BarChart,
  Badge,
  Card,
  Icons,
  Ring,
  SectionTitle,
  buttonClasses,
  type IconKey,
} from "@/components/ui";

type DashboardData = {
  hero: { value: number; label: string };
  stats: { label: string; value: string; delta?: string; up?: boolean; tone: string; icon: string }[];
  weeklyActivity: { l: string; v: number; hot?: boolean }[];
  weeklyTitle: string;
  weeklySub: string;
  schedule: { id: string; time: string; title: string; room: string; teacher: string }[];
};

type AttentionItem = {
  id: string;
  name: string;
  role: string;
  status: string | null;
  issues: string[];
};

const STATUS_META: Record<string, { label: string; tone: "success" | "primary" | "warning" | "danger" }> = {
  PRESENT: { label: "Hadir", tone: "success" },
  EXCUSED: { label: "Izin", tone: "primary" },
  LATE: { label: "Terlambat", tone: "warning" },
  ABSENT: { label: "Alpa", tone: "danger" },
};

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Pengajar",
  HOMEROOM: "Wali Kelas",
};

const ACADEMIC_LINKS = [
  { href: "/nilai", label: "Nilai santri", description: "Pantau hasil belajar per mapel", icon: "chart" },
  { href: "/absen", label: "Absensi santri", description: "Periksa rekap kehadiran kelas", icon: "check2" },
  { href: "/rapor", label: "Rapor semester", description: "Tinjau rapor draft dan terbit", icon: "award" },
  { href: "/jadwal", label: "Jadwal mengajar", description: "Lihat penugasan ustadz hari ini", icon: "calendar" },
] satisfies { href: string; label: string; description: string; icon: IconKey }[];

export function MudirDashboard({
  name,
  dateLabel,
  data,
  attention,
}: {
  name: string;
  dateLabel: string;
  data: DashboardData;
  attention: AttentionItem[];
}) {
  return (
    <div className="view-enter flex flex-col gap-[18px]">
      <section className="relative overflow-hidden rounded-[22px] bg-primary-700 p-6 text-white shadow-pop lg:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-28 h-44 w-44 rounded-full bg-white/[0.06]" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Panel Mudir Ma&apos;had</p>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              Pengawasan ustadz hari ini
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {dateLabel} · {name}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/absen-ustadz" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700">
                Periksa laporan ustadz <Icons.chevR size={17} />
              </Link>
              <Link href="/jadwal" className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white">
                Jadwal mengajar
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 flex-col items-center gap-2 sm:flex">
            <Ring value={data.hero.value} size={116} stroke={11} color="#fff" label={`${data.hero.value}%`} />
            <span className="max-w-32 text-center text-xs font-semibold text-white/80">{data.hero.label}</span>
          </div>
        </div>
      </section>

      <Card pad={18}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-4">
          {data.stats.map((stat, index) => {
            const Icon = Icons[stat.icon as IconKey];
            const border =
              index === 1
                ? "border-l border-line pl-4 lg:pl-5"
                : index === 2
                  ? "border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
                  : index === 3
                    ? "border-l border-t border-line pl-4 pt-4 lg:border-t-0 lg:pl-5 lg:pt-0"
                    : "";
            return (
              <div key={stat.label} className={border}>
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2" style={{ color: stat.tone }}>
                    <Icon size={18} />
                  </span>
                  {stat.delta ? <Badge tone="warning">{stat.delta}</Badge> : null}
                </div>
                <div className="mt-3 text-2xl font-extrabold tracking-tight tabular-nums">{stat.value}</div>
                <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid items-start gap-[18px] lg:grid-cols-[1.45fr_1fr]">
        <div className="flex flex-col gap-[18px]">
          <Card pad={20}>
            <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[19px] font-bold tracking-tight">Perlu ditindaklanjuti</h2>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-3">
                  Ustadz dengan kehadiran atau BKKH yang belum lengkap hari ini
                </p>
              </div>
              <Link href="/absen-ustadz" className={buttonClasses("ghost", "sm", "shrink-0")}>Lihat semua</Link>
            </div>
            {attention.length === 0 ? (
              <div className="rounded-xl bg-success-soft px-4 py-5 text-center">
                <Icons.check2 size={22} className="mx-auto text-success" />
                <p className="mt-2 text-sm font-semibold text-ink">Semua laporan ustadz sudah lengkap.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {attention.slice(0, 6).map((item) => {
                  const status = item.status ? STATUS_META[item.status] : null;
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{item.name}</div>
                        <div className="mt-0.5 text-xs text-ink-3">{ROLE_LABEL[item.role] ?? item.role}</div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge tone={status?.tone ?? "neutral"}>{status?.label ?? "Belum absen"}</Badge>
                        {item.issues.map((issue) => <Badge key={issue} tone="warning">{issue}</Badge>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card pad={20}>
            <SectionTitle title={data.weeklyTitle} sub={data.weeklySub} />
            <BarChart data={data.weeklyActivity} height={150} />
          </Card>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Card pad={20}>
            <SectionTitle title="Jadwal mengajar hari ini" />
            {data.schedule.length === 0 ? (
              <p className="rounded-xl bg-surface-2 px-4 py-5 text-center text-sm text-ink-3">Tidak ada jadwal hari ini.</p>
            ) : (
              <div className="divide-y divide-line">
                {data.schedule.slice(0, 5).map((item) => (
                  <div key={item.id} className="grid grid-cols-[52px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mono text-xs font-bold text-primary-700">{item.time}</span>
                    <div>
                      <div className="text-sm font-bold">{item.title}</div>
                      <div className="mt-0.5 text-xs text-ink-3">{item.teacher} · {item.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card pad={20}>
            <SectionTitle title="Pengawasan akademik" sub="Akses cepat ke data yang perlu dipantau" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {ACADEMIC_LINKS.map((item) => {
                const Icon = Icons[item.icon];
                return (
                  <Link key={item.href} href={item.href} className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-700">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="block truncate text-xs text-ink-3">{item.description}</span>
                    </span>
                    <Icons.chevR size={16} className="text-ink-3" />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
