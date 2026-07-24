import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { BKKH_TIME_SLOTS, countFilledBkkhSlots } from "@/lib/bkkh";
import {
  getAnnouncements,
  getBkkhDailyReports,
  getChildReportCards,
  getDashboardData,
  getParentChildren,
  getParentLevels,
  getStaffAttendanceBoard,
  toDateKey,
} from "@/lib/lms";
import {
  Avatar,
  BarChart,
  Badge,
  Card,
  Icons,
  Ring,
  SectionTitle,
  buttonClasses,
  courseAccent,
  initialsFromName,
  type IconKey,
} from "@/components/ui";
import { ParentDashboard } from "./ParentDashboard";
import { MudirDashboard } from "./MudirDashboard";

const dateFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const annFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

export default async function DashboardPage() {
  const user = await requireVerifiedUser();

  if (user.role === "PARENT") {
    const levels = await getParentLevels(user.id);
    const [children, announcements] = await Promise.all([getParentChildren(user.id), getAnnouncements(levels)]);

    // Fetch published report cards for each child
    const reportCardsList = await Promise.all(
      children.map(async (child) => {
        const cards = await getChildReportCards(user.id, child.childId);
        return (cards || []).map((c) => ({
          ...c,
          childName: child.name,
          childId: child.childId,
        }));
      })
    );
    const publishedReportCards = reportCardsList.flat();

    return (
      <ParentDashboard
        name={user.name}
        kids={children}
        announcements={announcements.map((a) => ({ id: a.id, title: a.title, level: a.level, createdAt: annFmt.format(a.createdAt) }))}
        publishedReportCards={publishedReportCards.map((rc) => ({
          id: rc.id,
          childName: rc.childName,
          childId: rc.childId,
          semester: rc.semester,
          academicYear: rc.academicYear,
          publishedAt: rc.publishedAt ? annFmt.format(rc.publishedAt) : "-",
        }))}
      />
    );
  }

  if (user.role === "MUDIR") {
    const dateKey = toDateKey(new Date());
    const [data, staff, bkkhReports] = await Promise.all([
      getDashboardData(user),
      getStaffAttendanceBoard(dateKey),
      getBkkhDailyReports(dateKey),
    ]);
    const attention = staff
      .map((row) => {
        const report = bkkhReports.get(row.id);
        const filledSlots = countFilledBkkhSlots(report);
        const issues: string[] = [];
        if (!report) issues.push("BKKH belum diisi");
        else if (filledSlots < BKKH_TIME_SLOTS.length) issues.push(`BKKH ${filledSlots}/${BKKH_TIME_SLOTS.length}`);
        return { id: row.id, name: row.name, role: row.role, status: row.status, issues };
      })
      .filter((row) => row.status !== "PRESENT" || row.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length);

    return <MudirDashboard name={user.name} dateLabel={dateFmt.format(new Date())} data={data} attention={attention} />;
  }

  const data = await getDashboardData(user);
  const greet = user.name.split(" ")[0];

  const primaryCta =
    user.role === "ADMIN"
      ? { href: "/pengguna", label: "Kelola Pengguna" }
      : user.role === "HOMEROOM"
        ? { href: "/rapor", label: "Kelola Rapor" }
        : { href: "/nilai", label: "Mulai Menilai" };

  const secondaryCta =
    user.role === "ADMIN"
      ? { href: "/penerimaan", label: "Tinjau Pendaftaran" }
      : user.role === "HOMEROOM"
        ? { href: "/absen", label: "Pantau Kelas" }
        : { href: "/absen", label: "Lihat Absensi" };

  const heroBlurb =
    user.role === "TEACHER"
      ? "Kelola mata pelajaran, catat kehadiran, dan isi nilai kelas yang kamu ampu hari ini."
      : user.role === "HOMEROOM"
        ? "Pantau kelas binaan, absensi santri, nilai, dan informasi untuk wali."
        : "Kelola pendaftaran, akun, data dasar, jadwal, dan operasional pesantren.";

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
                href={secondaryCta.href}
                className="inline-flex items-center rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {secondaryCta.label}
              </Link>
            </div>
          </div>
          <div className="hidden flex-col items-center gap-1.5 sm:flex">
            <Ring value={data.hero.value} size={120} stroke={12} color="#fff" label={`${data.hero.value}%`} />
            <div className="max-w-32 text-center text-[12.5px] font-semibold opacity-90">{data.hero.label}</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <Card pad={18}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4" style={{ gap: "16px 20px" }}>
          {data.stats.map((s, idx) => {
            const Icon = Icons[s.icon as IconKey];
            let borderClass = "";
            if (idx === 0) {
              borderClass = "";
            } else if (idx === 1) {
              borderClass = "border-l border-line pl-4 lg:pl-5";
            } else if (idx === 2) {
              borderClass = "border-t border-line pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:border-line lg:pl-5";
            } else if (idx === 3) {
              borderClass = "border-t border-l border-line pt-4 pl-4 lg:border-t-0 lg:pt-0 lg:pl-5";
            }

            return (
              <div key={s.label} className={`flex flex-col justify-between ${borderClass}`}>
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2" style={{ color: s.tone }}>
                    <Icon size={20} />
                  </div>
                  {s.delta ? (
                    <Badge tone={s.up ? "success" : "warning"}>
                      {s.up ? <Icons.arrowUp size={11} /> : null}
                      {s.delta}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3.5 text-2xl font-extrabold tracking-tight">{s.value}</div>
                <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">{s.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid items-start gap-4.5 lg:grid-cols-[1.55fr_1fr]" style={{ gap: 18 }}>
        <div className="flex flex-col gap-4.5" style={{ gap: 18 }}>
          {/* Mata pelajaran */}
          <Card pad={20}>
            <SectionTitle
              title="Mata Pelajaran"
              sub={user.role === "TEACHER" ? "Mapel yang ditugaskan kepada Anda" : "Mapel terbaru dan jumlah pesertanya"}
              action={
                <Link href="/mapel" className={buttonClasses("ghost", "sm")}>
                  Semua mapel
                </Link>
              }
            />
            <div className="flex flex-col gap-3">
              {data.courses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-3">
                  Belum ada mata pelajaran.
                </p>
              ) : (
                data.courses.slice(0, 3).map((c) => {
                  const accent = courseAccent(c.id);
                  return (
                    <Link
                      key={c.id}
                      href={`/mapel/${c.id}`}
                      className="flex items-center gap-3.5 rounded-xl border border-line p-3 transition hover:bg-surface-2"
                    >
                      <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl" style={{ background: accent.soft, color: accent.color }}>
                        <Icons.book size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-bold">{c.title}</div>
                        <div className="mt-0.5 text-[12.5px] text-ink-3">{c.students} santri terdaftar</div>
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
            <SectionTitle title={data.weeklyTitle} sub={data.weeklySub} />
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
          {user.role !== "ADMIN" ? (
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
          ) : null}

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
