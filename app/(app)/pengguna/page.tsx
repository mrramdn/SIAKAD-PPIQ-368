import { UserRole } from "@/generated/prisma/client";
import { requireAdminOrMudir } from "@/lib/auth";
import { getManagedUsers } from "@/lib/lms";
import { UserManager } from "./UserManager";

export default async function PenggunaPage() {
  const user = await requireAdminOrMudir();
  const users = await getManagedUsers();

  return (
    <UserManager
      adminId={user.id}
      readOnly={user.role === UserRole.MUDIR}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        className: u.profile?.className ?? null,
        level: u.profile?.level ?? null,
      }))}
    />
  );
}
