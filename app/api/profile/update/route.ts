import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const body = (await request.json()) as { username?: string; telegram_username?: string };
    const username = (body.username ?? "").trim();
    const telegramUsername = (body.telegram_username ?? "").trim().replace(/^@+/, "");

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        username: username || null,
        telegram_username: telegramUsername || null,
        last_seen: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка сохранения профиля" },
      { status: 500 }
    );
  }
}
