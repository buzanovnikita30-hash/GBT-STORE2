import { type NextRequest, NextResponse } from "next/server";
import { incrementPromocodeUsage } from "@/lib/promocodes/db-promo";
import { createAdminClient } from "@/lib/supabase/server";
import { mapCryptoStatus } from "@/lib/payments/crypto";
import { notifyCustomerOrderStatus, notifyPaymentStatus } from "@/lib/telegram/notifications";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  const invoiceId = String(body.invoice_id ?? body.uuid ?? "");
  const status = String(body.status ?? "");

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
  }

  const internalStatus = mapCryptoStatus(status);
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_id", invoiceId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    status: internalStatus === "paid" ? "activating" : internalStatus,
  };

  await supabase.from("orders").update(updates).eq("id", order.id);

  const becamePaidLike =
    internalStatus === "paid" &&
    !["paid", "activating", "active", "waiting_client"].includes(order.status);
  if (becamePaidLike) {
    const meta = order.meta as Record<string, unknown> | null;
    const promoCode = typeof meta?.promo_code === "string" ? meta.promo_code : null;
    await incrementPromocodeUsage(supabase, promoCode).catch(() => undefined);
  }

  await notifyPaymentStatus(order, internalStatus).catch(() => {});
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
        status: updates.status as string,
        price: order.price,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
