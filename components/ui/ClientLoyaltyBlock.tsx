"use client";

import { motion } from "framer-motion";
import { Award, Gift, Zap, TrendingUp } from "lucide-react";

interface Props {
  createdAt: string;
  completedOrders: number;
  totalOrders: number;
}

function getMemberSince(createdAt: string) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "недавно";
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths >= 12) {
    const years = Math.floor(diffMonths / 12);
    return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`;
  }
  if (diffMonths >= 1) {
    return `${diffMonths} ${diffMonths === 1 ? "месяц" : diffMonths < 5 ? "месяца" : "месяцев"}`;
  }
  if (diffDays === 0) return "Сегодня";
  return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"}`;
}

function getBonusTier(completed: number) {
  if (completed >= 10)
    return { name: "Золотой", color: "#f59e0b", bg: "#fef3c7", discount: 15, nextAt: null };
  if (completed >= 5)
    return { name: "Серебряный", color: "#6366f1", bg: "#ede9fe", discount: 10, nextAt: 10 };
  if (completed >= 3)
    return { name: "Бронзовый", color: "#b45309", bg: "#fef9c3", discount: 5, nextAt: 5 };
  return { name: "Новичок", color: "#10a37f", bg: "#d1fae5", discount: 0, nextAt: 3 };
}

function getNextTier(completed: number) {
  if (completed < 3) return { name: "Бронзовый", needed: 3 - completed, total: 3 };
  if (completed < 5) return { name: "Серебряный", needed: 5 - completed, total: 5 };
  if (completed < 10) return { name: "Золотой", needed: 10 - completed, total: 10 };
  return null;
}

export function ClientLoyaltyBlock({ createdAt, completedOrders, totalOrders }: Props) {
  const memberSince = getMemberSince(createdAt);
  const tier = getBonusTier(completedOrders);
  const nextTier = getNextTier(completedOrders);
  const isNextOrderBonus = completedOrders > 0 && (completedOrders + 1) % 5 === 0;
  const progressPct = nextTier
    ? Math.round(((completedOrders) / nextTier.total) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-[#10a37f]" />
          <h3 className="text-sm font-semibold text-gray-700">Ваш статус</h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: tier.bg, color: tier.color }}
        >
          {tier.name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-gray-50 border border-black/[0.05] px-3 py-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">С нами</p>
          <p className="text-base font-bold text-gray-900">{memberSince}</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-black/[0.05] px-3 py-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Заказов</p>
          <p className="text-base font-bold text-gray-900">
            {completedOrders}
            {totalOrders > completedOrders && (
              <span className="text-xs text-gray-400 font-normal"> / {totalOrders}</span>
            )}
          </p>
        </div>
      </div>

      {nextTier && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <TrendingUp size={11} />
              До уровня «{nextTier.name}»
            </span>
            <span className="text-[11px] font-semibold text-gray-600">
              {completedOrders} / {nextTier.total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-[#10a37f]"
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            Ещё {nextTier.needed} {nextTier.needed === 1 ? "заказ" : nextTier.needed < 5 ? "заказа" : "заказов"} — и скидка{" "}
            {nextTier.name === "Бронзовый" ? "5%" : nextTier.name === "Серебряный" ? "10%" : "15%"}
          </p>
        </div>
      )}

      {isNextOrderBonus && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-3 py-2.5 mb-3">
          <Zap size={14} className="shrink-0 text-amber-500" />
          <span className="text-xs text-amber-700 font-semibold">
            Следующий заказ — каждый 5-й! Скидка 50 процентов
          </span>
        </div>
      )}

      {tier.discount > 0 && !isNextOrderBonus && (
        <div className="flex items-center gap-2 rounded-xl bg-[#10a37f]/6 px-3 py-2.5">
          <Gift size={14} className="shrink-0 text-[#10a37f]" />
          <span className="text-xs text-[#10a37f] font-medium">
            Скидка {tier.discount}% на следующий заказ — напишите в чат при оформлении
          </span>
        </div>
      )}
    </motion.div>
  );
}
