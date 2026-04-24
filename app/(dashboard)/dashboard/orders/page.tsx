import { createClient } from "@/lib/supabase/server";
import { OrderStatusTracker } from "@/components/ui/OrderStatusTracker";
import { OrderReceiptCard } from "@/components/ui/OrderReceiptCard";
import Link from "next/link";
import type { Metadata } from "next";
import type { OrderStatus } from "@/types/database";
import { RefreshCw, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Мои заказы" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает оплаты", color: "text-amber-600 bg-amber-50 border-amber-200" },
  activating: { label: "Активируется", color: "text-blue-600 bg-blue-50 border-blue-200" },
  waiting_client: { label: "Ожидает данных", color: "text-orange-600 bg-orange-50 border-orange-200" },
  active: { label: "Активен", color: "text-green-600 bg-[#10a37f]/8 border-[#10a37f]/20" },
  failed: { label: "Ошибка", color: "text-red-600 bg-red-50 border-red-200" },
  expired: { label: "Истёк", color: "text-gray-500 bg-gray-50 border-gray-200" },
  refunded: { label: "Возврат", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">История заказов</h1>
        <Link
          href="/checkout"
          className="flex items-center gap-1.5 rounded-xl bg-[#10a37f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#10a37f]/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Новый заказ
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.07] bg-gray-50 p-10 text-center">
          <p className="text-gray-600 font-medium mb-1">Заказов пока нет</p>
          <p className="text-sm text-gray-400 mb-5">Оформите первый заказ — активация за 5–15 минут</p>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 rounded-xl bg-[#10a37f] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Оформить подписку
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
            const isInProgress = ["pending", "waiting_client", "activating"].includes(order.status);
            const isActive = order.status === "active";
            const isExpiredOrFailed = ["expired", "failed"].includes(order.status);

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-black/[0.07] bg-white overflow-hidden shadow-sm"
              >
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {order.product === "chatgpt-plus" ? "ChatGPT Plus" : "ChatGPT Pro"}{" "}
                      <span className="text-gray-400 font-normal">· {order.plan_id}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("ru", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {order.price.toLocaleString("ru")} ₽
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {/* In-progress: show status tracker */}
                  {isInProgress && (
                    <OrderStatusTracker
                      orderId={order.id}
                      initialStatus={order.status as OrderStatus}
                      planId={order.plan_id}
                      activatedAt={order.activated_at}
                      onOpenChat={() => {
                        window.location.href = "/dashboard/chat";
                      }}
                    />
                  )}

                  {/* Active: show receipt card */}
                  {isActive && order.activated_at && (
                    <OrderReceiptCard
                      product={order.product}
                      planId={order.plan_id}
                      price={order.price}
                      activatedAt={order.activated_at}
                      expiresAt={order.expires_at}
                    />
                  )}

                  {/* Expired/failed: "Repeat in 1 click" */}
                  {isExpiredOrFailed && (
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {isExpiredOrFailed ? "Оформить снова?" : ""}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Тот же тариф — один клик
                        </p>
                      </div>
                      <Link
                        href={`/checkout?plan=${order.plan_id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-[#10a37f] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-sm shadow-[#10a37f]/20"
                      >
                        <RefreshCw size={12} />
                        Повторить в 1 клик
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 rounded-xl border border-black/[0.08] px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Написать в поддержку
        </Link>
      </div>
    </div>
  );
}
