import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isServerAdmin } from "@/lib/auth/server-role";

type Payload = {
  auto_reply_delay_minutes?: number;
  operator_telegram_url?: string;
  night_start_hour?: number;
  night_end_hour?: number;
  pricing_plans?: unknown;
  promo_codes?: unknown;
  landing_sections?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isServerAdmin(user))) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const body = (await request.json()) as Payload;
    const entries = Object.entries(body).filter(([, value]) => value !== undefined);

    if (!entries.length) return NextResponse.json({ ok: true });

    const admin = createAdminClient();
    for (const [key, value] of entries) {
      const { error } = await admin.from("site_settings").upsert({ key, value });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
