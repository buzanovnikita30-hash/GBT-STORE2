import { resolveRoleByEmail } from "@/lib/auth/resolveRole";
import { isSuperAdminEmail } from "@/lib/auth/superAdmin";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

/**
 * Обновляет роль и last_seen в profiles по правилам env + super-admin.
 * Используется и после входа по API, и после OAuth/email callback на сервере.
 */
export async function syncProfileRoleForUser(userId: string, userEmail: string | null): Promise<UserRole> {
  const admin = createAdminClient();
  const { data: row } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const dbRole = (row?.role ?? "client") as UserRole;
  const envRole = resolveRoleByEmail(userEmail);

  let role: UserRole = dbRole;
  if (isSuperAdminEmail(userEmail)) {
    role = "admin";
  } else if (dbRole === "admin" || dbRole === "operator") {
    role = dbRole;
  } else {
    role = envRole;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      role,
      email: userEmail,
      last_seen: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to sync role");
  }

  return role;
}
