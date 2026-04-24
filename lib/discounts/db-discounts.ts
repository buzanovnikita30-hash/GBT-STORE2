import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { LandingDiscount } from "@/lib/pricing-helpers";

type Admin = SupabaseClient<Database>;

export async function fetchLandingDiscountsFromDb(admin: Admin): Promise<LandingDiscount[]> {
  const { data, error } = await admin
    .from("landing_discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  return data.map((row) => {
    // Для админ-переключателя "Включить/Отключить" источник истины — is_active.
    // Это исключает рассинхрон по часовым поясам при datetime-local.
    const active = Boolean(row.is_active);
    return {
      id: row.id,
      name: row.name,
      type: row.discount_type,
      value: row.discount_value,
      appliesTo: row.applies_to,
      active,
    };
  });
}
