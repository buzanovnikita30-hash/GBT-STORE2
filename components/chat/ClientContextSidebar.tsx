"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChatRoomListItem } from "@/types/chat-ui";
import { Loader2, MessageCircle } from "lucide-react";

type Summary = {
  profile: {
    id: string;
    email: string | null;
    username: string | null;
    telegram_id: number | null;
    telegram_username: string | null;
    created_at: string;
    last_seen: string | null;
    notes: string | null;
    tags: string[];
    client_stage: string | null;
    role: string;
  } | null;
  effective_stage: string;
  has_active_subscription: boolean;
  active_order: { id: string; status: string; plan_id: string; price: number } | null;
  orders: { id: string; status: string; plan_id: string; price: number; created_at: string }[];
  hint?: string;
};

const STAGE_LABEL: Record<string, string> = {
  purchased: "Купил",
  waiting: "В ожидании",
  no_purchase: "Не покупал",
  needs_help: "Нужна помощь",
  other: "Другое",
};

interface Props {
  room: ChatRoomListItem | null;
  staffBasePath: string;
}

export function ClientContextSidebar({ room, staffBasePath }: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!room?.client_id) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/staff/client-summary?userId=${encodeURIComponent(room.client_id)}&email=${encodeURIComponent(room.client?.email ?? "")}&sessionId=${encodeURIComponent(room.id ?? "")}`,
          { credentials: "include" }
        );
        const json = (await res.json()) as Summary & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Не удалось загрузить");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setErr(e instanceof Error ? e.message : "Ошибка");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [room?.client_id]);

  if (!room) {
    return (
      <div className="hidden w-72 flex-shrink-0 border-l border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-500 xl:block">
        Выберите клиента
      </div>
    );
  }

  return (
    <aside className="hidden w-80 flex-shrink-0 flex-col border-l border-gray-100 bg-gray-50/90 xl:flex">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Карточка клиента</p>
        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
          {room.client?.full_name ?? room.client?.email ?? "Клиент"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </div>
        )}
        {err && <p className="text-red-600">{err}</p>}
        {!loading && !err && data && (
          <div className="space-y-4">
            {data.profile ? (
              <>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="break-all text-gray-900">{data.profile.email ?? room.client?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Имя</p>
              <p className="text-gray-900">{data.profile.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Telegram</p>
              <p className="text-gray-900">
                {data.profile.telegram_username ? `@${data.profile.telegram_username}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Роль профиля</p>
              <p className="text-gray-900">{data.profile.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ID профиля</p>
              <p className="break-all text-gray-900">{data.profile.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Этап</p>
              <p className="font-medium text-gray-900">
                {STAGE_LABEL[data.effective_stage] ?? data.effective_stage}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Подписка</p>
              <p className="text-gray-900">
                {data.has_active_subscription ? "Есть активная" : "Нет активной"}
              </p>
            </div>
            {data.active_order && (
              <div>
                <p className="text-xs text-gray-400">Текущий заказ</p>
                <p className="text-gray-900">
                  {data.active_order.plan_id} · {data.active_order.status}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Заказов всего</p>
              <p className="text-gray-900">{data.orders.length}</p>
            </div>
            {data.profile.notes && (
              <div>
                <p className="text-xs text-gray-400">Заметка</p>
                <p className="whitespace-pre-wrap text-gray-700">{data.profile.notes}</p>
              </div>
            )}
            {data.profile.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-400">Теги</p>
                <p className="text-gray-700">{data.profile.tags.join(", ")}</p>
              </div>
            )}
              </>
            ) : null}
            <Link
              href={`${staffBasePath.replace(/\/$/, "")}/clients?highlight=${encodeURIComponent(room.client_id)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle size={14} />
              Полная карточка
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
