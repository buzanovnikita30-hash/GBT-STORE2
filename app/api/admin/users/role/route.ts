import { NextRequest, NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isServerAdmin } from "@/lib/auth/server-role";
import { isSuperAdminEmail } from "@/lib/auth/superAdmin";
import type { UserRole } from "@/types/database";

const VALID_ROLES = new Set(["client", "operator", "admin"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isServerAdmin(user))) {
      return NextResponse.json({ error: "Доступно только администратору" }, { status: 403 });
    }

    const body = (await request.json()) as { userId?: string; role?: string };
    const userId = (body.userId ?? "").trim();
    const role = (body.role ?? "").trim() as UserRole;

    if (!userId || !VALID_ROLES.has(role)) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: targetProf } = await admin
      .from("profiles")
      .select("email, role")
      .eq("id", userId)
      .maybeSingle();

    if (!targetProf) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (isSuperAdminEmail(targetProf.email) && role !== "admin") {
      return NextResponse.json(
        { error: "Нельзя изменить роль супер-администратора" },
        { status: 403 }
      );
    }

    const prevRole = (targetProf.role ?? "client") as UserRole;
    if (prevRole === "admin" && role !== "admin") {
      const { count, error: countErr } = await admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (countErr) {
        return NextResponse.json({ error: countErr.message }, { status: 400 });
      }
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Нельзя снять последнего администратора в базе" },
          { status: 403 }
        );
      }
    }

    const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await admin.from("role_audit").insert({
      actor_id: user.id,
      target_id: userId,
      action: "set_role",
      payload: { from: prevRole, to: role },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
