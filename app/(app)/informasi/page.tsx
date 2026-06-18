import { requireVerifiedUser } from "@/lib/auth";
import { getAnnouncements, getParentLevels } from "@/lib/lms";
import { AnnouncementBoard } from "./AnnouncementBoard";

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default async function InformasiPage() {
  const user = await requireVerifiedUser();
  const isParent = user.role === "PARENT";
  const levels = isParent ? await getParentLevels(user.id) : null;
  const items = await getAnnouncements(levels);
  const canManage = user.role === "ADMIN" || user.role === "TEACHER";

  const rows = items.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    level: a.level,
    pinned: a.pinned,
    author: a.author?.name ?? "Sekolah",
    createdAt: dateFmt.format(a.createdAt),
  }));

  return <AnnouncementBoard items={rows} canManage={canManage} />;
}
