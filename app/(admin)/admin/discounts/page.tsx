import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";
import { DiscountsManager } from "./DiscountsManager";

export const metadata: Metadata = { title: "Admin · Скидки" };

export default async function AdminDiscountsPage() {
  await requireAdminPage();

  return (
    <div className="p-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-100">Скидки на лендинге</h1>
      <p className="mb-6 text-sm text-gray-400">
        Отображаются на блоке тарифов (витрина). Не путать с промокодом при оформлении заказа.
      </p>
      <DiscountsManager />
    </div>
  );
}
