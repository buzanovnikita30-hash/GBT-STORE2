import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { SettingsForm } from "./SettingsForm";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export const metadata: Metadata = { title: "Admin · Настройки" };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*");

  const settingsMap: Record<string, unknown> = {};
  (settings ?? []).forEach((s) => { settingsMap[s.key] = s.value; });

  return (
    <div className="p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-gray-100">Настройки сайта</h1>
      <div className="max-w-lg">
        <SettingsForm initialSettings={settingsMap} />
      </div>
    </div>
  );
}
