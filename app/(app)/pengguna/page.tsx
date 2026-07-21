import { requireAdmin } from "@/lib/auth";
import { getManagedUsers } from "@/lib/lms";
import { UserManager } from "./UserManager";

export default async function PenggunaPage() {
  const user = await requireAdmin();
  const users = await getManagedUsers();

  return (
    <UserManager
      adminId={user.id}
      readOnly={false}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
      }))}
    />
  );
}
