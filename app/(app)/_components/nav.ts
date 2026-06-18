import type { IconKey } from "@/components/ui";

export type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

export type NavItem = { href: string; label: string; icon: IconKey };

const PARENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/anak", label: "Anak Saya", icon: "users" },
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const TEACHER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid" },
  { href: "/learning", label: "Pembelajaran", icon: "book" },
  { href: "/nilai", label: "Nilai", icon: "chart" },
  { href: "/absen", label: "Absensi", icon: "check2" },
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
  { href: "/informasi", label: "Informasi", icon: "bell" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

export function navFor(role: Role): NavItem[] {
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "PARENT") return PARENT_NAV;
  if (role === "TEACHER") return TEACHER_NAV;
  // Siswa tidak memakai aplikasi; tampilkan menu minimal bila terlanjur login.
  return [
    { href: "/dashboard", label: "Dasbor", icon: "grid" },
    { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
  ];
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  TEACHER: "Guru",
  PARENT: "Orang Tua",
  STUDENT: "Siswa",
};

export const ROLE_BLURB: Record<Role, string> = {
  ADMIN: "Kelola pendaftaran, pengguna, kelas, dan informasi pesantren.",
  TEACHER: "Catat kehadiran, isi nilai, dan kirim informasi ke wali santri.",
  PARENT: "Pantau nilai, kehadiran, dan informasi terbaru anak Anda.",
  STUDENT: "Akun santri sebagai data; aktivitas dipantau oleh wali.",
};

export const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/penerimaan": "Pendaftaran Santri",
  "/pengguna": "Manajemen Pengguna",
  "/anak": "Anak Saya",
  "/informasi": "Informasi",
  "/learning": "Pembelajaran",
  "/nilai": "Nilai",
  "/absen": "Absensi",
  "/pengaturan": "Pengaturan",
};
