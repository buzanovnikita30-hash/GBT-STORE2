import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin · Главная" };

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: activeOrders },
    { count: openChats },
    { count: pendingReviews },
    { count: totalClients },
    { data: clientRows },
    { count: unreadClientMsgs },
  ] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    admin.from("profiles").select("id").eq("role", "client").limit(2000),
    admin
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", "client")
      .eq("is_read", false),
  ]);

  const clientIds = (clientRows ?? []).map((r) => r.id);
  let withPurchase = 0;
  let inWaiting = 0;
  let noPurchase = 0;
  let revenue = 0;

  if (clientIds.length) {
    const { data: ord } = await admin
      .from("orders")
      .select("user_id, status, price")
      .in("user_id", clientIds);

    const byUser = new Map<string, Set<string>>();
    for (const o of ord ?? []) {
      if (!o.user_id) continue;
      const set = byUser.get(o.user_id) ?? new Set();
      set.add(o.status);
      byUser.set(o.user_id, set);
      if (["paid", "activating", "active", "waiting_client"].includes(o.status)) {
        revenue += Number(o.price ?? 0);
      }
    }

    for (const id of clientIds) {
      const st = byUser.get(id);
      if (!st || st.size === 0) {
        noPurchase += 1;
        continue;
      }
      if (st.has("active")) withPurchase += 1;
      else if (
        [...st].some((s) => ["pending", "paid", "activating", "waiting_client"].includes(s))
      ) {
        inWaiting += 1;
      } else {
        noPurchase += 1;
      }
    }
  }

  const stats = [
    { label: "Клиентов", value: totalClients ?? 0, color: "text-gray-100" },
    { label: "С покупкой (активная)", value: withPurchase, color: "text-[#10a37f]" },
    { label: "В ожидании / в работе", value: inWaiting, color: "text-amber-400" },
    { label: "Без покупки", value: noPurchase, color: "text-gray-400" },
    { label: "Заказов всего", value: totalOrders ?? 0, color: "text-gray-100" },
    { label: "Ожидают оплаты", value: pendingOrders ?? 0, color: "text-amber-400" },
    { label: "Активных подписок", value: activeOrders ?? 0, color: "text-[#10a37f]" },
    { label: "Выручка (оценка)", value: `${revenue.toLocaleString("ru")} ₽`, color: "text-emerald-300" },
    { label: "Открытые чаты", value: openChats ?? 0, color: "text-blue-400" },
    { label: "Непрочитано от клиентов", value: unreadClientMsgs ?? 0, color: "text-orange-300" },
    { label: "Отзывы на модерации", value: pendingReviews ?? 0, color: "text-purple-400" },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-gray-100">Панель администратора</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.08] bg-gray-900 p-4">
            <p className={`font-heading text-2xl font-bold md:text-3xl ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-gray-500">
        Выручка суммирует заказы со статусами оплачено и далее по всем клиентам в выборке. Точный учёт —
        в бухгалтерии / платёжном провайдере.
      </p>
    </div>
  );
}
