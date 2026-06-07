"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Card, Icons, Progress, courseAccent, courseCode, initialsFromName } from "@/components/ui";

export type CourseCard = {
  id: string;
  title: string;
  description: string;
  teacher: string;
  lessons: number;
  students: number;
  progress: number;
};

const FILTERS = ["Semua", "Berjalan", "Selesai"] as const;

export function CourseCards({ courses }: { courses: CourseCard[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Semua");

  const list = courses.filter((c) => {
    if (filter === "Berjalan") return c.progress < 100;
    if (filter === "Selesai") return c.progress >= 100;
    return true;
  });

  return (
    <>
      <div className="mb-5 flex justify-end">
        <div className="flex gap-2 rounded-full border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                filter === f ? "bg-primary text-white" : "text-ink-2"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card pad={40}>
          <p className="text-center text-sm text-ink-3">Tidak ada kelas pada filter ini.</p>
        </Card>
      ) : (
        <div className="grid gap-4.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {list.map((c) => {
            const accent = courseAccent(c.id);
            const done = c.progress >= 100;
            return (
              <Link key={c.id} href={`/learning/${c.id}`} className="block">
                <Card hover pad={0} className="overflow-hidden">
                  <div
                    className="relative flex h-24 items-end p-4"
                    style={{ background: `color-mix(in oklch, ${accent.color}, #000 18%)` }}
                  >
                    <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-white/10" />
                    <div className="relative flex w-full items-end justify-between">
                      <span className="mono rounded-md bg-black/20 px-2.5 py-1 text-xs font-semibold text-white">{courseCode(c.title)}</span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                          <Icons.check2 size={13} />
                          Selesai
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-4.5" style={{ padding: 18 }}>
                    <h3 className="text-[17px] font-bold tracking-tight">{c.title}</h3>
                    <p className="mt-1.5 line-clamp-2 min-h-[38px] text-[13px] leading-relaxed text-ink-3">{c.description}</p>
                    <div className="my-3 flex items-center gap-2">
                      <Avatar initials={initialsFromName(c.teacher)} color={accent.color} size={28} />
                      <span className="text-[13px] font-medium text-ink-2">{c.teacher}</span>
                    </div>
                    <div className="mb-1.5 flex justify-between text-[12.5px] font-semibold text-ink-3">
                      <span>{Math.round((c.progress / 100) * c.lessons)}/{c.lessons} materi</span>
                      <span>{c.progress}%</span>
                    </div>
                    <Progress value={c.progress} color={accent.color} />
                    <div className="mt-3.5 flex gap-4 text-[12.5px] text-ink-3">
                      <span className="flex items-center gap-1.5">
                        <Icons.users size={15} />
                        {c.students}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icons.book size={15} />
                        {c.lessons} materi
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
