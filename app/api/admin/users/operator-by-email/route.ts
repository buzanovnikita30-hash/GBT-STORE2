import { NextRequest, NextResponse } from "next/server";

import { isServerAdmin } from "@/lib/auth/server-role";
import { roleAfterGrant } from "@/lib/auth/staffRoleMerge";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isServerAdmin(user))) {
      return NextResponse.json({ error: "Только админ может назначать операторов" }, { status: 403 });
    }

    const body = (await request.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Введите корректный email" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile, error: findError } = await admin
      .from("profiles")
      .select("id, email, role")
      .ilike("email", email)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 400 });
    }
    if (!profile?.id) {
      return NextResponse.json(
        { error: "Пользователь с таким email не найден. Сначала пусть зарегистрируется." },
        { status: 404 }
      );
    }

    const nextRole = roleAfterGrant((profile.role ?? "client") as UserRole, "operator");
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await admin.from("role_audit").insert({
      actor_id: user.id,
      target_id: profile.id,
      action: "grant_operator_by_email",
      payload: { email },
    });

    return NextResponse.json({
      ok: true,
      message: `Аккаунт ${profile.email ?? email} назначен оператором`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
