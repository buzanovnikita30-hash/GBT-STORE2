import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { ANCHOR_OPERATOR_EMAIL } from "@/lib/auth/anchorRoles";
import { createAdminClient } from "@/lib/supabase/server";

/** В dev не подставляйте якорный email админа — он зарезервирован (см. lib/auth/anchorRoles.ts) */
const DEFAULT_CLIENT_EMAIL = "dev+client@local.test";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const who = request.nextUrl.searchParams.get("who");
  const returnUrl = request.nextUrl.searchParams.get("returnUrl") ?? "/dashboard";

  const targetEmail =
    who === "operator"
      ? process.env.DEV_OPERATOR_EMAIL ?? ANCHOR_OPERATOR_EMAIL
      : process.env.DEV_CLIENT_EMAIL ?? DEFAULT_CLIENT_EMAIL;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", targetEmail)
    .maybeSingle();

  if (!profile?.id) {
    const createRes = await admin.auth.admin.createUser({
      email: targetEmail,
      password: crypto.randomBytes(16).toString("hex"),
      email_confirm: true,
    });
    if (createRes.error) {
      return NextResponse.redirect(new URL("/login?error=dev_create_failed", request.url));
    }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });

  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.redirect(new URL("/login?error=dev_link_failed", request.url));
  }

  const magicUrl = new URL(linkData.properties.action_link);
  magicUrl.searchParams.set("next", returnUrl);
  return NextResponse.redirect(magicUrl);
}

