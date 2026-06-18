import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getAnnouncements, getDashboardData, getParentChildren, getParentLevels } from "@/lib/lms";
import {
  Avatar,
  BarChart,
  Badge,
  Card,
  Icons,
  Progress,
  Ring,
  SectionTitle,
  StatCard,
  buttonClasses,
  courseAccent,
  initialsFromName,
  type IconKey,
} from "@/components/ui";
import { ParentDashboard } from "./ParentDashboard";

const dateFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const annFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

export default async function DashboardPage() {
  const user = await requireVerifiedUser();

  if (user.role === "PARENT") {
    const levels = await getParentLevels(user.id);
    const [children, announcements] = await Promise.all([getParentChildren(user.id), getAnnouncements(levels)]);
    return (
      <ParentDashboard
        name={user.name}
        kids={children}
        announcements={announcements.map((a) => ({ id: a.id, title: a.title, level: a.level, createdAt: annFmt.format(a.createdAt) }))}
      />
    );
  }

  const data = await getDashboardData(user);
  const isStudent = user.role === "STUDENT";
  const greet = user.name.split(" ")[0];

  const heroRing = isStudent
    ? data.continueLearning.length
      ? Math.round(data.continueLearning.reduce((s, c) => s + c.progress, 0) / data.continueLearning.length)
      : 0
    : Number(String(data.stats[3]?.value ?? "0").replace("%", "")) || 0;

  const primaryCta = isStudent
    ? { href: "/learning", label: "Lanjutkan Belajar" }
    : user.role === "ADMIN"
      ? { href: "/pengguna", label: "Kelola Pengguna" }
      : { href: "/nilai", label: "Mulai Menilai" };

  const heroBlurb = isStudent
    ? "Lanjutkan materi yang sedang berjalan dan pantau progres belajarmu."
    : user.role === "TEACHER"
      ? "Catat kehadiran dan isi nilai kelas yang kamu ampu hari ini."
      : "Pantau verifikasi siswa, kelas aktif, dan kehadiran seluruh LMS.";

  return (
    <div className="view-enter flex flex-col gap-5.5" style={{ gap: 22 }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[22px] p-6 text-white shadow-pop lg:p-8"
        style={{ background: "var(--primary-700)" }}
      >
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/[0.07]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[520px]">
            <div className="mb-2 text-[13px] font-semibold opacity-85">{dateFmt.format(new Date())}</div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight lg:text-3xl">Selamat datang, {greet} 👋</h1>
            <p className="mt-2.5 text-[14.5px] leading-relaxed opacity-90">{heroBlurb}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700"
              >
                {primaryCta.label}
                <Icons.chevR size={17} />
              </Link>
              <Link
                href="/absen"
                className="inline-flex items-center rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Lihat Absensi
              </Link>
            </div>
          </div>
          <div className="hidden flex-col items-center gap-1.5 sm:flex">
            <Ring value={heroRing} size={120} stroke={12} color="#fff" label={`${heroRing}%`} />
            <div className="text-[12.5px] font-semibold opacity-90">{isStudent ? "Progres Semester" : "Tingkat Kehadiran"}</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {data.stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            delta={s.delta}
            up={s.up}
            tone={s.tone}
            icon={Icons[s.icon as IconKey]}
          />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid items-start gap-4.5 lg:grid-cols-[1.55fr_1fr]" style={{ gap: 18 }}>
        <div className="flex flex-col gap-4.5" style={{ gap: 18 }}>
          {/* Continue learning */}
          <Card pad={20}>
            <SectionTitle
              title={isStudent ? "Lanjutkan Belajar" : "Kelas Anda"}
              sub="Materi yang sedang berjalan"
              action={
                <Link href="/learning" className={buttonClasses("ghost", "sm")}>
                  Semua kelas
                </Link>
              }
            />
            <div className="flex flex-col gap-3">
              {data.continueLearning.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-3">
                  Belum ada kelas berjalan.
                </p>
              ) : (
                data.continueLearning.slice(0, 3).map((c) => {
                  const accent = courseAccent(c.id);
                  return (
                    <Link
                      key={c.id}
                      href={`/learning/${c.id}`}
                      className="flex items-center gap-3.5 rounded-xl border border-line p-3 transition hover:bg-surface-2"
                    >
                      <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl" style={{ background: accent.soft, color: accent.color }}>
                        <Icons.book size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2.5">
                          <div className="truncate text-[14.5px] font-bold">{c.title}</div>
                          <div className="shrink-0 text-[12.5px] font-semibold text-ink-3">{c.progress}%</div>
                        </div>
                        <div className="mb-2 mt-0.5 text-[12.5px] text-ink-3">
                          {c.done}/{c.lessons} materi
                        </div>
                        <Progress value={c.progress} color={accent.color} h={6} />
                      </div>
                      <Icons.chevR size={18} style={{ color: "var(--text-3)" }} />
                    </Link>
                  );
                })
              )}
            </div>
          </Card>

          {/* Weekly activity */}
          <Card pad={20}>
            <SectionTitle title="Aktivitas Mingguan" sub="Sesi kelas tercatat per hari" />
            <BarChart data={data.weeklyActivity} height={140} />
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4.5" style={{ gap: 18 }}>
          {/* Today schedule */}
          <Card pad={20}>
            <SectionTitle title="Jadwal Hari Ini" />
            <div className="flex flex-col gap-1">
              {data.schedule.length === 0 ? (
                <p className="text-sm text-ink-3">Tidak ada jadwal hari ini.</p>
              ) : (
                data.schedule.map((t, i) => {
                  const accent = courseAccent(t.id);
                  return (
                    <div key={t.id} className="flex gap-3" style={{ paddingBottom: i < data.schedule.length - 1 ? 14 : 0 }}>
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: accent.color }} />
                        {i < data.schedule.length - 1 ? <div className="mt-1 w-0.5 flex-1 bg-line" /> : null}
                      </div>
                      <div className="flex-1 pb-1">
                        <span className="mono text-[12.5px] font-semibold text-ink-2">{t.time}</span>
                        <div className="mt-0.5 text-sm font-bold">{t.title}</div>
                        <div className="mt-px text-[12.5px] text-ink-3">
                          {t.room} · {t.teacher}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Deadlines */}
          <Card pad={20}>
            <SectionTitle title="Tenggat Terdekat" />
            <div className="flex flex-col gap-2.5">
              {data.deadlines.length === 0 ? (
                <p className="text-sm text-ink-3">Tidak ada tenggat mendatang.</p>
              ) : (
                data.deadlines.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
                    <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-lg border border-line bg-surface text-primary">
                      <Icons.clock size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{d.title}</div>
                      <div className="text-xs text-ink-3">{d.course}</div>
                    </div>
                    <div className="text-right text-[13px] font-bold">{d.due}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Activity feed */}
          <Card pad={20}>
            <SectionTitle title="Aktivitas Terbaru" />
            <div className="flex flex-col gap-3.5">
              {data.activity.length === 0 ? (
                <p className="text-sm text-ink-3">Belum ada aktivitas.</p>
              ) : (
                data.activity.map((a, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Avatar initials={initialsFromName(a.who)} color="var(--primary)" size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug">
                        <strong className="font-bold">{a.who}</strong> <span className="text-ink-2">{a.text}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-ink-3">
                        <span>{a.when}</span>
                        <Badge tone="neutral">{a.tag}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
