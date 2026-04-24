import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { pickCanonicalOperatorSession } from "@/lib/chat/operatorSession";

export async function POST(req: NextRequest) {
  let body: { userId?: string };
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await resolveServerRole(user);
  if (role !== "admin" && role !== "operator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const existing = await pickCanonicalOperatorSession(admin, userId);

  if (existing?.id) {
    if (existing.status !== "open") {
      await admin
        .from("chat_sessions")
        .update({ status: "open" })
        .eq("id", existing.id);
    }
    return NextResponse.json({ sessionId: existing.id });
  }

  const { data: created, error } = await admin
    .from("chat_sessions")
    .insert({
      user_id: userId,
      type: "operator",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return NextResponse.json({ error: "Не удалось создать сессию" }, { status: 500 });
  }

  return NextResponse.json({ sessionId: created.id });
}

