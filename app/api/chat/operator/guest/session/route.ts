import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let providedSessionId: string | undefined;

  try {
    const body = (await req.json()) as { sessionId?: string };
    providedSessionId = body.sessionId;
  } catch {
    providedSessionId = undefined;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: byUser, error: byUserError } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("type", "operator")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byUserError && byUser?.id) {
      if (byUser.status !== "open") {
        await supabaseAdmin.from("chat_sessions").update({ status: "open" }).eq("id", byUser.id);
      }
      return NextResponse.json({ sessionId: byUser.id });
    }
  }

  if (providedSessionId) {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("chat_sessions")
      .select("id")
      .eq("id", providedSessionId)
      .eq("status", "open")
      .maybeSingle();

    if (!selectError && existing?.id) {
      return NextResponse.json({ sessionId: existing.id });
    }
  }

  let { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .insert({
      user_id: user?.id ?? null,
      type: "operator",
      status: "open",
    })
    .select("id")
    .single();

  if (error && user?.id) {
    await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        role: "client",
      },
      { onConflict: "id" }
    );

    const retryInsert = await supabaseAdmin
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        type: "operator",
        status: "open",
      })
      .select("id")
      .single();

    data = retryInsert.data;
    error = retryInsert.error;
  }

  if (error) {
    const fallbackInsert = await supabaseAdmin
      .from("chat_sessions")
      .insert({
        user_id: null,
        type: "operator",
        status: "open",
      })
      .select("id")
      .single();

    data = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error || !data) {
    return NextResponse.json({ error: "Не удалось создать чат с оператором" }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
