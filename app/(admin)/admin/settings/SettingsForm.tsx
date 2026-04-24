"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface Props {
  initialSettings: Record<string, unknown>;
}

const FIELDS = [
  { key: "auto_reply_delay_minutes", label: "Задержка авто-ответа (минут)", type: "number" },
  { key: "operator_telegram_url", label: "Ссылка на оператора в Telegram", type: "text" },
  { key: "night_start_hour", label: "Начало ночного режима (час)", type: "number" },
  { key: "night_end_hour", label: "Конец ночного режима (час)", type: "number" },
];

export function SettingsForm({ initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, String(initialSettings[f.key] ?? "")]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingJson, setPricingJson] = useState(
    JSON.stringify(initialSettings.pricing_plans ?? [], null, 2)
  );
  const [promoJson, setPromoJson] = useState(
    JSON.stringify(initialSettings.promo_codes ?? [], null, 2)
  );
  const [sectionsJson, setSectionsJson] = useState(
    JSON.stringify(
      initialSettings.landing_sections ?? { showReviews: true, showFaq: true, showCompare: true },
      null,
      2
    )
  );

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of FIELDS) {
        payload[field.key] = field.type === "number" ? Number(values[field.key]) : values[field.key];
      }
      payload.pricing_plans = JSON.parse(pricingJson);
      payload.promo_codes = JSON.parse(promoJson);
      payload.landing_sections = JSON.parse(sectionsJson);

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Ошибка сохранения настроек");
        setSaving(false);
        return;
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaving(false);
      setError("Проверь JSON в ценах, промокодах и видимости блоков.");
    }
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {field.label}
          </label>
          <input
            type={field.type}
            value={values[field.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 text-sm text-gray-200 outline-none focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
          />
        </div>
      ))}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Тарифы (JSON)</label>
        <textarea
          value={pricingJson}
          onChange={(e) => setPricingJson(e.target.value)}
          rows={10}
          className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Промокоды (JSON)</label>
        <textarea
          value={promoJson}
          onChange={(e) => setPromoJson(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Видимость блоков лендинга (JSON)</label>
        <textarea
          value={sectionsJson}
          onChange={(e) => setSectionsJson(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#10a37f] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saved && <Check size={14} />}
        {saved ? "Сохранено!" : "Сохранить"}
      </button>
    </div>
  );
}
