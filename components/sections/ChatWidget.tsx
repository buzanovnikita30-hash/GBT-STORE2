"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { Profile } from "@/types";
import type { ClientChatSessionPayload } from "@/types/chat-ui";
import { cn } from "@/lib/utils";
import { useSafePathname } from "@/lib/client/useSafePathname";

export function ChatWidget() {
  const pathname = useSafePathname();
  const onLanding = pathname === "/";
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<ClientChatSessionPayload | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [openSessionLoading, setOpenSessionLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchClientSession = useCallback(async () => {
    const r = await fetch("/api/chat/rooms", { credentials: "include" });
    if (!r.ok) {
      throw new Error("Не удалось получить чат");
    }
    const d = (await r.json()) as ClientChatSessionPayload;
    if (d?.id) setSession(d);
    else throw new Error("Пустой ответ сервера");
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, username, telegram_id, telegram_username, role, created_at, last_seen")
        .eq("id", authUser.id)
        .single();
      setUser(profile as Profile);
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin" || user.role === "operator") return;

    void (async () => {
      try {
        await fetchClientSession();
      } catch {
        setSession(null);
      }

      const u = await fetch("/api/chat/unread", { credentials: "include" });
      const uj = (await u.json()) as { unread?: number };
      setUnread(uj.unread ?? 0);
    })();
  }, [user, fetchClientSession]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    if (user.role === "admin" || user.role === "operator") return;
    if (session?.id) return;

    let cancelled = false;
    setOpenSessionLoading(true);
    setSessionError(null);
    void fetchClientSession()
      .catch((e) => {
        if (!cancelled) setSessionError(e instanceof Error ? e.message : "Ошибка");
      })
      .finally(() => {
        if (!cancelled) setOpenSessionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user, session?.id, fetchClientSession]);

  if (pathname === "/support") return null;
  if (loading) return null;

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <a
          href="/dashboard/chat"
          className="flex items-center gap-2 rounded-full bg-[#10a37f] px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#10a37f]/30 transition-all duration-200 hover:bg-[#0d8f68] sm:px-4 sm:py-3"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Чат поддержки
        </a>
      </div>
    );
  }

  if (user.role === "admin" || user.role === "operator") {
    return (
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <a
          href="/admin/chat"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-gray-900 px-3 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-gray-800 sm:px-4 sm:py-3"
        >
          Панель чата
        </a>
      </div>
    );
  }

  if (onLanding) {
    return (
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <a
          href="/dashboard/chat"
          className="flex items-center gap-2 rounded-full bg-[#10a37f] px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#10a37f]/30 transition-all duration-200 hover:bg-[#0d8f68] sm:px-4 sm:py-3"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Чат поддержки
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300",
          open
            ? "h-[min(560px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-2rem))] translate-y-0 opacity-100"
            : "h-0 w-0 translate-y-4 pointer-events-none opacity-0"
        )}
      >
        {open && session && user && (
          <div className="h-full w-full">
            <ChatWindow
              currentUser={user}
              sessionId={session.id}
              roomStatus={session.status === "closed" ? "closed" : "open"}
              otherPartyName="GBT STORE — поддержка"
              viewerIsStaff={false}
            />
          </div>
        )}
        {open && !session?.id && user && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-gray-600">
            {openSessionLoading && <p>Подключаем чат…</p>}
            {!openSessionLoading && sessionError && (
              <>
                <p className="text-red-600">{sessionError}</p>
                <button
                  type="button"
                  className="text-[#10a37f] underline"
                  onClick={() => {
                    setSessionError(null);
                    setOpenSessionLoading(true);
                    void fetchClientSession()
                      .catch((e) => setSessionError(e instanceof Error ? e.message : "Ошибка"))
                      .finally(() => setOpenSessionLoading(false));
                  }}
                >
                  Повторить
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#10a37f] text-white shadow-lg shadow-[#10a37f]/30 transition-all hover:bg-[#0d8f68]"
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
      >
        {unread > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {Math.min(unread, 9)}
          </span>
        )}
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
