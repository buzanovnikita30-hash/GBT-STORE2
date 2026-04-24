"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLUS_PLANS, PRO_PLANS, PRODUCTS, type ProductId } from "@/lib/chatgpt-data";
import { fadeUp } from "@/lib/motion-config";

type RuntimePlan = (typeof PLUS_PLANS)[number] & {
  original_price?: number;
  landing_discount_name?: string | null;
};

export function PricingSection({
  initialPlans,
}: {
  initialPlans?: RuntimePlan[];
  initialLandingDiscounts?: unknown[];
}) {
  const [activeProduct, setActiveProduct] = useState<ProductId>("chatgpt-plus");
  const [runtimePlans] = useState<RuntimePlan[]>(
    initialPlans && initialPlans.length ? initialPlans : [...PLUS_PLANS, ...PRO_PLANS]
  );

  const plans = useMemo(
    () => runtimePlans.filter((p) => p.productId === activeProduct),
    [runtimePlans, activeProduct]
  );
  const product = PRODUCTS.find((p) => p.id === activeProduct)!;

  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-28">
      {/* Subtle gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,163,127,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
        {/* Heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-12 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            Тарифы
          </span>
          <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
            Выберите подписку
          </h2>
          <p className="max-w-2xl text-lg text-gray-500">
            Plus для ежедневных задач — Pro для профессиональной работы
          </p>
        </motion.div>

        {/* Product switcher */}
        <div className="mb-10 flex justify-center">
          <div className="flex w-full max-w-sm gap-1 rounded-2xl border border-black/[0.08] bg-white p-1.5 sm:w-auto sm:max-w-none">
            {PRODUCTS.map((prod) => (
              <motion.button
                key={prod.id}
                onClick={() => setActiveProduct(prod.id)}
                className="relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 sm:flex-none md:px-6 md:py-2.5 md:text-sm"
                style={{ color: activeProduct === prod.id ? "white" : "#6b7280" }}
              >
                {activeProduct === prod.id && (
                  <motion.div
                    layoutId="product-tab-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: product.accentColor }}
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {prod.name}
                  {prod.badge && (
                    <span className="rounded-full bg-orange-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {prod.badge}
                    </span>
                  )}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Product description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct + "-desc"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-12 flex flex-col items-center justify-center gap-4 text-center sm:flex-row"
          >
            <p className="max-w-lg text-sm text-gray-500">{product.description}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {product.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border px-2.5 py-1 text-xs"
                  style={{
                    color: product.accentColor,
                    background: product.glowColor,
                    borderColor: `${product.accentColor}30`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Plan cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct + "-plans"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {plans.map((plan, index) => {
              const original = plan.original_price ?? plan.price;
              const displayPrice = plan.price;
              const discountLabel = plan.landing_discount_name ?? null;
              const showDiscount = original > displayPrice;
              const ctaText =
                plan.price > 0
                  ? `Подключить за ${displayPrice.toLocaleString("ru")} ${plan.currency}`
                  : plan.cta;

              return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative flex flex-col rounded-2xl bg-white p-7 shadow-sm"
                style={
                  plan.isPopular
                    ? {
                        border: `1.5px solid ${product.accentColor}`,
                        boxShadow: `0 0 0 4px ${product.glowColor}`,
                      }
                    : { border: "1px solid rgba(0,0,0,0.08)" }
                }
              >
                {(plan.badge || (showDiscount && discountLabel)) && (
                  <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-1">
                    {plan.badge && (
                    <span
                      className="rounded-full px-4 py-1 text-xs font-bold text-white"
                      style={{ background: product.accentColor }}
                    >
                      {plan.badge}
                    </span>
                    )}
                    {showDiscount && discountLabel && (
                      <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white">
                        {discountLabel}
                      </span>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <p className="mb-3 text-sm font-semibold text-gray-700">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    {plan.price > 0 ? (
                      <>
                        {showDiscount && (
                          <span className="mr-1 font-heading text-xl font-semibold text-gray-400 line-through">
                            {original.toLocaleString("ru")}
                          </span>
                        )}
                        <span className="font-heading text-4xl font-bold text-gray-900">
                          {displayPrice.toLocaleString("ru")}
                        </span>
                        <span className="text-lg text-gray-400">{plan.currency}</span>
                      </>
                    ) : (
                      <span className="font-heading text-2xl font-bold text-gray-400">
                        Уточняйте цену
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">/ {plan.period}</p>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: product.glowColor }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4l2 2 3-3"
                            stroke={product.accentColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative">
                  {plan.isPopular && (
                    <div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        animation: "pulse-ring 2s ease-in-out infinite",
                        border: `2px solid ${product.accentColor}`,
                      }}
                    />
                  )}
                  {plan.price > 0 ? (
                    <motion.a
                      href={`/checkout?plan=${plan.id}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="shimmer-btn flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold transition-all"
                      style={
                        plan.isPopular
                          ? {
                              background: product.accentColor,
                              color: "white",
                              boxShadow: `0 4px 20px ${product.glowColor}`,
                            }
                          : {
                              background: "transparent",
                              border: "1.5px solid rgba(0,0,0,0.12)",
                              color: "#374151",
                            }
                      }
                    >
                      {ctaText}
                    </motion.a>
                  ) : (
                    <a
                      href="/support"
                      className="flex w-full items-center justify-center rounded-xl border border-black/[0.12] py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#10a37f]/40 hover:text-[#10a37f]"
                    >
                      Узнать стоимость
                    </a>
                  )}
                </div>
              </motion.article>
            );
            })}
          </motion.div>
        </AnimatePresence>

        <p className="mt-8 text-center text-sm text-gray-400">
          Оплата через Pally · СБП · Карта РФ · Крипто — Без иностранной карты
        </p>
      </div>
    </section>
  );
}
