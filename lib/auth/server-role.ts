import type { User } from "@supabase/supabase-js";

import { effectiveRoleFromProfile } from "@/lib/auth/superAdmin";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function resolveServerRole(user: User | null): Promise<UserRole> {
  if (!user) return "client";

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return effectiveRoleFromProfile(data?.role ?? null, user.email);
  } catch {
    return effectiveRoleFromProfile(null, user.email);
  }
}

export async function isServerAdmin(user: User | null): Promise<boolean> {
  return (await resolveServerRole(user)) === "admin";
}
