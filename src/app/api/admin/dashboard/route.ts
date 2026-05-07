import { getAdminDashboardSummary } from "@/features/admin/monitoring.service";
import { requireAdmin } from "@/lib/admin";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const summary = await getAdminDashboardSummary();

  return successResponse("Ringkasan dashboard admin berhasil diambil", summary);
}
