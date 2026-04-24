import type { SupabaseClient } from "@supabase/supabase-js";

import { ANCHOR_ADMIN_EMAIL, ANCHOR_OPERATOR_EMAIL } from "@/lib/auth/anchorRoles";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/database";

type Admin = SupabaseClient<Database>;

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * UUID собеседника для внутреннего чата admin ↔ operator.
 */
export async function resolveStaffChatPeer(
  admin: Admin,
  role: Extract<UserRole, "admin" | "operator">,
  currentUserId: string
): Promise<{ peerId: string; peerRole: "admin" | "operator" } | null> {
  if (role === "admin") {
    const { data: anchorOp } = await admin
      .from("profiles")
      .select("id, role")
      .ilike("email", ANCHOR_OPERATOR_EMAIL)
      .maybeSingle();
    if (anchorOp?.id && anchorOp.role === "operator" && anchorOp.id !== currentUserId) {
      return { peerId: anchorOp.id, peerRole: "operator" };
    }
    for (const email of parseEmailList(process.env.OPERATOR_EMAILS)) {
      const { data } = await admin
        .from("profiles")
        .select("id, role")
        .ilike("email", email)
        .maybeSingle();
      if (data?.id && data.role === "operator" && data.id !== currentUserId) {
        return { peerId: data.id, peerRole: "operator" };
      }
    }
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "operator")
      .neq("id", currentUserId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data?.id) return { peerId: data.id, peerRole: "operator" };
    return null;
  }

  const { data: anchorAdm } = await admin
    .from("profiles")
    .select("id, role")
    .ilike("email", ANCHOR_ADMIN_EMAIL)
    .maybeSingle();
  if (anchorAdm?.id && anchorAdm.id !== currentUserId) {
    return { peerId: anchorAdm.id, peerRole: "admin" };
  }

  for (const email of parseEmailList(process.env.ADMIN_EMAILS)) {
    const { data } = await admin
      .from("profiles")
      .select("id, role")
      .ilike("email", email)
      .maybeSingle();
    if (data?.id && data.role === "admin" && data.id !== currentUserId) {
      return { peerId: data.id, peerRole: "admin" };
    }
  }

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .neq("id", currentUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.id) return { peerId: data.id, peerRole: "admin" };

  return null;
}
