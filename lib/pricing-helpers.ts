/** Чистые функции для витрины — без server-only зависимостей. */

export type LandingDiscount = {
  id: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  appliesTo: string;
  active: boolean;
};

export function pickLandingDiscount(
  planId: string,
  productId: string | undefined,
  discounts: LandingDiscount[]
): LandingDiscount | null {
  const on = discounts.filter((d) => d.active);
  return (
    on.find((d) => d.appliesTo === planId) ??
    (productId ? on.find((d) => d.appliesTo === productId) : undefined) ??
    on.find((d) => d.appliesTo === "all" || d.appliesTo === "landing") ??
    null
  );
}

export function applyLandingDiscount(price: number, discount: LandingDiscount | null) {
  if (!discount) {
    return { displayPrice: price, cut: 0, name: null as string | null };
  }
  const raw =
    discount.type === "percent"
      ? Math.round((price * discount.value) / 100)
      : Math.round(discount.value);
  const cut = Math.max(0, Math.min(price, raw));
  return { displayPrice: Math.max(0, price - cut), cut, name: discount.name };
}
