"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Loader2 } from "lucide-react";

interface StaffInternalChatProps {
  currentUser: Profile;
}

export function StaffInternalChat({ currentUser }: StaffInternalChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerLabel, setPeerLabel] = useState<string>("Сотрудник");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const peerRes = await fetch("/api/staff/peer", { credentials: "include" });
      const peerJson = (await peerRes.json()) as {
        peerId?: string;
        peerRole?: string;
        error?: string;
      };
      if (!peerRes.ok || !peerJson.peerId) {
        throw new Error(peerJson.error ?? "Не найден собеседник для внутреннего чата");
      }
      setPeerLabel(peerJson.peerRole === "admin" ? "Администратор" : "Оператор");

      const sesRes = await fetch("/api/chat/staff/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ peerUserId: peerJson.peerId }),
      });
      const sesJson = (await sesRes.json()) as { sessionId?: string; error?: string };
      if (!sesRes.ok || !sesJson.sessionId) {
        throw new Error(sesJson.error ?? "Не удалось открыть внутренний чат");
      }
      setSessionId(sesJson.sessionId);
    } catch (e) {
      setSessionId(null);
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Подключаем внутренний чат…
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-red-600">{error ?? "Чат недоступен"}</p>
        <button
          type="button"
          className="text-sm text-[#10a37f] underline"
          onClick={() => void bootstrap()}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <ChatWindow
      key={sessionId}
      currentUser={currentUser}
      sessionId={sessionId}
      roomStatus="open"
      otherPartyName={peerLabel}
      viewerIsStaff
    />
  );
}
