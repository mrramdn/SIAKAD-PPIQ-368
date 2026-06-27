import { redirect } from "next/navigation";

// Pendaftaran mandiri santri dihapus. Alurnya kini lewat pendaftaran santri baru.
export default function RegisterPage() {
  redirect("/pendaftaran");
}
