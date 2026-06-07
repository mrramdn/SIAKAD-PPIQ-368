import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getProfile } from "@/lib/lms";
import { ProfileForm } from "./ProfileForm";

export default async function PengaturanPage() {
  const user = await requireVerifiedUser();
  const profile = await getProfile(user.id);
  if (!profile) notFound();

  return (
    <ProfileForm
      profile={{
        name: profile.name,
        email: profile.email,
        role: profile.role,
        className: profile.profile?.className ?? null,
        phone: profile.profile?.phone ?? null,
        isStudent: profile.role === "STUDENT",
      }}
    />
  );
}
