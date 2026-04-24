"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomListItem } from "@/types/chat-ui";
import { formatTime } from "@/lib/chat/constants";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface RoomListProps {
  selectedClientId: string | null;
  onSelect: (room: ChatRoomListItem) => void;
}

export function RoomList({ selectedClientId, onSelect }: RoomListProps) {
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadRooms = useCallback(async () => {
    const q = debounced ? `&q=${encodeURIComponent(debounced)}` : "";
    const res = await fetch(`/api/chat/rooms?list=1${q}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as ChatRoomListItem[];
      setRooms(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [debounced]);

  useEffect(() => {
    setLoading(true);
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    const channel = supabase
      .channel("rooms-list-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => {
        void loadRooms();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        void loadRooms();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, () => {
        void loadRooms();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, loadRooms]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative border-b border-gray-50 px-3 py-2">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск email или имени…"
          className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#10a37f]/40"
        />
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : !rooms.length ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400">
          <p className="text-sm">Никого не найдено</p>
          <p className="px-2 text-center text-xs">Измените поиск или выберите клиента из списка</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-gray-50 overflow-y-auto">
      {rooms.map((room) => {
        const clientName = room.client?.full_name ?? room.client?.email ?? "Клиент";
        const initials = clientName.slice(0, 2).toUpperCase();
        const hasUnread = (room.unread_operator ?? 0) > 0;
        const isSelected = room.client_id === selectedClientId;

        return (
          <button
            key={room.client_id}
            type="button"
            onClick={() => onSelect(room)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
              isSelected && "bg-[#10a37f]/10 hover:bg-[#10a37f]/10"
            )}
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#10a37f] to-[#0a6b4a] text-sm font-bold text-white">
                {initials}
              </div>
              <div
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                  room.status === "open" ? "bg-green-500" : room.status === "waiting" ? "bg-amber-400" : "bg-gray-300"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-sm",
                    hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"
                  )}
                >
                  {clientName}
                </span>
                {room.last_message_at && (
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatTime(room.last_message_at)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span
                  className={cn("truncate text-xs", hasUnread ? "text-gray-700" : "text-gray-400")}
                >
                  {room.last_message_preview
                    ? room.last_message_preview
                    : room.status === "waiting"
                      ? "⏳ Ожидает ответа"
                      : room.status === "closed"
                        ? "Закрыт"
                        : room.id
                          ? "Активный чат"
                          : "Можно написать первым"}
                </span>
                {hasUnread && (
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#10a37f] text-xs font-medium text-white">
                    {Math.min(room.unread_operator ?? 0, 9)}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
        </div>
      )}
    </div>
  );
}
