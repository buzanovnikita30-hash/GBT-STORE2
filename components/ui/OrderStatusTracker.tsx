"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface StatusStep {
  key: OrderStatus;
  label: string;
  hint: string;
}

const STEPS: StatusStep[] = [
  { key: "pending", label: "Ожидает оплаты", hint: "Ожидаем подтверждение оплаты" },
  { key: "activating", label: "В работе", hint: "Наш специалист подключает вашу подписку" },
  { key: "waiting_client", label: "Ожидание токена", hint: "Напишите нам ваш токен в чат" },
  { key: "active", label: "Активировано", hint: "Подписка успешно активирована! Можете пользоваться" },
];

function stepIndex(status: OrderStatus): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

// Время активации в минутах для тарифов
const ACTIVATION_MINUTES: Record<string, number> = {
  "plus-fast": 5,
  "plus-std": 15,
  "plus-new": 15,
  "pro-1": 10,
};

interface Props {
  orderId: string;
  initialStatus: OrderStatus;
  planId?: string;
  activatedAt?: string | null;
  onOpenChat?: () => void;
}

export function OrderStatusTracker({
  orderId,
  initialStatus,
  planId,
  activatedAt,
  onOpenChat,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [countdown, setCountdown] = useState<string | null>(null);

  const openChat = onOpenChat ?? (() => router.push("/dashboard/chat"));

  // Supabase Realtime — обновление статуса без перезагрузки
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = (payload.new as { status: OrderStatus }).status;
          setStatus(newStatus);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Таймер обратного отсчёта при статусе activating
  useEffect(() => {
    if (status !== "activating") { setCountdown(null); return; }

    const totalMinutes = planId ? (ACTIVATION_MINUTES[planId] ?? 15) : 15;
    const startTime = activatedAt ? new Date(activatedAt).getTime() : Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const remaining = totalMinutes - elapsed;
      if (remaining <= 0) {
        setCountdown("Активируем, почти готово...");
      } else {
        const mins = Math.floor(remaining);
        const secs = Math.floor((remaining - mins) * 60);
        setCountdown(`Осталось ~${mins}:${secs.toString().padStart(2, "0")} до активации`);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, planId, activatedAt]);

  const currentIdx = stepIndex(status);

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Статус заказа
      </h3>

      {/* Desktop — горизонтальный прогресс */}
      <div className="hidden items-start gap-0 md:flex">
        {STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Connector line left */}
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0 ? "invisible" : isDone || isCurrent ? "bg-[#10a37f]" : "bg-gray-200"
                  )}
                />
                {/* Icon */}
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={isCurrent ? { duration: 1.2, repeat: Infinity } : {}}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isDone
                      ? "border-[#10a37f] bg-[#10a37f] text-white"
                      : isCurrent
                      ? "border-[#10a37f] bg-white text-[#10a37f]"
                      : "border-gray-200 bg-white text-gray-300"
                  )}
                >
                  {isDone ? <Check size={14} /> : isCurrent ? <Circle size={14} className="fill-[#10a37f]" /> : <Circle size={14} />}
                </motion.div>
                {/* Connector line right */}
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === STEPS.length - 1 ? "invisible" : isDone ? "bg-[#10a37f]" : "bg-gray-200"
                  )}
                />
              </div>
              <div className="mt-2 px-1 text-center">
                <p className={cn("text-xs font-semibold", isCurrent ? "text-[#10a37f]" : isDone ? "text-gray-700" : "text-gray-400")}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-0.5 text-[11px] text-gray-500"
                  >
                    {step.hint}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile — вертикальный timeline */}
      <div className="flex flex-col gap-4 md:hidden">
        {STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <motion.div
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { duration: 1.2, repeat: Infinity } : {}}
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                  isDone ? "border-[#10a37f] bg-[#10a37f] text-white"
                  : isCurrent ? "border-[#10a37f] bg-white text-[#10a37f]"
                  : "border-gray-200 bg-white text-gray-300"
                )}
              >
                {isDone ? <Check size={12} /> : <Circle size={10} className={isCurrent ? "fill-[#10a37f]" : ""} />}
              </motion.div>
              <div>
                <p className={cn("text-sm font-semibold", isCurrent ? "text-[#10a37f]" : isDone ? "text-gray-700" : "text-gray-400")}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-gray-500">{step.hint}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Таймер обратного отсчёта */}
      {countdown && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-2 rounded-xl bg-[#10a37f]/8 px-4 py-2.5"
        >
          <Clock size={14} className="shrink-0 text-[#10a37f]" />
          <span className="text-sm font-medium text-[#10a37f]">{countdown}</span>
        </motion.div>
      )}

      {/* Кнопка написать в поддержку */}
      {status !== "active" && (
        <button
          type="button"
          onClick={openChat}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] py-2.5 text-sm text-gray-600 transition-colors hover:border-[#10a37f]/40 hover:text-[#10a37f]"
        >
          Написать в поддержку
        </button>
      )}
    </div>
  );
}
