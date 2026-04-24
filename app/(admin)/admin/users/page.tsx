import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";
import { UsersRoleManager } from "./UsersRoleManager";

export const metadata: Metadata = { title: "Admin · Пользователи" };

export default async function AdminUsersPage() {
  await requireAdminPage();

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = (users ?? []).map((u) => u.id);
  const { data: orders } = userIds.length
    ? await supabase
        .from("orders")
        .select("id, user_id, price, status, created_at")
        .in("user_id", userIds)
    : { data: [] };

  const ordersByUser = new Map<string, { count: number; paidTotal: number; lastOrderAt: string | null }>();
  for (const o of orders ?? []) {
    const key = o.user_id ?? "";
    if (!key) continue;
    const prev = ordersByUser.get(key) ?? { count: 0, paidTotal: 0, lastOrderAt: null };
    prev.count += 1;
    if (["paid", "activating", "active", "waiting_client"].includes(o.status ?? "")) {
      prev.paidTotal += Number(o.price ?? 0);
    }
    if (!prev.lastOrderAt || new Date(o.created_at).getTime() > new Date(prev.lastOrderAt).getTime()) {
      prev.lastOrderAt = o.created_at;
    }
    ordersByUser.set(key, prev);
  }

  const preparedUsers = (users ?? []).map((u) => ({
    ...u,
    role: (u.role ?? "client") as "client" | "operator" | "admin",
    ordersCount: ordersByUser.get(u.id)?.count ?? 0,
    paidTotal: ordersByUser.get(u.id)?.paidTotal ?? 0,
    lastOrderAt: ordersByUser.get(u.id)?.lastOrderAt ?? null,
  }));

  return (
    <div className="p-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-100">Пользователи</h1>
      <p className="mb-5 text-sm text-gray-400">
        Здесь можно назначить оператора, передать права администратора и просмотреть клиентов.
      </p>
      <UsersRoleManager users={preparedUsers} currentUserId={user?.id ?? ""} />
    </div>
  );
}
