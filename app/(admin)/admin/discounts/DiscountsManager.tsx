"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  applies_to: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

type PlanOption = { id: string; label: string; productId: string };
type Scope = "all" | "landing" | "chatgpt-plus" | "chatgpt-pro" | "custom-plan";

type QuickPreset = {
  id: string;
  label: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  scope: Scope;
  period: "none" | "7d" | "30d";
};

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "all-10",
    label: "Вся витрина -10%",
    name: "Скидка 10%",
    discount_type: "percent",
    discount_value: 10,
    scope: "all",
    period: "none",
  },
  {
    id: "plus-15-7d",
    label: "Только Plus -15% (7 дней)",
    name: "Plus -15%",
    discount_type: "percent",
    discount_value: 15,
    scope: "chatgpt-plus",
    period: "7d",
  },
  {
    id: "pro-1000-30d",
    label: "Только Pro -1000 ₽ (30 дней)",
    name: "Pro -1000 ₽",
    discount_type: "fixed",
    discount_value: 1000,
    scope: "chatgpt-pro",
    period: "30d",
  },
];

function toLocalInputDate(iso: string): string {
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrNull(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function DiscountsManager() {
  const [items, setItems] = useState<Row[]>([]);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Скидка 10%",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    scope: "all" as Scope,
    custom_plan_id: "",
    period_mode: "none" as "none" | "7d" | "30d" | "custom",
    valid_from: "",
    valid_until: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/discounts", { credentials: "include" });
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
        productId: p.productId ?? "chatgpt-plus",
        label: `${p.productId === "chatgpt-pro" ? "PRO" : "PLUS"} · ${p.name ?? p.id} (${p.id})`,
      }));
    setPlanOptions(plans);
    setForm((f) => ({
      ...f,
      custom_plan_id: f.custom_plan_id || plans[0]?.id || "",
    }));
  }, []);

  useEffect(() => {
    void load();
    void loadPlans();
  }, [load, loadPlans]);

  const applyPreset = (preset: QuickPreset) => {
    const now = new Date();
    const until =
      preset.period === "7d"
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        : preset.period === "30d"
          ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          : null;
    setForm((f) => ({
      ...f,
      name: preset.name,
      discount_type: preset.discount_type,
      discount_value: preset.discount_value,
      scope: preset.scope,
      period_mode: preset.period,
      valid_from: until ? toLocalInputDate(now.toISOString()) : "",
      valid_until: until ? toLocalInputDate(until.toISOString()) : "",
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const appliesTo =
      form.scope === "custom-plan" ? (form.custom_plan_id || "all") : form.scope;

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

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        applies_to: appliesTo,
        valid_from: toIsoOrNull(validFrom),
        valid_until: toIsoOrNull(validUntil),
      }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Не создано");
      return;
    }
    setForm((f) => ({ ...f, name: "Скидка 10%", period_mode: "none", valid_from: "", valid_until: "" }));
    void load();
  };

  const toggle = async (row: Row) => {
    const res = await fetch("/api/admin/discounts", {
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
        <p className="text-sm font-semibold text-gray-200">Новая скидка на витрине</p>
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
          <label className="text-xs text-gray-400 md:col-span-2">
            Название (для бейджа на сайте)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
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
          <label className="text-xs text-gray-400 md:col-span-2">
            Куда применять скидку
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as Scope }))}
            >
              <option value="all">Везде (все карточки)</option>
              <option value="landing">Только блок витрины (landing)</option>
              <option value="chatgpt-plus">Только продукт Plus</option>
              <option value="chatgpt-pro">Только продукт Pro</option>
              <option value="custom-plan">Один конкретный тариф</option>
            </select>
          </label>
          {form.scope === "custom-plan" && (
            <label className="text-xs text-gray-400 md:col-span-2">
              Выберите тариф
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                value={form.custom_plan_id}
                onChange={(e) => setForm((f) => ({ ...f, custom_plan_id: e.target.value }))}
              >
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}
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
              <option value="custom">Свой период (даты)</option>
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
                <span className="font-medium text-gray-100">{row.name}</span>
                <span className="ml-2 text-gray-400">
                  {row.discount_type === "percent" ? `${row.discount_value}%` : `${row.discount_value} ₽`}
                </span>
                <span className="ml-2 text-xs text-gray-500">→ {row.applies_to}</span>
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
