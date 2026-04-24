"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Profile } from "@/types";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { formatDate } from "@/lib/chat/constants";
import { cn } from "@/lib/utils";
import type { ChatRoomListItem } from "@/types/chat-ui";

type RoomStatus = NonNullable<ChatRoomListItem["status"]> | "open" | "closed" | "waiting";

interface ChatWindowProps {
  currentUser: Profile;
  sessionId: string;
  roomStatus?: RoomStatus;
  otherPartyName?: string;
  /** Для подзаголовка: клиент в ЛК или сотрудник в админке */
  viewerIsStaff: boolean;
}

function messageIsOwn(msg: ChatMessage, currentUserId: string): boolean {
  return Boolean(msg.sender_id && msg.sender_id === currentUserId);
}

export function ChatWindow({
  currentUser,
  sessionId,
  roomStatus = "open",
  otherPartyName,
  viewerIsStaff,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(
        `/api/chat/messages?session_id=${encodeURIComponent(sessionId)}`,
        { credentials: "include" }
      );
      const data = (await res.json()) as { messages?: ChatMessage[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      setMessages(data.messages ?? []);
    } catch (e: unknown) {
      if (!silent) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки сообщений");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom(messages.length > 1);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void loadMessages({ silent: true });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, loadMessages]);

  /** Резерв, если Realtime не доставляет события (репликация / RLS). */
  useEffect(() => {
    const t = window.setInterval(() => {
      void loadMessages({ silent: true });
    }, 4000);
    return () => window.clearInterval(t);
  }, [sessionId]);

  const mergeById = useCallback((prev: ChatMessage[], additions: ChatMessage[]) => {
    const map = new Map<string, ChatMessage>();
    for (const m of prev) map.set(m.id, m);
    for (const m of additions) map.set(m.id, m);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  const handleSend = async (
    text: string,
    attachment?: { url: string; type: string; name: string }
  ) => {
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        session_id: sessionId,
        content: text.trim(),
        attachment: attachment ?? null,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      message?: ChatMessage;
      autoReply?: ChatMessage | null;
    };
    if (!res.ok) throw new Error(data.error ?? "Ошибка отправки");

    const toAdd: ChatMessage[] = [];
    if (data.message) toAdd.push(data.message);
    if (data.autoReply) toAdd.push(data.autoReply);
    if (toAdd.length) {
      setMessages((prev) => mergeById(prev, toAdd));
      scrollToBottom(true);
    }
    void loadMessages({ silent: true });
  };

  const grouped: { date: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else grouped.push({ date, messages: [msg] });
  }

  const closed = roomStatus === "closed";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
            viewerIsStaff ? "bg-amber-100 text-amber-800" : "bg-[#10a37f]/15 text-[#10a37f]"
          )}
        >
          {viewerIsStaff ? "К" : "G"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {otherPartyName ?? (viewerIsStaff ? "Клиент" : "GBT STORE — поддержка")}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                roomStatus === "open" ? "bg-green-500" : roomStatus === "waiting" ? "bg-amber-400" : "bg-gray-300"
              )}
            />
            <span className="text-xs text-gray-400">
              {roomStatus === "open"
                ? "Активен"
                : roomStatus === "waiting"
                  ? "Ожидает ответа"
                  : roomStatus === "closed"
                    ? "Закрыт"
                    : "Чат"}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="text-sm">Загрузка...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => void loadMessages()}
              className="text-sm text-[#10a37f] underline hover:text-[#0d8f68]"
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <p className="text-sm">Нет сообщений. Начните диалог.</p>
          </div>
        )}

        {!loading &&
          !error &&
          grouped.map(({ date, messages: dayMsgs }) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="bg-gray-50 px-2 text-xs text-gray-400">{date}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              {dayMsgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={messageIsOwn(msg, currentUser.id)}
                />
              ))}
            </div>
          ))}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={closed}
        placeholder={closed ? "Чат закрыт" : "Напишите сообщение…"}
      />
    </div>
  );
}
