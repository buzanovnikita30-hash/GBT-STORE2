"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion-config";

type CellValue = boolean | string;

interface CompareRow {
  feature: string;
  plus: CellValue;
  pro: CellValue;
}

const ROWS: CompareRow[] = [
  { feature: "GPT-4o доступ", plus: true, pro: true },
  { feature: "o1 reasoning model", plus: "Ограниченно", pro: "Без лимитов" },
  { feature: "o1 pro mode", plus: false, pro: true },
  { feature: "Генерация изображений", plus: "До 40/день", pro: "Безлимитно" },
  { feature: "Анализ файлов", plus: true, pro: true },
  { feature: "Advanced Voice Mode", plus: "Базовый", pro: "Расширенный" },
  { feature: "Контекст окна", plus: "128k токенов", pro: "200k токенов" },
  { feature: "Приоритет в очереди", plus: false, pro: true },
];

function Cell({ value, accentColor }: { value: CellValue; accentColor: string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-[#10a37f]" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-gray-300" />;
  return (
    <span className="text-xs font-medium" style={{ color: accentColor }}>
      {value}
    </span>
  );
}

export function CompareSection() {
  return (
    <section id="compare" className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-12 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            Сравнение
          </span>
          <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
            Plus vs Pro
          </h2>
          <p className="max-w-2xl text-lg text-gray-500">
            Детальное сравнение возможностей двух подписок
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white shadow-sm md:overflow-hidden"
        >
          <div className="min-w-[640px] grid grid-cols-3 border-b border-black/[0.06] md:min-w-0">
            <div className="p-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Возможность
            </div>
            <div className="border-l border-black/[0.06] p-4 text-center text-sm font-bold text-[#10a37f]">
              Plus
            </div>
            <div className="border-l border-black/[0.06] p-4 text-center text-sm font-bold text-[#1a56db]">
              Pro
            </div>
          </div>

          <motion.div variants={staggerContainer} className="min-w-[640px] md:min-w-0">
            {ROWS.map((row, i) => (
              <motion.div
                key={row.feature}
                variants={fadeUp}
                className="grid grid-cols-3 border-b border-black/[0.05] last:border-b-0"
                style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}
              >
                <div className="p-4 text-sm text-gray-700">{row.feature}</div>
                <div className="flex items-center justify-center border-l border-black/[0.05] p-4">
                  <Cell value={row.plus} accentColor="#10a37f" />
                </div>
                <div className="flex items-center justify-center border-l border-black/[0.05] p-4">
                  <Cell value={row.pro} accentColor="#1a56db" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


