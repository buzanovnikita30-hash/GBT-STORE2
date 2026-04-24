import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";
import { PromocodesManager } from "./PromocodesManager";

export const metadata: Metadata = { title: "Admin · Промокоды" };

export default async function AdminPromocodesPage() {
  await requireAdminPage();

  return (
    <div className="p-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-100">Промокоды</h1>
      <p className="mb-6 text-sm text-gray-400">
        Учитываются при оплате вместе с промокодами из настроек (JSON). При успешной оплате счётчик
        использований увеличивается.
      </p>
      <PromocodesManager />
    </div>
  );
}
