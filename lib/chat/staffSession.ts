import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

/** Канонический ключ пары staff: меньший uuid → user_id, больший → staff_peer_id */
export function canonicalStaffPair(a: string, b: string): { userId: string; peerId: string } {
  return a < b ? { userId: a, peerId: b } : { userId: b, peerId: a };
}

/**
 * Сессия админ ↔ оператор (не клиентский чат). Сообщения с тем же API, что support,
 * но session.type = 'staff' и получатель — только второй участник.
 */
export async function getOrCreateStaffSession(
  admin: Admin,
  requesterId: string,
  peerId: string
): Promise<{ id: string; status: "open" | "closed" } | null> {
  if (requesterId === peerId) return null;

  const { userId, peerId: canonPeer } = canonicalStaffPair(requesterId, peerId);

  let { data: row } = await admin
    .from("chat_sessions")
    .select("id, status")
    .eq("type", "staff")
    .eq("user_id", userId)
    .eq("staff_peer_id", canonPeer)
    .maybeSingle();

  if (!row?.id) {
    const ins = await admin
      .from("chat_sessions")
      .insert({
        type: "staff",
        user_id: userId,
        staff_peer_id: canonPeer,
        status: "open",
      })
      .select("id, status")
      .single();
    row = ins.data ?? null;
  }

  if (!row?.id) return null;
  if (row.status !== "open") {
    await admin.from("chat_sessions").update({ status: "open" }).eq("id", row.id);
  }
  return { id: row.id, status: "open" };
}

export function isStaffSessionParticipant(
  session: { type: string; user_id: string | null; staff_peer_id: string | null },
  authUserId: string
): boolean {
  if (session.type !== "staff") return false;
  return session.user_id === authUserId || session.staff_peer_id === authUserId;
}
