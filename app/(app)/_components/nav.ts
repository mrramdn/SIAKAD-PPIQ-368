import type { IconKey } from "@/components/ui";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export type NavItem = { href: string; label: string; icon: IconKey };

const COMMON: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

export function navFor(role: Role): NavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/dashboard", label: "Dasbor", icon: "grid" },
      { href: "/pengguna", label: "Pengguna", icon: "users" },
      { href: "/learning", label: "Pembelajaran", icon: "book" },
      { href: "/nilai", label: "Nilai", icon: "chart" },
      { href: "/absen", label: "Absensi", icon: "check2" },
      { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
    ];
  }
  return COMMON;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  TEACHER: "Guru",
  STUDENT: "Siswa",
};

export const ROLE_BLURB: Record<Role, string> = {
  ADMIN: "Kelola pengguna, kelas, dan seluruh data LMS.",
  TEACHER: "Nilai tugas, catat kehadiran, dan kelola materi kelas.",
  STUDENT: "Akses materi, lihat nilai, dan rekap kehadiranmu.",
};

export const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/pengguna": "Manajemen Pengguna",
  "/learning": "Pembelajaran",
  "/nilai": "Nilai",
  "/absen": "Absensi",
  "/pengaturan": "Pengaturan",
};
