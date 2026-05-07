import { listActiveCareers } from "@/features/careers/career.service";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const careers = await listActiveCareers();

  return successResponse("Daftar karir berhasil diambil", careers);
}
