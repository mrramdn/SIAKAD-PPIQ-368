"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, Badge, Button, Card, Icons, Progress, courseAccent, courseCode, initialsFromName, type IconProps } from "@/components/ui";
import { markLessonProgressAction } from "../../actions";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "ASSIGNMENT";
type Lesson = { id: string; title: string; type: LessonType; duration: string | null; description: string | null; content: string | null };

const TYPE_META: Record<LessonType, { icon: (p: IconProps) => React.ReactNode; tone: string; label: string }> = {
  VIDEO: { icon: Icons.play, tone: "var(--primary)", label: "Video" },
  TEXT: { icon: Icons.doc, tone: "var(--teal)", label: "Bacaan" },
  QUIZ: { icon: Icons.quiz, tone: "var(--amber)", label: "Kuis" },
  ASSIGNMENT: { icon: Icons.edit, tone: "var(--green)", label: "Tugas" },
};

export function CourseView({
  course,
  initialProgress,
}: {
  course: { id: string; title: string; description: string; teacher: string; students: number; lessons: Lesson[] };
  initialProgress: number;
}) {
  const accent = courseAccent(course.id);
  const lessons = course.lessons;
  const initialDoneCount = Math.round((initialProgress / 100) * lessons.length);

  const [doneSet, setDoneSet] = useState<Set<string>>(() => new Set(lessons.slice(0, initialDoneCount).map((l) => l.id)));
  const [activeId, setActiveId] = useState<string>(() => lessons.find((l) => !doneSet.has(l.id))?.id ?? lessons[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const pct = lessons.length ? Math.round((doneSet.size / lessons.length) * 100) : 0;
  const activeLesson = useMemo(() => lessons.find((l) => l.id === activeId) ?? lessons[0], [lessons, activeId]);

  function persist(next: Set<string>) {
    const nextPct = lessons.length ? Math.round((next.size / lessons.length) * 100) : 0;
    startTransition(() => {
      void markLessonProgressAction(course.id, nextPct);
    });
  }

  function toggle(id: string) {
    setDoneSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
      return next;
    });
  }

  if (!activeLesson) {
    return (
      <Card pad={32}>
        <p className="text-center text-sm text-ink-3">Belum ada materi pada kelas ini.</p>
      </Card>
    );
  }

  const meta = TYPE_META[activeLesson.type];
  const done = doneSet.has(activeLesson.id);

  return (
    <div className="view-enter">
      <Link href="/learning" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2">
        <Icons.chevL size={17} />
        Kembali ke Pembelajaran
      </Link>

      {/* header */}
      <div
        className="relative mb-5 overflow-hidden rounded-[22px] p-6 text-white lg:p-8"
        style={{ background: `color-mix(in oklch, ${accent.color}, #000 20%)` }}
      >
        <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative">
          <span className="mono rounded-md bg-black/20 px-2.5 py-1 text-[12.5px] font-semibold">{courseCode(course.title)}</span>
          <h1 className="my-3 text-2xl font-extrabold tracking-tight lg:text-3xl">{course.title}</h1>
          <p className="max-w-[560px] text-[14.5px] leading-relaxed opacity-90">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Avatar initials={initialsFromName(course.teacher)} color="rgba(255,255,255,.25)" size={34} />
              <div>
                <div className="text-[13.5px] font-semibold">{course.teacher}</div>
                <div className="text-[11.5px] opacity-80">Pengajar</div>
              </div>
            </div>
            <div className="h-7 w-px bg-white/25" />
            <div className="text-[13.5px]">
              <strong>{course.students}</strong> siswa · <strong>{lessons.length}</strong> materi
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4.5 lg:grid-cols-[1fr_360px]" style={{ gap: 18 }}>
        {/* player / content */}
        <Card pad={0} className="overflow-hidden">
          <div
            className="grid aspect-video place-items-center border-b border-line bg-surface-2"
          >
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-white shadow-float" style={{ background: accent.color }}>
                {meta.icon({ size: 28 })}
              </div>
              <div className="mono mt-3.5 text-xs text-ink-3">
                [ {meta.label.toUpperCase()}
                {activeLesson.duration ? ` · ${activeLesson.duration}` : ""} ]
              </div>
            </div>
          </div>
          <div className="p-5.5" style={{ padding: 22 }}>
            <div className="flex flex-wrap items-start justify-between gap-3.5">
              <div>
                <Badge tone="primary">{meta.label}</Badge>
                <h2 className="mt-2.5 text-xl font-bold tracking-tight">{activeLesson.title}</h2>
              </div>
              <Button variant={done ? "soft" : "primary"} icon={<Icons.check2 size={17} />} disabled={pending} onClick={() => toggle(activeLesson.id)}>
                {done ? "Selesai" : "Tandai Selesai"}
              </Button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">
              {activeLesson.content ?? activeLesson.description ?? "Pelajari materi ini, lalu tandai selesai untuk melanjutkan progres belajarmu."}
            </p>
          </div>
        </Card>

        {/* lesson list */}
        <Card pad={18} className="lg:sticky lg:top-[18px]">
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-base font-bold">Daftar Materi</h3>
            <span className="text-[12.5px] font-semibold text-ink-3">
              {doneSet.size}/{lessons.length}
            </span>
          </div>
          <Progress value={pct} color={accent.color} />
          <div className="mt-4 flex max-h-[460px] flex-col gap-1 overflow-y-auto">
            {lessons.map((l, i) => {
              const lDone = doneSet.has(l.id);
              const isActive = l.id === activeId;
              const m = TYPE_META[l.type];
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveId(l.id)}
                  className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left transition ${
                    isActive ? "bg-primary-soft" : "hover:bg-surface-2"
                  }`}
                >
                  <div
                    className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg"
                    style={{
                      background: lDone ? "var(--green)" : isActive ? accent.color : "var(--surface-2)",
                      color: lDone || isActive ? "#fff" : m.tone,
                    }}
                  >
                    {lDone ? <Icons.check2 size={15} /> : m.icon({ size: 15 })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13.5px] font-semibold ${isActive ? "text-primary-700" : "text-ink"}`}>
                      {i + 1}. {l.title}
                    </div>
                    <div className="mt-px text-[11.5px] text-ink-3">
                      {m.label}
                      {l.duration ? ` · ${l.duration}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
