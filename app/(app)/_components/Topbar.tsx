"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Icons, initialsFromName } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { sortRoles } from "@/lib/permissions";
import { pageTitleFor, ROLE_LABEL, type Role } from "./nav";

export function Topbar({
  user,
  onMenu,
}: {
  user: { name: string; email: string; roles: Role[] };
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = pageTitleFor(pathname, user.roles, APP_NAME);
  const initials = initialsFromName(user.name);
  const roleLabel = sortRoles(user.roles)
    .map((r) => ROLE_LABEL[r])
    .join(" + ");

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-3.5 border-b border-line bg-[color-mix(in_oklch,var(--surface),transparent_18%)] px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-2 lg:hidden"
        aria-label="Buka menu"
      >
        <Icons.menu size={20} />
      </button>

      <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-full border border-line bg-surface p-1 pr-2 transition hover:bg-surface-2"
          >
            <Avatar initials={initials} color="var(--primary)" size={32} />
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-[13px] font-bold">{user.name}</div>
              <div className="text-[11px] text-ink-3">{roleLabel}</div>
            </div>
            <Icons.chevD size={16} style={{ color: "var(--text-3)" }} />
          </button>

          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-[70]" onClick={() => setMenuOpen(false)} />
              <div className="pop-enter absolute right-0 top-[calc(100%+8px)] z-[80] w-60 rounded-xl border border-line bg-surface p-2 shadow-float">
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">Akun</div>
                <div className="px-2.5 pb-2">
                  <div className="truncate text-[13px] font-bold">{user.name}</div>
                  <div className="truncate text-[11.5px] text-ink-3">{user.email}</div>
                </div>
                <div className="my-1.5 h-px bg-line" />
                <Link
                  href="/pengaturan"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-ink-2 hover:bg-surface-2"
                >
                  <Icons.settings size={18} style={{ color: "var(--text-3)" }} />
                  Pengaturan
                </Link>
                <form action="/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-ink-2 hover:bg-surface-2"
                  >
                    <Icons.logout size={18} style={{ color: "var(--text-3)" }} />
                    Keluar
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
