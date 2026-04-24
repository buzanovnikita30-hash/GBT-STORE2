import type { UserRole } from "@/types/database";

/** Нельзя снять роль администратора через UI/API (источник в коде, не в .env). */
export const SUPER_ADMIN_EMAIL = "nbuzanov0@mail.ru" as const;

export function normalizeAuthEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return normalizeAuthEmail(email) === normalizeAuthEmail(SUPER_ADMIN_EMAIL);
}

/** Эффективная роль для доступа: БД + исключение супер-админа. */
export function effectiveRoleFromProfile(
  profileRole: UserRole | null | undefined,
  email: string | null | undefined
): UserRole {
  if (isSuperAdminEmail(email)) return "admin";
  if (profileRole === "admin" || profileRole === "operator" || profileRole === "client") {
    return profileRole;
  }
  return "client";
}
