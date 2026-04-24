import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OperatorPanel } from "@/components/chat/OperatorPanel";
import { resolveServerRole } from "@/lib/auth/server-role";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Чат с клиентами" };

export default async function AdminChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/admin/chat");
  }

  const role = await resolveServerRole(user);
  if (role !== "admin" && role !== "operator") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id, email, username, telegram_id, telegram_username, role, created_at, last_seen")
    .eq("id", user.id)
    .single();

  if (!profileRow) {
    redirect("/login?returnUrl=/admin/chat");
  }

  const profile = { ...profileRow, role } as Profile;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col p-4 md:p-6">
      <h1 className="mb-4 font-heading text-2xl font-bold text-gray-100">Чат с клиентами</h1>
      <div className="min-h-0 flex-1">
        <OperatorPanel currentUser={profile} />
      </div>
    </div>
  );
}
