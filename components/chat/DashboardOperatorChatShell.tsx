"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { OperatorChat } from "@/components/chat/OperatorChat";
import type { ChatMessage } from "@/types";

interface Props {
  initialSessionId: string | null;
  userId: string;
  initialMessages: ChatMessage[];
  /** Сообщения в личке поддержки пишет сотрудник (админ/оператор) — тот же API, иной sender_type. */
  replyAsOperator?: boolean;
}

export function DashboardOperatorChatShell({
  initialSessionId,
  userId,
  initialMessages,
  replyAsOperator = false,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialSessionId);

  const requestBody = useMemo(
    () => (initialSessionId ? { sessionId: initialSessionId } : {}),
    [initialSessionId]
  );

  useEffect(() => {
    // Prevent showing an old chat when a fresh session is created.
    setSessionId(initialSessionId);
    setIsLoading(!initialSessionId);
    setError(null);
  }, [initialSessionId]);

  useEffect(() => {
    let isActive = true;

    async function ensureSession() {
      if (sessionId) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/operator/guest/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const payload = (await response.json().catch(() => null)) as
          | { sessionId?: string; error?: string }
          | null;

        if (!response.ok || !payload?.sessionId) {
          throw new Error(payload?.error || "Не удалось получить сессию чата");
        }

        if (isActive) {
          setSessionId(payload.sessionId);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError("Не удалось открыть чат поддержки. Обновите страницу.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    ensureSession();

    return () => {
      isActive = false;
    };
  }, [requestBody, sessionId]);

  if (sessionId) {
    return (
      <OperatorChat
        key={sessionId}
        sessionId={sessionId}
        userId={userId}
        initialMessages={initialMessages}
        replyAsOperator={replyAsOperator}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center gap-2 p-6 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        Загружаем чат поддержки...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center p-6 text-sm text-gray-500">
      {error ?? "Не удалось открыть чат поддержки. Обновите страницу."}
    </div>
  );
}

