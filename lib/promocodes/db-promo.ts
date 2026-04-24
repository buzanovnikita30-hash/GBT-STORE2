import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { PromoCode } from "@/lib/store-config";

type Admin = SupabaseClient<Database>;

export async function fetchPromoCodesFromDb(admin: Admin): Promise<PromoCode[]> {
  const { data, error } = await admin
    .from("promocodes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const now = Date.now();
  return data.map((row) => {
    const fromOk = !row.valid_from || new Date(row.valid_from).getTime() <= now;
    const untilOk = !row.valid_until || new Date(row.valid_until).getTime() >= now;
    const usesOk = row.max_uses == null || row.uses_count < row.max_uses;
    const active = row.is_active && fromOk && untilOk && usesOk;
    return {
      code: row.code.trim().toUpperCase(),
      type: row.discount_type,
      value: row.discount_value,
      active,
      planIds: row.plan_ids?.length ? row.plan_ids : undefined,
      dbId: row.id,
      maxUses: row.max_uses,
      usesCount: row.uses_count,
    };
  });
}

export async function incrementPromocodeUsage(admin: Admin, codeFromMeta: string | null | undefined) {
  const raw = codeFromMeta?.trim();
  if (!raw) return;
  const code = raw.toUpperCase();

  const { data: row } = await admin
    .from("promocodes")
    .select("id, uses_count, max_uses")
    .eq("code", code)
    .maybeSingle();

  if (!row) return;
  if (row.max_uses != null && row.uses_count >= row.max_uses) return;

  await admin
    .from("promocodes")
    .update({ uses_count: row.uses_count + 1, updated_at: new Date().toISOString() })
    .eq("id", row.id);
}
