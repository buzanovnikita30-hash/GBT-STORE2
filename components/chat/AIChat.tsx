"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const QUICK_REPLIES = [
  { id: "token", label: "💬 Отправить токен", text: "Хочу отправить токен для активации подписки" },
  { id: "get-token", label: "❓ Где взять токен?", text: "Как получить токен для активации?" },
  { id: "how-long", label: "⏱ Сколько ждать?", text: "Сколько времени займёт активация?" },
  { id: "safe", label: "🔒 Это безопасно?", text: "Безопасно ли отправлять токен?" },
  { id: "pay", label: "💳 Способы оплаты", text: "Какие есть способы оплаты?" },
  { id: "status", label: "📦 Статус заказа", text: "Хочу узнать статус моего заказа" },
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я помощник GBT STORE. Могу ответить на вопросы о подключении ChatGPT Plus или Pro. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", content: text };
    const history = messages
      .filter((m) => !m.streaming && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = (await res.json()) as { content?: string };
      const content = data.content?.trim();
      if (!content) throw new Error("Empty response");

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content, streaming: false };
        return copy;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          copy[copy.length - 1] = {
            ...last,
            content: "Не удалось получить ответ. Попробуйте ещё раз или нажмите «Оператор».",
            streaming: false,
          };
        }
        return copy;
      });
    } finally {
      setIsTyping(false);
    }
  }

  const showQuickReplies = messages.length <= 1;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[#10a37f] text-white rounded-[16px_16px_4px_16px]"
                  : "bg-gray-100 text-gray-900 rounded-[16px_16px_16px_4px]"
              )}
            >
              {msg.content}
              {msg.streaming && msg.content === "" && (
                <span className="flex gap-1 py-0.5">
                  {[0, 1, 2].map((j) => (
                    <motion.span
                      key={j}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: j * 0.15 }}
                    />
                  ))}
                </span>
              )}
              {msg.streaming && msg.content !== "" && (
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-current align-middle" />
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <div className="border-t border-gray-100 px-3 py-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => sendMessage(q.text)}
                className="shrink-0 rounded-full border border-[#10a37f]/30 px-3 py-1.5 text-xs text-[#10a37f] transition-colors duration-100 hover:bg-[#10a37f]/5"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите вопрос..."
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none transition-colors duration-100 focus:bg-gray-50 focus:ring-2 focus:ring-[#10a37f]/20"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10a37f] text-white transition-opacity duration-100 hover:opacity-90 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
