import { getAdmissionDecisionNotifications } from "@/lib/admissions";
import { requireVerifiedUser, userCan } from "@/lib/auth";
import { Shell } from "./_components/Shell";
import type { Role } from "./_components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerifiedUser();
  const admissionNotifications = userCan(user, "child.monitor")
    ? await getAdmissionDecisionNotifications(user.id)
    : [];

  const notifications = admissionNotifications.flatMap((admission) => {
    if (!admission.reviewedAt) return [];

    const accepted = admission.status === "ACCEPTED";
    return [{
      id: admission.id,
      title: accepted ? "Pendaftaran diterima" : "Pendaftaran ditolak",
      message: accepted
        ? `Pendaftaran ${admission.childName} diterima. Buka untuk melihat NIS dan catatan administrasi.`
        : `Pendaftaran ${admission.childName} belum dapat diterima. Buka untuk melihat catatan administrasi.`,
      registrationCode: admission.registrationCode,
      tone: accepted ? "success" as const : "danger" as const,
      createdAt: admission.reviewedAt.toISOString(),
      read: admission.notificationReadAt !== null,
      href: "/anak#status-pendaftaran",
    }];
  });

  return (
    <Shell user={{ name: user.name, email: user.email, roles: user.roles as Role[] }} notifications={notifications}>
      {children}
    </Shell>
  );
}
