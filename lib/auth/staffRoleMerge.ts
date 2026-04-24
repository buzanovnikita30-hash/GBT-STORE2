import type { UserRole } from "@/types/database";

/** Выдача staff-роли: админ не понижается до оператора. */
export function roleAfterGrant(current: UserRole, grant: "admin" | "operator"): UserRole {
  if (grant === "admin") return "admin";
  return current === "admin" ? "admin" : "operator";
}
