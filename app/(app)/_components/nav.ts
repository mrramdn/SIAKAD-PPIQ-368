import type { IconKey } from "@/components/ui";

export type Role = "ADMIN" | "TEACHER" | "HOMEROOM" | "MUDIR" | "PARENT";

export type NavItem = { href: string; label: string; icon: IconKey };

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/anak", label: "Anak Saya", icon: "users" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/pendaftaran", label: "Daftar Anak", icon: "doc" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const TEACHER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
  { href: "/rapor", label: "Rapor", icon: "award" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const HOMEROOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
  { href: "/rapor", label: "Rapor", icon: "award" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/penerimaan", label: "Pendaftaran", icon: "doc" },
  { href: "/pengguna", label: "Pengguna", icon: "users" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
  { href: "/rapor", label: "Rapor", icon: "award" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const MUDIR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/pengguna", label: "Pengguna", icon: "users" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
  { href: "/rapor", label: "Rapor", icon: "award" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

export function navFor(role: Role): NavItem[] {
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "MUDIR") return MUDIR_NAV;
  if (role === "PARENT") return PARENT_NAV;
  if (role === "HOMEROOM") return HOMEROOM_NAV;
  if (role === "TEACHER") return TEACHER_NAV;
  return PARENT_NAV;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrasi",
  TEACHER: "Pengajar",
  HOMEROOM: "Wali Kelas",
  MUDIR: "Mudir Ma'had",
  PARENT: "Wali Santri",
};

export const ROLE_BLURB: Record<Role, string> = {
  ADMIN: "Kelola pendaftaran, pengguna, kelas, dan informasi pesantren.",
  TEACHER: "Kelola materi, nilai, absensi, dan informasi pembelajaran.",
  HOMEROOM: "Pantau kelas binaan dan bantu pengelolaan nilai, absensi, dan informasi.",
  MUDIR: "Pantau data pengguna, pembelajaran, nilai, absensi, dan informasi.",
  PARENT: "Pantau nilai, kehadiran, dan informasi terbaru anak Anda.",
};

export const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/penerimaan": "Pendaftaran Santri",
  "/pengguna": "Manajemen Pengguna",
  "/anak": "Anak Saya",
  "/pendaftaran": "Pendaftaran Anak",
  "/informasi": "Informasi",
  "/learning": "Pembelajaran",
  "/nilai": "Nilai",
  "/absen": "Absensi",
  "/jadwal": "Jadwal",
  "/rapor": "Rapor",
  "/pengaturan": "Pengaturan",
};
