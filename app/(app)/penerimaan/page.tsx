import { getAdmissionsForReview, toAdmissionDocumentViews } from "@/lib/admissions";
import { requirePermission } from "@/lib/auth";
import { AdmissionReview } from "./AdmissionReview";

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default async function PenerimaanPage() {
  await requirePermission("admission.review");
  const admissions = await getAdmissionsForReview();

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
    documents: toAdmissionDocumentViews(a),
  }));

  return <AdmissionReview admissions={rows} />;
}
