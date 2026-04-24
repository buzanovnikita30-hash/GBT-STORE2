import { NextRequest, NextResponse } from "next/server";
import { incrementPromocodeUsage } from "@/lib/promocodes/db-promo";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPallyWebhook, mapPallyStatus } from "@/lib/payments/pally";
import { notifyCustomerOrderStatus, notifyPaymentStatus } from "@/lib/telegram/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const sign =
      request.headers.get("x-pally-sign") ??
      request.headers.get("x-sign") ??
      String(body.sign ?? "");

    if (sign && !verifyPallyWebhook(body, sign)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const orderId = String(body.order_id ?? body.orderId ?? "");
    const pallyStatus = String(body.status ?? "");

    if (!orderId) {
      return NextResponse.json({ error: "Нет order_id" }, { status: 400 });
    }

    const internalStatus = mapPallyStatus(pallyStatus);
    const supabase = createAdminClient();

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (findError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status: internalStatus };
    if (internalStatus === "paid") {
      updateData.status = "activating";
    }

    await supabase.from("orders").update(updateData).eq("id", orderId);

    const becamePaidLike =
      !["paid", "activating", "active", "waiting_client"].includes(order.status) &&
      (updateData.status === "activating" || internalStatus === "paid");
    if (becamePaidLike) {
      const meta = order.meta as Record<string, unknown> | null;
      const promoCode = typeof meta?.promo_code === "string" ? meta.promo_code : null;
      await incrementPromocodeUsage(supabase, promoCode).catch(() => undefined);
    }

    await notifyPaymentStatus(
      { id: order.id, plan_name: order.plan_id, price: order.price, account_email: order.account_email ?? undefined },
      internalStatus
    );
    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", order.user_id)
        .maybeSingle();
      if (profile?.email) {
        await notifyCustomerOrderStatus({
          customerEmail: profile.email,
          orderId: order.id,
          planName: order.plan_id,
          status: updateData.status as string,
          price: order.price,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Pally Webhook] Ошибка:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
