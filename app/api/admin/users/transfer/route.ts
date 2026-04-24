import { NextRequest, NextResponse } from "next/server";

import { isServerAdmin } from "@/lib/auth/server-role";
import { roleAfterGrant } from "@/lib/auth/staffRoleMerge";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isServerAdmin(user))) {
    return NextResponse.json({ error: "Доступно только администратору" }, { status: 403 });
  }

  let body: { targetUserId?: string; grant?: string; migrateData?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Неверный JSON" }, { status: 400 });
  }

  const targetUserId = (body.targetUserId ?? "").trim();
  const grant =
    body.grant === "admin" ? "admin" : body.grant === "operator" ? "operator" : null;
  const migrateData = Boolean(body.migrateData);

  if (!targetUserId || !grant) {
    return NextResponse.json(
      { error: "Нужны targetUserId и grant: admin или operator" },
      { status: 400 }
    );
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Нельзя выбрать себя как получателя" }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: actorProf }, { data: targetProf }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, notes, tags, client_stage, role")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, email, notes, tags, client_stage, role")
      .eq("id", targetUserId)
      .maybeSingle(),
  ]);

  if (!targetProf?.id) {
    return NextResponse.json({ error: "Получатель не найден" }, { status: 404 });
  }

  const nextRole = roleAfterGrant((targetProf.role ?? "client") as UserRole, grant);

  const profilePatch: Record<string, unknown> = { role: nextRole };

  if (migrateData && actorProf) {
    const mergedNotes = [targetProf.notes, actorProf.notes].filter(Boolean).join("\n---\n");
    profilePatch.notes = mergedNotes || null;
    profilePatch.tags = Array.from(
      new Set([...(targetProf.tags ?? []), ...(actorProf.tags ?? [])])
    );
    profilePatch.client_stage = targetProf.client_stage ?? actorProf.client_stage;
  }

  const { error: upErr } = await admin.from("profiles").update(profilePatch).eq("id", targetUserId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const counts = { orders: 0, chat_sessions: 0, chat_messages: 0 };

  if (migrateData) {
    const actorId = user.id;
    const { data: ord } = await admin
      .from("orders")
      .update({ user_id: targetUserId })
      .eq("user_id", actorId)
      .select("id");
    counts.orders = ord?.length ?? 0;

    const { data: sess } = await admin
      .from("chat_sessions")
      .update({ user_id: targetUserId })
      .eq("user_id", actorId)
      .select("id");
    counts.chat_sessions = sess?.length ?? 0;

    const { data: msg } = await admin
      .from("chat_messages")
      .update({ sender_id: targetUserId })
      .eq("sender_id", actorId)
      .select("id");
    counts.chat_messages = msg?.length ?? 0;
  }

  await admin.from("role_audit").insert({
    actor_id: user.id,
    target_id: targetUserId,
    action: "transfer_staff_and_data",
    payload: { grant, migrateData, counts, newRole: nextRole },
  });

  return NextResponse.json({ ok: true, role: nextRole, migrateData, counts });
}
