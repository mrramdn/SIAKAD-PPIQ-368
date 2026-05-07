import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/auth-options";

export function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}
