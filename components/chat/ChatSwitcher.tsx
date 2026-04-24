"use client";

import { useState } from "react";
import { Bot, Headphones } from "lucide-react";
import { AIChat } from "./AIChat";
import { OperatorChat } from "./OperatorChat";
import { cn } from "@/lib/utils";

type Tab = "ai" | "operator";

interface Props {
  sessionId?: string;
  userId?: string;
  defaultTab?: Tab;
}

export function ChatSwitcher({ sessionId, userId, defaultTab = "ai" }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex h-full flex-col">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-black/[0.06] bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors duration-100",
            tab === "ai"
              ? "bg-white text-[#10a37f] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Bot size={13} />
          AI помощник
        </button>
        <button
          type="button"
          onClick={() => setTab("operator")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors duration-100",
            tab === "operator"
              ? "bg-white text-[#1a56db] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Headphones size={13} />
          Оператор
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        {tab === "ai" ? (
          <AIChat />
        ) : sessionId && userId ? (
          <OperatorChat sessionId={sessionId} userId={userId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-gray-500">
              Войдите в аккаунт, чтобы написать оператору
            </p>
            <a href="/login" className="text-sm text-[#10a37f] hover:underline">
              Войти →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
