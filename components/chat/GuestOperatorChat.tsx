"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const STORAGE_KEY = "guest_operator_session_id";

export function GuestOperatorChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let stopped = false;

    const bootstrap = async () => {
      try {
        const storedSessionId =
          typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

        const sessionRes = await fetch("/api/chat/operator/guest/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: storedSessionId ?? undefined }),
        });
        const sessionData = (await sessionRes.json()) as { sessionId?: string };

        if (!sessionRes.ok || !sessionData.sessionId || stopped) {
          setIsLoading(false);
          return;
        }

        setSessionId(sessionData.sessionId);
        window.localStorage.setItem(STORAGE_KEY, sessionData.sessionId);

        await loadMessages(sessionData.sessionId);
      } finally {
        if (!stopped) setIsLoading(false);
      }
    };

    const loadMessages = async (sid: string) => {
      if (isSendingRef.current) return;
      const res = await fetch(`/api/chat/operator/guest/messages?sessionId=${encodeURIComponent(sid)}`);
      const data = (await res.json()) as { messages?: ChatMessage[] };
      if (!stopped && res.ok) {
        setMessages(data.messages ?? []);
      }
    };

    bootstrap();

    const poll = setInterval(() => {
      if (sessionId) {
        loadMessages(sessionId).catch(() => {});
      }
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(poll);
    };
  }, [sessionId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !sessionId || isSending) return;

    setIsSending(true);
    isSendingRef.current = true;
    setInput("");

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_id: null,
      sender_type: "client",
      content: text,
      attachments: null,
      is_read: false,
      is_auto_reply: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    const res = await fetch("/api/chat/operator/guest/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: text }),
    });

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          session_id: sessionId,
          sender_id: null,
          sender_type: "auto",
          content: "Не удалось отправить сообщение. Попробуйте еще раз.",
          attachments: null,
          is_read: false,
          is_auto_reply: true,
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      const refreshed = await fetch(
        `/api/chat/operator/guest/messages?sessionId=${encodeURIComponent(sessionId)}`
      );
      const data = (await refreshed.json()) as { messages?: ChatMessage[] };
      if (refreshed.ok) setMessages(data.messages ?? []);
    }

    isSendingRef.current = false;
    setIsSending(false);
  }

  const labelByType = (type: ChatMessage["sender_type"]) => {
    if (type === "operator") return "Оператор";
    if (type === "admin") return "Админ";
    if (type === "auto") return "Авто-ответ";
    if (type === "ai") return "AI";
    return null;
  };

  const bubbleByType = (type: ChatMessage["sender_type"]) => {
    if (type === "client") return "bg-[#10a37f] text-white";
    if (type === "operator") return "bg-blue-100 text-blue-800";
    if (type === "admin") return "bg-amber-50 text-amber-900";
    if (type === "ai") return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-[#10a37f]" />
        Подключаем чат с оператором...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            Напишите сообщение, оператор ответит в этом чате.
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_type === "client";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div className="max-w-[80%]">
                {!isOwn && labelByType(msg.sender_type) && (
                  <p className="mb-1 text-[10px] font-semibold text-gray-400">
                    {labelByType(msg.sender_type)}
                  </p>
                )}
                <div className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed", bubbleByType(msg.sender_type))}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-black/[0.06] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите оператору..."
            className="flex-1 rounded-xl border border-black/[0.1] px-3 py-2 text-sm outline-none focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim() || !sessionId}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10a37f] text-white disabled:opacity-40"
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}

