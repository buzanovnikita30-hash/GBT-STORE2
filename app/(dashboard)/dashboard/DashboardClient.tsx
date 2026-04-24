"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, CheckCircle, MessageCircle, Plus, ArrowRight } from "lucide-react";
import { OrderStatusTracker } from "@/components/ui/OrderStatusTracker";
import { ClientLoyaltyBlock } from "@/components/ui/ClientLoyaltyBlock";
import type { OrderStatus } from "@/types/database";

interface Order {
  id: string;
  product: string;
  plan_id: string;
  price: number;
  status: string;
  created_at: string;
  activated_at?: string | null;
  expires_at?: string | null;
}

interface Props {
  userEmail: string;
  username: string | null;
  profileCreatedAt: string;
  orders: Order[];
  ordersCount: number;
  activeCount: number;
  chatsCount: number;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Ожидает", bg: "bg-yellow-100", text: "text-yellow-700" },
  activating: { label: "В работе", bg: "bg-blue-100", text: "text-blue-700" },
  waiting_client: { label: "Нужен токен", bg: "bg-orange-100", text: "text-orange-700" },
  active: { label: "Активно", bg: "bg-green-100", text: "text-green-700" },
  expired: { label: "Истекло", bg: "bg-gray-100", text: "text-gray-600" },
  failed: { label: "Ошибка", bg: "bg-red-100", text: "text-red-700" },
  refunded: { label: "Возврат", bg: "bg-gray-100", text: "text-gray-600" },
};

const FU = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
} as const;

export function DashboardClient({
  userEmail,
  username,
  profileCreatedAt,
  orders,
  ordersCount,
  activeCount,
  chatsCount,
}: Props) {
  const activeOrPendingOrders = orders.filter((o) =>
    ["pending", "waiting_client", "activating"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "active").length;
  const recentOrders = orders.slice(0, 5);

  const greeting = username ? `Привет, ${username}!` : "Добро пожаловать!";

  return (
    <div className="w-full max-w-none space-y-5">
      {/* Header */}
      <motion.div
        {...FU}
        transition={{ ...FU.transition, delay: 0 }}
        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">{greeting}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{userEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/checkout"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-[#10a37f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#10a37f]/20 hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Новый заказ
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10a37f] text-base font-bold text-white shadow-sm">
            {userEmail[0]?.toUpperCase()}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...FU} transition={{ ...FU.transition, delay: 0.07 }} className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: "Заказов", value: ordersCount, color: "#10a37f" },
          { icon: CheckCircle, label: "Активных", value: activeCount, color: "#1a56db" },
          { icon: MessageCircle, label: "Обращений", value: chatsCount, color: "#8b5cf6" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <card.icon size={18} style={{ color: card.color }} className="mb-2 opacity-80" />
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Active orders — real-time status trackers */}
      {activeOrPendingOrders.length > 0 && (
        <motion.div {...FU} transition={{ ...FU.transition, delay: 0.14 }} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 px-1">
            В процессе
          </h2>
          {activeOrPendingOrders.map((order) => (
            <div key={order.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-gray-800">
                  {order.product === "chatgpt-plus" ? "ChatGPT Plus" : "ChatGPT Pro"} — {order.plan_id}
                </p>
                <Link
                  href="/dashboard/chat"
                  className="text-xs text-[#10a37f] hover:underline"
                >
                  Написать в чат
                </Link>
              </div>
              <OrderStatusTracker
                orderId={order.id}
                initialStatus={order.status as OrderStatus}
                planId={order.plan_id}
                activatedAt={order.activated_at ?? undefined}
                onOpenChat={() => {
                  window.location.href = "/dashboard/chat";
                }}
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* Bottom grid: loyalty + orders table */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Loyalty block */}
        <motion.div {...FU} transition={{ ...FU.transition, delay: 0.21 }} className="lg:col-span-1">
          <ClientLoyaltyBlock
            createdAt={profileCreatedAt}
            completedOrders={completedOrders}
            totalOrders={ordersCount}
          />
        </motion.div>

        {/* Recent orders */}
        <motion.div {...FU} transition={{ ...FU.transition, delay: 0.28 }} className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">Последние заказы</h2>
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-1 text-xs text-[#10a37f] hover:underline"
              >
                Все заказы <ArrowRight size={12} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="mb-2 text-sm font-medium text-gray-600">Пока нет заказов</p>
                <p className="text-sm text-gray-500 mb-4">Оформите подписку в один клик</p>
                <Link
                  href="/checkout"
                  className="inline-block rounded-xl bg-[#10a37f] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Оформить подписку
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                  const canRepeat = ["expired", "failed"].includes(order.status);
                  const isActive = order.status === "active";
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {order.product === "chatgpt-plus" ? "ChatGPT Plus" : "ChatGPT Pro"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.plan_id} ·{" "}
                          {new Date(order.created_at).toLocaleDateString("ru", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-gray-900 w-16 text-right">
                        {order.price.toLocaleString("ru")} ₽
                      </span>
                      {(canRepeat || isActive) && (
                        <Link
                          href={`/checkout?plan=${order.plan_id}`}
                          className="shrink-0 rounded-lg border border-[#10a37f]/25 px-2.5 py-1.5 text-[11px] font-semibold text-[#10a37f] hover:bg-[#10a37f]/5 transition-colors"
                        >
                          {isActive ? "Продлить" : "Повторить"}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* CTA buttons */}
      <motion.div {...FU} transition={{ ...FU.transition, delay: 0.35 }} className="flex flex-wrap gap-3 pt-1">
        <Link
          href="/checkout"
          className="flex items-center gap-2 rounded-xl bg-[#10a37f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#10a37f]/20 transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Новый заказ
        </Link>
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 rounded-xl border border-[#10a37f]/30 px-5 py-2.5 text-sm font-semibold text-[#10a37f] transition-colors hover:bg-[#10a37f]/5"
        >
          <MessageCircle size={16} />
          Написать в поддержку
        </Link>
      </motion.div>
    </div>
  );
}
