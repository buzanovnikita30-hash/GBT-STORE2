"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PLUS_PLANS, PRO_PLANS, type ExtendedPlan } from "@/lib/chatgpt-data";
import { checkoutStep2Schema, type CheckoutStep2Input } from "@/lib/validations";
import { TokenSafetyBlock } from "@/components/ui/TokenSafetyBlock";
import { cn } from "@/lib/utils";

const ALL_PLANS = [...PLUS_PLANS, ...PRO_PLANS];

const STEPS = ["Выбор тарифа", "Email аккаунта", "Оплата"];

type PaymentMethod = "pally" | "crypto";

export function CheckoutFlow({ initialPlans }: { initialPlans?: ExtendedPlan[] }) {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<ExtendedPlan | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pally");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimePlans] = useState<ExtendedPlan[]>(
    initialPlans && initialPlans.length ? initialPlans : ALL_PLANS
  );

  // Предвыбор тарифа из URL (?plan=plus-std)
  useEffect(() => {
    const planId = searchParams.get("plan");
    if (planId) {
      const found = runtimePlans.find((p) => p.id === planId);
      if (found) setSelectedPlan(found);
    }
  }, [searchParams, runtimePlans]);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutStep2Input>({
    resolver: zodResolver(checkoutStep2Schema),
  });

  function onStep2Submit(data: CheckoutStep2Input) {
    setAccountEmail(data.accountEmail);
    setStep(3);
  }

  async function onPaymentSubmit() {
    if (!selectedPlan || !accountEmail || !agreeTerms) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        paymentMethod === "pally"
          ? "/api/payments/pally/create"
          : "/api/payments/crypto/create";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, accountEmail, promoCode: promoCode.trim().toUpperCase() || null }),
      });

      const json = await res.json() as { paymentUrl?: string; error?: string };

      if (!res.ok || !json.paymentUrl) {
        setError(json.error ?? "Ошибка создания платежа. Попробуйте ещё раз.");
        return;
      }

      window.location.href = json.paymentUrl;
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Steps */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const isDone = step > n;
          const isCurrent = step === n;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isDone ? "bg-[#10a37f] text-white"
                    : isCurrent ? "border-2 border-[#10a37f] text-[#10a37f]"
                    : "border-2 border-gray-200 text-gray-400"
                  )}
                >
                  {isDone ? <Check size={12} /> : n}
                </div>
                <span className={cn("text-sm hidden sm:block", isCurrent ? "font-semibold text-gray-900" : "text-gray-400")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px w-8 sm:w-12", step > n ? "bg-[#10a37f]" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">Выберите тариф</h2>
            <div className="space-y-3">
              {runtimePlans.filter(p => p.price > 0).map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    selectedPlan?.id === plan.id
                      ? "border-[#10a37f] bg-[#10a37f]/4 shadow-sm"
                      : "border-black/[0.08] bg-white hover:border-[#10a37f]/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                        {plan.badge && (
                          <span className="rounded-full bg-[#10a37f] px-2 py-0.5 text-[10px] font-bold text-white">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-xl font-bold text-gray-900">
                        {plan.price.toLocaleString("ru")} ₽
                      </span>
                      <p className="text-xs text-gray-400">/ {plan.period}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!selectedPlan}
              onClick={() => setStep(2)}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Продолжить →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Email вашего ChatGPT аккаунта</h2>
            <p className="mb-6 text-sm text-gray-500">
              Нам нужен email, к которому привязан ваш аккаунт ChatGPT. После оплаты мы свяжемся через чат.
            </p>

            <form onSubmit={handleSubmit(onStep2Submit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email аккаунта ChatGPT
                </label>
                <input
                  type="email"
                  {...register("accountEmail")}
                  className={cn(
                    "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow",
                    "focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]",
                    errors.accountEmail ? "border-red-400" : "border-black/[0.12]"
                  )}
                  placeholder="your@chatgpt-account.com"
                />
                {errors.accountEmail && (
                  <p className="mt-1 text-xs text-red-500">{errors.accountEmail.message}</p>
                )}
              </div>

              <TokenSafetyBlock compact={true} className="mt-4" />

              <p className="text-xs text-amber-700 rounded-xl bg-amber-50 border border-amber-200/50 px-4 py-3">
                После оплаты мы свяжемся с вами в чате и попросим временный токен для активации подписки.
                Инструкцию как его получить — пришлём тоже.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-black/[0.1] py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  ← Назад
                </button>
                <button
                  type="submit"
                  className="flex-[2] rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  Продолжить →
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Выберите способ оплаты</h2>

            {/* Summary */}
            {selectedPlan && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-black/[0.07] bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">{selectedPlan.name}</span>
                <span className="font-semibold text-gray-900">{selectedPlan.price.toLocaleString("ru")} ₽</span>
              </div>
            )}

            {/* Payment methods */}
            <div className="space-y-3 mb-5">
              {[
                { id: "pally" as const, label: "Карта РФ / СБП", hint: "Быстро — Pally" },
                { id: "crypto" as const, label: "Крипто (USDT/BTC)", hint: "Для оплаты криптовалютой" },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all",
                    paymentMethod === method.id
                      ? "border-[#10a37f] bg-[#10a37f]/4"
                      : "border-black/[0.08] bg-white hover:border-[#10a37f]/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{method.label}</span>
                    <span className="text-xs text-gray-400">{method.hint}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Terms consent */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Промокод (если есть)</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Например: SALE10"
                className="w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/30"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#10a37f]"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Я принимаю{" "}
                <a href="/terms" className="text-[#10a37f] hover:underline" target="_blank" rel="noopener noreferrer">
                  публичную оферту
                </a>{" "}
                и{" "}
                <a href="/privacy" className="text-[#10a37f] hover:underline" target="_blank" rel="noopener noreferrer">
                  политику конфиденциальности
                </a>
              </span>
            </label>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-black/[0.1] py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                ← Назад
              </button>
              <button
                type="button"
                disabled={!agreeTerms || isSubmitting}
                onClick={onPaymentSubmit}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Создаём платёж..." : `Оплатить ${selectedPlan?.price.toLocaleString("ru")} ₽`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
