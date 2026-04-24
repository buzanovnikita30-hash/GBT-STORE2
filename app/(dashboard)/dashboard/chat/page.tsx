import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { resolveServerRole } from "@/lib/auth/server-role";
import { getOrCreateClientOperatorSession } from "@/lib/chat/operatorSession";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import type { ChatRoomListItem } from "@/types/chat-ui";

export const metadata: Metadata = { title: "Чат поддержки" };

function deriveRoomStatus(
  status: "open" | "closed",
  first_message_at: string | null,
  last_operator_reply_at: string | null
): ChatRoomListItem["status"] {
  if (status === "closed") return "closed";
  if (first_message_at && !last_operator_reply_at) return "waiting";
  return "open";
}

export default async function DashboardChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/dashboard/chat");
  }

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id, email, username, telegram_id, telegram_username, role, created_at, last_seen")
    .eq("id", user.id)
    .single();

  if (!profileRow) {
    redirect("/login?returnUrl=/dashboard/chat");
  }

  const staffRole = await resolveServerRole(user);
  if (staffRole === "admin") {
    redirect("/admin/chat");
  }
  if (staffRole === "operator") {
    redirect("/admin/chat");
  }

  const profile = profileRow as Profile;

  const session = await getOrCreateClientOperatorSession(admin, user.id);
  if (!session?.id) {
    return (
      <div className="flex min-h-[calc(100dvh-7rem)] w-full items-center justify-center px-4 text-center text-gray-500 md:min-h-[calc(100vh-7rem)]">
        Не удалось открыть чат. Попробуйте позже.
      </div>
    );
  }

  const { data: sessionMeta } = await admin
    .from("chat_sessions")
    .select("status, first_message_at, last_operator_reply_at")
    .eq("id", session.id)
    .single();

  const roomStatus = deriveRoomStatus(
    sessionMeta?.status === "closed" ? "closed" : "open",
    sessionMeta?.first_message_at ?? null,
    sessionMeta?.last_operator_reply_at ?? null
  );

  return (
    <div className="-mx-4 -mb-4 flex w-[calc(100%+2rem)] flex-col md:-mx-6 md:-mb-6 md:w-[calc(100%+3rem)] lg:-mx-8 lg:-mb-8 lg:w-[calc(100%+4rem)]">
      <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center md:min-h-screen">
        <div className="flex h-full w-full min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-white md:min-h-screen md:border-x md:border-black/[0.07]">
          <ChatWindow
            currentUser={profile}
            sessionId={session.id}
            roomStatus={roomStatus}
            otherPartyName="GBT STORE — поддержка"
            viewerIsStaff={false}
          />
        </div>
      </div>
    </div>
  );
}
