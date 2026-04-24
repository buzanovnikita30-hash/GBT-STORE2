import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveRoleByEmail } from "@/lib/auth/resolveRole";
import { resolveServerRole } from "@/lib/auth/server-role";
import { effectiveRoleFromProfile } from "@/lib/auth/superAdmin";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = { title: "Admin · Клиенты" };
const ROLE_PRIORITY: Record<UserRole, number> = { admin: 0, operator: 1, client: 2 };

const STAGE_RU: Record<string, string> = {
  purchased: "Купил",
  waiting: "В ожидании",
  no_purchase: "Не покупал",
  needs_help: "Нужна помощь",
  other: "Другое",
};

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string; role?: "all" | "client" | "operator" | "admin" }>;
}) {
  const { highlight, role: roleFilterRaw } = await searchParams;
  const roleFilter =
    roleFilterRaw === "client" || roleFilterRaw === "operator" || roleFilterRaw === "admin"
      ? roleFilterRaw
      : "all";
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  const role = await resolveServerRole(user);
  if (role !== "admin" && role !== "operator") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  // 1) Профили (совместимо со схемой, где client_stage может отсутствовать)
  let profilesError: { message: string } | null = null;
  let profileRows:
    | {
        id: string;
        email: string | null;
        username: string | null;
        telegram_id: number | null;
        telegram_username: string | null;
        role: UserRole;
        created_at: string;
        last_seen: string | null;
        notes: string | null;
        tags: string[] | null;
        client_stage: string | null;
      }[]
    | null = null;

  const fullSelect = await admin
    .from("profiles")
    .select(
      "id, email, username, telegram_id, telegram_username, role, created_at, last_seen, notes, tags, client_stage"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (fullSelect.error?.message?.includes("client_stage")) {
    const fallbackSelect = await admin
      .from("profiles")
      .select("id, email, username, telegram_id, telegram_username, role, created_at, last_seen, notes, tags")
      .order("created_at", { ascending: false })
      .limit(500);
    profilesError = fallbackSelect.error ? { message: fallbackSelect.error.message } : null;
    profileRows = (fallbackSelect.data ?? []).map((p) => ({ ...p, client_stage: null }));
  } else {
    profilesError = fullSelect.error ? { message: fullSelect.error.message } : null;
    profileRows = fullSelect.data ?? null;
  }

  const profiles = profileRows ?? [];

  // 2) Auth users — чтобы видеть все аккаунты даже если profile отсутствует
  const authUsers: { id: string; email: string | null; created_at: string | null }[] = [];
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) break;
    const list = data.users ?? [];
    if (!list.length) break;
    for (const u of list) {
      authUsers.push({ id: u.id, email: u.email ?? null, created_at: u.created_at ?? null });
    }
    if (list.length < 100) break;
    page += 1;
  }

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const mergedRows = authUsers.map((au) => {
    const p = profileById.get(au.id);
    const email = p?.email ?? au.email ?? null;
    const fromProfile = effectiveRoleFromProfile((p?.role ?? null) as UserRole | null, email);
    const byEmail = resolveRoleByEmail(email);
    const role: UserRole = fromProfile === "client" && byEmail !== "client" ? byEmail : fromProfile;
    return {
      id: au.id,
      email,
      username: p?.username ?? null,
      telegram_id: p?.telegram_id ?? null,
      telegram_username: p?.telegram_username ?? null,
      role,
      created_at: p?.created_at ?? au.created_at ?? new Date(0).toISOString(),
      last_seen: p?.last_seen ?? null,
      notes: p?.notes ?? null,
      tags: p?.tags ?? [],
      client_stage: p?.client_stage ?? null,
      has_profile: Boolean(p),
    };
  });

  const clients = mergedRows
    .filter((r) => r.id !== (user?.id ?? ""))
    .filter((r) => (roleFilter === "all" ? true : r.role === roleFilter))
    .sort((a, b) => {
      const rp = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
      if (rp !== 0) return rp;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const ids = (clients ?? []).map((c) => c.id);
  const { data: orders } = ids.length
    ? await admin
        .from("orders")
        .select("user_id, status, plan_id, price, created_at")
        .in("user_id", ids)
    : { data: [] };

  const ordersByUser = new Map<string, typeof orders>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const arr = ordersByUser.get(o.user_id) ?? [];
    arr.push(o);
    ordersByUser.set(o.user_id, arr);
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-100">Клиенты</h1>
      <p className="mb-6 text-sm text-gray-400">
        Все аккаунты по ролям + все сохранённые клиентские поля из профиля и заказов.
      </p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {[
          { key: "all", label: "Все" },
          { key: "client", label: "Клиенты" },
          { key: "operator", label: "Операторы" },
          { key: "admin", label: "Админы" },
        ].map((f) => {
          const active = roleFilter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/clients" : `/admin/clients?role=${f.key}`}
              className={
                active
                  ? "rounded-full border border-[#10a37f]/50 bg-[#10a37f]/20 px-3 py-1 text-[#7df0ce]"
                  : "rounded-full border border-white/10 px-3 py-1 text-gray-400 hover:text-gray-200"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[1320px] text-left text-sm text-gray-300">
          <thead className="border-b border-white/[0.08] bg-gray-900/80 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Telegram</th>
              <th className="px-4 py-3">Профиль</th>
              <th className="px-4 py-3">Регистрация</th>
              <th className="px-4 py-3">Был в сети</th>
              <th className="px-4 py-3">Этап</th>
              <th className="px-4 py-3">Заказы</th>
              <th className="px-4 py-3">Активная</th>
              <th className="px-4 py-3">Теги</th>
              <th className="px-4 py-3">Заметка</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {(clients ?? []).map((c) => {
              const list = ordersByUser.get(c.id) ?? [];
              const active = list.find((o) => o.status === "active");
              const hasPaid = list.some((o) =>
                ["paid", "activating", "active", "waiting_client"].includes(o.status)
              );
              const stageKey = c.client_stage ?? (hasPaid ? "purchased" : list.length ? "waiting" : "no_purchase");
              const stageLabel = STAGE_RU[stageKey] ?? stageKey;
              const rowHi = highlight === c.id ? "bg-[#10a37f]/10" : "";

              return (
                <tr key={c.id} className={rowHi}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-100">{c.username ?? "—"}</p>
                    <p className="text-xs text-gray-500">{c.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{c.role}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {c.telegram_username ? `@${c.telegram_username}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.has_profile ? (
                      <span className="text-emerald-300">есть</span>
                    ) : (
                      <span className="text-amber-300">нет (только auth)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("ru")}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {c.last_seen ? new Date(c.last_seen).toLocaleString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{stageLabel}</td>
                  <td className="px-4 py-3 text-xs">{list.length}</td>
                  <td className="px-4 py-3 text-xs">
                    {active ? `${active.plan_id} (active)` : "—"}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-gray-400">
                    {c.tags?.length ? c.tags.join(", ") : "—"}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-gray-400">
                    {c.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/admin/chat"
                      className="inline-flex items-center gap-1 text-[#10a37f] hover:underline"
                    >
                      <MessageCircle size={14} />
                      Чат
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {profilesError ? null : null}
        {(!clients || clients.length === 0) && (
          <p className="p-6 text-sm text-gray-500">Аккаунтов по выбранному фильтру пока нет</p>
        )}
      </div>
    </div>
  );
}
