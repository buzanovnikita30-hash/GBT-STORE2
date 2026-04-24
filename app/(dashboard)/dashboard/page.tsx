import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Личный кабинет" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username, email, created_at")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: chatsCount } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const allOrders = orders ?? [];
  const ordersCount = allOrders.length;
  const activeCount = allOrders.filter((o) =>
    ["active", "activating", "waiting_client"].includes(o.status)
  ).length;

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      username={profile?.username ?? null}
      profileCreatedAt={profile?.created_at ?? user.created_at ?? new Date().toISOString()}
      orders={allOrders}
      ordersCount={ordersCount}
      activeCount={activeCount}
      chatsCount={chatsCount ?? 0}
    />
  );
}
