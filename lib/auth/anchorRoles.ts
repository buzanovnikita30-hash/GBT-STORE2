import type { UserRole } from "@/types/database";

import { isSuperAdminEmail } from "@/lib/auth/superAdmin";

/**
 * Якоря для staff-peer и dev (не супер-админ). Супер-админ — lib/auth/superAdmin.ts.
 */
export const ANCHOR_ADMIN_EMAIL = "nikitabuzanov15@mail.ru" as const;
/** Плейсхолдер для dev; реальный оператор — существующий профиль или OPERATOR_EMAILS. */
export const ANCHOR_OPERATOR_EMAIL = "dev+staff-operator@local.test" as const;

export function normalizeAuthEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Только жёстко заданные admin/operator; остальные — null. */
export function resolveAnchorRoleFromEmail(
  email: string | null | undefined
): Extract<UserRole, "admin" | "operator"> | null {
  if (isSuperAdminEmail(email)) return "admin";
  const n = normalizeAuthEmail(email);
  if (n === normalizeAuthEmail(ANCHOR_ADMIN_EMAIL)) return "admin";
  if (ANCHOR_OPERATOR_EMAIL && n === normalizeAuthEmail(ANCHOR_OPERATOR_EMAIL)) return "operator";
  return null;
}

/** Согласованная роль для UI, если профиль в БД ещё не обновился после sync. */
export function resolveClientNavRole(
  email: string | null | undefined,
  profileRole: UserRole
): UserRole {
  return resolveAnchorRoleFromEmail(email) ?? profileRole;
}
