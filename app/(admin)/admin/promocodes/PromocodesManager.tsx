"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  plan_ids: string[] | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

type PlanOption = { id: string; label: string };

type QuickPreset = {
  id: string;
  label: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  plan_ids: string[] | null;
  max_uses: number | null;
  periodDays: number | null;
};

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "all-10",
    label: "Быстрый -10% (все тарифы)",
    discount_type: "percent",
    discount_value: 10,
    plan_ids: null,
    max_uses: null,
    periodDays: null,
  },
  {
    id: "plus-15-7d",
    label: "Plus -15% (7 дней)",
    discount_type: "percent",
    discount_value: 15,
    plan_ids: ["plus-fast"],
    max_uses: 100,
    periodDays: 7,
  },
  {
    id: "pro-1000-30d",
    label: "Pro -1000 ₽ (30 дней)",
    discount_type: "fixed",
    discount_value: 1000,
    plan_ids: ["pro-1"],
    max_uses: 100,
    periodDays: 30,
  },
];

function toLocalInputDate(iso: string): string {
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generatePromoCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `PROMO-${rand}`;
}

export function PromocodesManager() {
  const [items, setItems] = useState<Row[]>([]);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: generatePromoCode(),
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    selected_plan_ids: [] as string[],
    use_limit: false,
    max_uses: 100,
    period_mode: "none" as "none" | "7d" | "30d" | "custom",
    valid_from: "",
    valid_until: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promocodes", { credentials: "include" });
    const j = (await res.json()) as { items?: Row[]; error?: string };
    if (!res.ok) setErr(j.error ?? "Ошибка");
    else {
      setErr(null);
      setItems(j.items ?? []);
    }
    setLoading(false);
  }, []);

  const loadPlans = useCallback(async () => {
    const res = await fetch("/api/public/store-config", { credentials: "include" });
    const json = (await res.json()) as {
      plans?: Array<{ id?: string; name?: string; productId?: string }>;
    };
    const plans = (json.plans ?? [])
      .filter((p) => typeof p.id === "string" && p.id)
      .map((p) => ({
        id: p.id!,
        label: `${p.productId === "chatgpt-pro" ? "PRO" : "PLUS"} · ${p.name ?? p.id} (${p.id})`,
      }));
    setPlanOptions(plans);
  }, []);

  useEffect(() => {
    void load();
    void loadPlans();
  }, [load, loadPlans]);

  const applyPreset = (preset: QuickPreset) => {
    const now = new Date();
    const until = preset.periodDays ? new Date(now.getTime() + preset.periodDays * 24 * 60 * 60 * 1000) : null;
    setForm((f) => ({
      ...f,
      code: f.code || generatePromoCode(),
      discount_type: preset.discount_type,
      discount_value: preset.discount_value,
      selected_plan_ids: preset.plan_ids ?? [],
      use_limit: preset.max_uses != null,
      max_uses: preset.max_uses ?? 100,
      period_mode:
        preset.periodDays === 7 ? "7d" : preset.periodDays === 30 ? "30d" : "none",
      valid_from: preset.periodDays ? toLocalInputDate(now.toISOString()) : "",
      valid_until: until ? toLocalInputDate(until.toISOString()) : "",
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const planIds = form.selected_plan_ids;

    let validFrom = form.valid_from || null;
    let validUntil = form.valid_until || null;
    if (form.period_mode === "7d" || form.period_mode === "30d") {
      const days = form.period_mode === "7d" ? 7 : 30;
      const now = new Date();
      validFrom = toLocalInputDate(now.toISOString());
      validUntil = toLocalInputDate(new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString());
    } else if (form.period_mode === "none") {
      validFrom = null;
      validUntil = null;
    }

    const res = await fetch("/api/admin/promocodes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        plan_ids: planIds.length ? planIds : null,
        max_uses: form.use_limit ? Number(form.max_uses) : null,
        valid_from: validFrom,
        valid_until: validUntil,
      }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Не создано");
      return;
    }
    setForm((f) => ({
      ...f,
      code: generatePromoCode(),
      selected_plan_ids: [],
      use_limit: false,
      max_uses: 100,
      period_mode: "none",
      valid_from: "",
      valid_until: "",
    }));
    void load();
  };

  const toggle = async (row: Row) => {
    const res = await fetch("/api/admin/promocodes", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, is_active: !row.is_active }),
    });
    if (res.ok) void load();
  };

  if (loading) {
    return <p className="text-sm text-gray-400">Загрузка…</p>;
  }

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-red-400">{err}</p>}

      <form onSubmit={create} className="space-y-3 rounded-xl border border-white/[0.08] bg-gray-900 p-4">
        <p className="text-sm font-semibold text-gray-200">Новый промокод</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 hover:border-[#10a37f]/50 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-gray-400">
            Код
            <div className="mt-1 flex gap-2">
              <input
                className="w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, code: generatePromoCode() }))}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:text-white"
              >
                Сгенерировать
              </button>
            </div>
          </label>
          <label className="text-xs text-gray-400">
            Тип
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={form.discount_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))
              }
            >
              <option value="percent">Процент</option>
              <option value="fixed">Фикс (₽)</option>
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Значение
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={form.discount_value}
              onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
              min={1}
              required
            />
          </label>
          <label className="text-xs text-gray-400">
            Лимит активаций
            <div className="mt-1 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={form.use_limit}
                  onChange={(e) => setForm((f) => ({ ...f, use_limit: e.target.checked }))}
                />
                Ограничить
              </label>
              <input
                type="number"
                className="w-28 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100 disabled:opacity-50"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: Number(e.target.value) || 1 }))}
                min={1}
                disabled={!form.use_limit}
              />
            </div>
          </label>
          <label className="text-xs text-gray-400 md:col-span-2">
            Тарифы
            <div className="mt-1 rounded-lg border border-white/10 bg-gray-950 p-3">
              <label className="mb-2 inline-flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={form.selected_plan_ids.length === 0}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, selected_plan_ids: e.target.checked ? [] : f.selected_plan_ids }))
                  }
                />
                Все тарифы
              </label>
              <div className="grid gap-2 md:grid-cols-2">
                {planOptions.map((p) => {
                  const checked = form.selected_plan_ids.includes(p.id);
                  return (
                    <label key={p.id} className="inline-flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            selected_plan_ids: e.target.checked
                              ? Array.from(new Set([...f.selected_plan_ids, p.id]))
                              : f.selected_plan_ids.filter((id) => id !== p.id),
                          }))
                        }
                      />
                      {p.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </label>
          <label className="text-xs text-gray-400">
            Срок действия
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={form.period_mode}
              onChange={(e) =>
                setForm((f) => ({ ...f, period_mode: e.target.value as "none" | "7d" | "30d" | "custom" }))
              }
            >
              <option value="none">Бессрочно</option>
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="custom">Своё окно (дата/время)</option>
            </select>
          </label>
          {form.period_mode === "custom" && (
            <>
              <label className="text-xs text-gray-400">
                Срок с
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                  value={form.valid_from}
                  onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                />
              </label>
              <label className="text-xs text-gray-400">
                Срок по
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                  value={form.valid_until}
                  onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                />
              </label>
            </>
          )}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#10a37f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Создать
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-200">Список</p>
        <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
          {items.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <span className="font-mono font-semibold text-[#10a37f]">{row.code}</span>
                <span className="ml-2 text-gray-400">
                  {row.discount_type === "percent" ? `${row.discount_value}%` : `${row.discount_value} ₽`}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  использовано {row.uses_count}
                  {row.max_uses != null ? ` / ${row.max_uses}` : ""}
                </span>
                {!row.is_active && <span className="ml-2 text-xs text-amber-400">выкл</span>}
              </div>
              <button
                type="button"
                onClick={() => void toggle(row)}
                className="text-xs text-gray-400 underline hover:text-gray-200"
              >
                {row.is_active ? "Отключить" : "Включить"}
              </button>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-sm text-gray-500">Пока пусто</p>}
      </div>
    </div>
  );
}
