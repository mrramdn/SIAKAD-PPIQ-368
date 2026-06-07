import { requireVerifiedUser } from "@/lib/auth";
import { Shell } from "./_components/Shell";
import type { Role } from "./_components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerifiedUser();

  return (
    <Shell user={{ name: user.name, email: user.email, role: user.role as Role }}>
      {children}
    </Shell>
  );
}
