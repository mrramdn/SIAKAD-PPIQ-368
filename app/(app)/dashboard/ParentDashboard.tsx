import Link from "next/link";
import { Badge, Card, Icons, Ring, SectionTitle, buttonClasses, scoreColor, type Tone } from "@/components/ui";

type Level = "SD" | "SMP" | "SMA";

type Child = {
  childId: string;
  name: string;
  level: Level;
  className: string;
  studentNumber: string;
  courses: number;
  avg: number;
  attRate: number;
};

type Announcement = { id: string; title: string; level: Level | null; createdAt: string };

const LEVEL_TONE: Record<Level, Tone> = { SD: "accent", SMP: "primary", SMA: "success" };
const dateFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function ParentDashboard({ name, kids, announcements }: { name: string; kids: Child[]; announcements: Announcement[] }) {
  const greet = name.split(" ")[0];
  const avgAll = kids.length ? Math.round(kids.reduce((s, c) => s + c.avg, 0) / kids.length) : 0;
  const attAll = kids.length ? Math.round(kids.reduce((s, c) => s + c.attRate, 0) / kids.length) : 0;

  return (
    <div className="view-enter flex flex-col" style={{ gap: 22 }}>
      <div className="relative overflow-hidden rounded-[22px] p-6 text-white shadow-pop lg:p-8" style={{ background: "var(--primary-700)" }}>
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[520px]">
            <div className="mb-2 text-[13px] font-semibold opacity-85">{dateFmt.format(new Date())}</div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight lg:text-3xl text-balance">Assalamualaikum, {greet}</h1>
            <p className="mt-2.5 text-[14.5px] leading-relaxed opacity-90 text-pretty">
              Pantau perkembangan nilai, kehadiran, dan informasi terbaru {kids.length > 1 ? "anak-anak" : "anak"} Anda.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/anak" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700">
                Lihat Detail Anak
                <Icons.chevR size={17} />
              </Link>
              <Link href="/informasi" className="inline-flex items-center rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white">
                Informasi
              </Link>
            </div>
          </div>
          <div className="hidden flex-col items-center gap-1.5 sm:flex">
            <Ring value={attAll} size={120} stroke={12} color="#fff" label={`${attAll}%`} />
            <div className="text-[12.5px] font-semibold opacity-90">Rata Kehadiran</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Card hover pad={18}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-primary">{Icons.users({ size: 21 })}</div>
          <div className="mt-3.5 text-[28px] font-extrabold tabular-nums tracking-tight">{kids.length}</div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-3">Anak Terpantau</div>
        </Card>
        <Card hover pad={18}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2" style={{ color: "var(--teal)" }}>{Icons.award({ size: 21 })}</div>
          <div className="mt-3.5 text-[28px] font-extrabold tabular-nums tracking-tight">{avgAll || "-"}</div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-3">Rata Nilai</div>
        </Card>
        <Card hover pad={18}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2" style={{ color: "var(--green)" }}>{Icons.check2({ size: 21 })}</div>
          <div className="mt-3.5 text-[28px] font-extrabold tabular-nums tracking-tight">{attAll}%</div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-3">Rata Kehadiran</div>
        </Card>
        <Card hover pad={18}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2" style={{ color: "var(--amber)" }}>{Icons.bell({ size: 21 })}</div>
          <div className="mt-3.5 text-[28px] font-extrabold tabular-nums tracking-tight">{announcements.length}</div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-3">Informasi Terbaru</div>
        </Card>
      </div>

      <div className="grid items-start gap-4.5 lg:grid-cols-[1.55fr_1fr]" style={{ gap: 18 }}>
        <Card pad={20}>
          <SectionTitle title="Anak Saya" sub="Ringkasan tiap santri" action={<Link href="/anak" className={buttonClasses("ghost", "sm")}>Semua</Link>} />
          <div className="flex flex-col gap-3">
            {kids.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-3">Belum ada data anak terhubung dengan akun Anda.</p>
            ) : (
              kids.map((c) => (
                <Link key={c.childId} href={`/anak/${c.childId}`} className="flex items-center gap-3.5 rounded-xl border border-line p-3.5 transition hover:bg-surface-2">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary-700">{c.level}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold">{c.name}</span>
                      <Badge tone={LEVEL_TONE[c.level]}>{c.className}</Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-[12.5px] text-ink-3">
                      <span>Nilai <strong className="tabular-nums" style={{ color: scoreColor(c.avg) }}>{c.avg || "-"}</strong></span>
                      <span>Hadir <strong className="tabular-nums text-ink-2">{c.attRate}%</strong></span>
                      <span className="hidden sm:inline">{c.courses} mapel</span>
                    </div>
                  </div>
                  <Icons.chevR size={18} style={{ color: "var(--text-3)" }} />
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card pad={20}>
          <SectionTitle title="Informasi Terbaru" action={<Link href="/informasi" className={buttonClasses("ghost", "sm")}>Semua</Link>} />
          <div className="flex flex-col gap-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-ink-3">Belum ada informasi.</p>
            ) : (
              announcements.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 rounded-xl bg-surface-2 p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-primary">
                    <Icons.bell size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{a.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-ink-3">{a.level ?? "Semua"} · {a.createdAt}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
