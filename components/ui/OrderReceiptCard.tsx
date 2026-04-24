"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Shield, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  product: string;
  planId: string;
  price: number;
  activatedAt: string;
  expiresAt?: string | null;
}

export function OrderReceiptCard({ product, planId, price, activatedAt, expiresAt }: Props) {
  const productName = product === "chatgpt-plus" ? "ChatGPT Plus" : "ChatGPT Pro";

  const activatedDate = new Date(activatedAt).toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const expiresDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("ru", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const now = new Date();
  const expiry = expiresAt ? new Date(expiresAt) : null;
  const daysLeft = expiry
    ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[#10a37f]/20 bg-gradient-to-br from-[#10a37f]/[0.04] to-white overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dashed border-[#10a37f]/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10a37f] shadow-md shadow-[#10a37f]/25">
          <CheckCircle2 size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Подписка активирована</p>
          <p className="text-xs text-[#10a37f] font-semibold mt-0.5">
            {productName} · {planId}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">{price.toLocaleString("ru")} ₽</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">оплачено</p>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar size={12} />
            Дата активации
          </div>
          <span className="font-semibold text-gray-800">{activatedDate}</span>
        </div>

        {expiresDate && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={12} />
              Действует до
            </div>
            <span className="font-semibold text-gray-800">{expiresDate}</span>
          </div>
        )}

        {daysLeft !== null && (
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
              isExpiringSoon
                ? "bg-amber-50 border border-amber-200/70 text-amber-700"
                : "bg-[#10a37f]/6 border border-[#10a37f]/15 text-[#10a37f]"
            }`}
          >
            <span>{isExpiringSoon ? "⚠️ Скоро истекает" : "✅ Активна"}</span>
            <span>
              {daysLeft === 0
                ? "Истекает сегодня"
                : `Осталось ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}`}
            </span>
          </div>
        )}

        {/* Guarantee block */}
        <div className="flex items-start gap-2.5 rounded-xl bg-white border border-black/[0.06] px-3.5 py-3 mt-1">
          <Shield size={15} className="shrink-0 mt-0.5 text-[#10a37f]" />
          <div>
            <p className="text-xs font-bold text-gray-800 mb-0.5">Гарантия 30 дней</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Если подписка перестанет работать — переактивируем бесплатно или вернём деньги. Без вопросов.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        <Link
          href={`/checkout?plan=${planId}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#10a37f]/30 bg-[#10a37f]/5 py-2.5 text-xs font-bold text-[#10a37f] hover:bg-[#10a37f]/10 transition-colors"
        >
          <RefreshCw size={13} />
          Продлить
        </Link>
        <Link
          href="/support"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle size={13} />
          Поддержка
        </Link>
        <Link
          href="/reviews"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          ⭐ Оставить отзыв
        </Link>
      </div>
    </motion.div>
  );
}
