import { NextRequest, NextResponse } from "next/server";

import { resolveServerRole } from "@/lib/auth/server-role";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const STAGES = ["purchased", "waiting", "no_purchase", "needs_help", "other"] as const;
function canonicalEmail(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function deriveStageFromOrders(
  orders: { status: string }[]
): (typeof STAGES)[number] {
  if (!orders.length) return "no_purchase";
  const hasActive = orders.some((o) => o.status === "active");
  if (hasActive) return "purchased";
  const waiting = orders.some((o) =>
    ["pending", "paid", "activating", "waiting_client"].includes(o.status)
  );
  if (waiting) return "waiting";
  return "other";
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
  if (!userId && !email && !sessionId) {
    return NextResponse.json({ error: "Нужен userId, email или sessionId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const role = await resolveServerRole(user);
  if (role !== "admin" && role !== "operator") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const admin = createAdminClient();
  const baseSelect =
    "id, email, username, telegram_id, telegram_username, role, created_at, last_seen, notes, tags, client_stage";
  let profile: {
    id: string;
    email: string | null;
    username: string | null;
    telegram_id: number | null;
    telegram_username: string | null;
    role: string | null;
    created_at: string;
    last_seen: string | null;
    notes: string | null;
    tags: string[] | null;
    client_stage: string | null;
  } | null = null;
  let pErr: Error | null = null;

  if (userId) {
    const byId = await admin
      .from("profiles")
      .select(baseSelect)
      .eq("id", userId)
      .maybeSingle();
    profile = byId.data;
    pErr = byId.error;
  }

  if (!profile && email) {
    const byEmail = await admin
      .from("profiles")
      .select(baseSelect)
      .ilike("email", email)
      .maybeSingle();
    profile = byEmail.data;
    pErr = pErr ?? byEmail.error;
  }

  // Fallback 1: берём user_id прямо из chat_sessions.
  if (!profile && sessionId) {
    const { data: sessionRow } = await admin
      .from("chat_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionRow?.user_id) {
      const bySessionUser = await admin
        .from("profiles")
        .select(baseSelect)
        .eq("id", sessionRow.user_id)
        .maybeSingle();
      profile = bySessionUser.data;
      pErr = pErr ?? bySessionUser.error;
    }
  }

  // Fallback 2: для "кривых" email (mailru/mail.ru, gmailcom/gmail.com) ищем канонически.
  if (!profile && email) {
    const localPart = email.split("@")[0] ?? "";
    if (localPart) {
      const { data: candidates } = await admin
        .from("profiles")
        .select(baseSelect)
        .ilike("email", `${localPart}%`)
        .limit(30);
      const wanted = canonicalEmail(email);
      profile =
        (candidates ?? []).find((p) => canonicalEmail(p.email) === wanted) ??
        (candidates ?? [])[0] ??
        null;
    }
  }

  // Fallback 3: ищем последнего авторизованного клиента в сообщениях этого чата.
  if (!profile && sessionId) {
    const { data: lastClientMsg } = await admin
      .from("chat_messages")
      .select("sender_id")
      .eq("session_id", sessionId)
      .eq("sender_type", "client")
      .not("sender_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastClientMsg?.sender_id) {
      const byMsgSender = await admin
        .from("profiles")
        .select(baseSelect)
        .eq("id", lastClientMsg.sender_id)
        .maybeSingle();
      profile = byMsgSender.data;
      pErr = pErr ?? byMsgSender.error;
    }
  }

  if (pErr || !profile) {
    return NextResponse.json({
      profile: null,
      derived_stage: "no_purchase",
      effective_stage: "no_purchase",
      has_active_subscription: false,
      active_order: null,
      orders: [],
      hint: "Профиль не удалось связать с этим чатом",
    });
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, status, plan_id, price, created_at, payment_provider, activated_at, expires_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const list = orders ?? [];
  const activeSub = list.find((o) => o.status === "active");
  const derived = deriveStageFromOrders(list);
  const stage =
    profile.client_stage && STAGES.includes(profile.client_stage as (typeof STAGES)[number])
      ? profile.client_stage
      : derived;

  return NextResponse.json({
    profile: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      telegram_id: profile.telegram_id ?? null,
      telegram_username: profile.telegram_username ?? null,
      created_at: profile.created_at,
      last_seen: profile.last_seen ?? null,
      notes: profile.notes,
      tags: profile.tags ?? [],
      client_stage: profile.client_stage,
      role: profile.role ?? "client",
    },
    derived_stage: derived,
    effective_stage: stage,
    has_active_subscription: Boolean(activeSub),
    active_order: activeSub ?? null,
    orders: list,
  });
}
