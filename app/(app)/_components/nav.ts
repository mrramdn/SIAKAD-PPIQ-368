import type { IconKey } from "@/components/ui";
import { permissionsFor, ROLE_BLURB, ROLE_LABEL, type Permission, type Role } from "@/lib/permissions";

export type { Role };
export { ROLE_BLURB, ROLE_LABEL };

export type NavItem = { href: string; label: string; icon: IconKey; permission: Permission | null };

// Canonical order. Some routes (permission-dependent label) appear twice; navFor()
// dedupes by href keeping the first match, so list the higher-privilege variant first.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dasbor", icon: "grid", permission: null },
  { href: "/penerimaan", label: "Pendaftaran", icon: "doc", permission: "admission.review" },
  { href: "/pengguna", label: "Pengguna", icon: "users", permission: "user.manage" },
  { href: "/anak", label: "Anak Saya", icon: "users", permission: "child.monitor" },
  { href: "/pendaftaran", label: "Daftar Anak", icon: "doc", permission: "admission.submit" },
  { href: "/jadwal", label: "Jadwal & Mapel", icon: "calendar", permission: "course.view" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar", permission: "schedule.view.own" },
  { href: "/absen", label: "Absensi Santri", icon: "check2", permission: "attendance.record" },
  { href: "/nilai", label: "Nilai", icon: "chart", permission: "grade.manage" },
  { href: "/rapor", label: "Rapor", icon: "award", permission: "report.manage" },
  { href: "/rapor", label: "Penerimaan Rapor", icon: "award", permission: "report.distribute" },
  { href: "/absen-ustadz", label: "Absensi Ustadz", icon: "users", permission: "staff_attendance.view" },
  { href: "/informasi", label: "Informasi", icon: "bell", permission: "announcement.view" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings", permission: null },
];

export function navFor(roles: readonly Role[]): NavItem[] {
  const granted = permissionsFor(roles);
  const seen = new Set<string>();
  const items: NavItem[] = [];

  for (const item of NAV_ITEMS) {
    if (item.permission !== null && !granted.has(item.permission)) continue;
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    items.push(item);
  }

  return items;
}

export const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/penerimaan": "Pendaftaran Santri",
  "/pengguna": "Manajemen Pengguna",
  "/anak": "Anak Saya",
  "/pendaftaran": "Pendaftaran Anak",
  "/informasi": "Informasi",
  "/nilai": "Nilai",
  "/absen": "Absensi Santri",
  "/absen-ustadz": "Absensi Ustadz",
  "/jadwal": "Jadwal & Mata Pelajaran",
  "/rapor": "Rapor",
  "/pengaturan": "Pengaturan",
};
