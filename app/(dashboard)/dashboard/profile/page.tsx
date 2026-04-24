import type { Metadata } from "next";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username, telegram_username, email, created_at")
    .eq("id", user.id)
    .single();

  const createdAt =
    profile?.created_at ??
    (typeof user.created_at === "string" ? user.created_at : "");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900">Профиль</h1>
      <ProfileForm
        initialData={{
          username: profile?.username ?? "",
          telegram_username: profile?.telegram_username ?? "",
          email: user.email ?? "",
          createdAt,
        }}
      />
    </div>
  );
}
