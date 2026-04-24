import type { UserRole } from "@/types/database";

function parseEmails(value: string | undefined): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function canonicalEmail(email: string | null | undefined): string {
  return (email ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveRoleByEmail(email: string | null | undefined): UserRole {
  const normalized = email?.trim().toLowerCase();
  const canonical = canonicalEmail(email);

  // Точечное распределение ролей для локального E2E-теста
  // По запросу: buzanovnikita30@gmail.com всегда клиент.
  if (canonical === canonicalEmail("nikitabuzanov15@mailru")) return "admin";
  if (canonical === canonicalEmail("buzanovnikita30@gmailcom")) return "client";

  if (normalized) {
    const adminEmails = parseEmails(process.env.ADMIN_EMAILS);
    if (adminEmails.has(normalized)) return "admin";

    const operatorEmails = parseEmails(process.env.OPERATOR_EMAILS);
    if (operatorEmails.has(normalized)) return "operator";

    const clientEmails = parseEmails(process.env.CLIENT_EMAILS);
    if (clientEmails.has(normalized)) return "client";
  }

  return "client";
}

