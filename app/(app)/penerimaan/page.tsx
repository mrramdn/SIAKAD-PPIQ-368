import { requireAdmin } from "@/lib/auth";
import { getAdmissions } from "@/lib/lms";
import { AdmissionReview } from "./AdmissionReview";

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default async function PenerimaanPage() {
  await requireAdmin();
  const admissions = await getAdmissions();

  const rows = admissions.map((a) => ({
    id: a.id,
    childName: a.childName,
    level: a.level,
    gender: a.gender,
    birthPlace: a.birthPlace,
    birthDate: a.birthDate ? dateFmt.format(a.birthDate) : null,
    previousSchool: a.previousSchool,
    parentName: a.parentName,
    parentPhone: a.parentPhone,
    parentEmail: a.parentEmail,
    address: a.address,
    note: a.note,
    status: a.status,
    createdAt: dateFmt.format(a.createdAt),
  }));

  return <AdmissionReview admissions={rows} />;
}
