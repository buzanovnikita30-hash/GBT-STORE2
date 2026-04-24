"use client";

import { useState } from "react";

type UserItem = {
  id: string;
  email: string | null;
  telegram_username: string | null;
  role: "client" | "operator" | "admin";
  created_at: string;
  ordersCount: number;
  paidTotal: number;
  lastOrderAt: string | null;
};

export function UsersRoleManager({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [roles, setRoles] = useState<Record<string, UserItem["role"]>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  );
  const [operatorEmail, setOperatorEmail] = useState("");
  const [addingOperator, setAddingOperator] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferGrant, setTransferGrant] = useState<"admin" | "operator">("operator");
  const [transferMigrate, setTransferMigrate] = useState(true);
  const [transferring, setTransferring] = useState(false);

  async function saveRole(userId: string) {
    setSavingId(userId);
    setMessage(null);
    const role = roles[userId];
    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const json = (await res.json()) as { error?: string };
    setSavingId(null);
    setMessage(res.ok ? "Роль обновлена" : json.error ?? "Ошибка обновления роли");
  }

  async function addOperatorByEmail() {
    const email = operatorEmail.trim().toLowerCase();
    if (!email) return;
    setAddingOperator(true);
    setMessage(null);

    const res = await fetch("/api/admin/users/operator-by-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json()) as { error?: string; message?: string };
    setAddingOperator(false);

    if (!res.ok) {
      setMessage(json.error ?? "Не удалось назначить оператора");
      return;
    }

    setMessage(json.message ?? "Оператор назначен");
    setOperatorEmail("");
  }

  async function runTransfer() {
    if (!currentUserId || !transferTargetId) return;
    setTransferring(true);
    setMessage(null);
    const res = await fetch("/api/admin/users/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: transferTargetId,
        grant: transferGrant,
        migrateData: transferMigrate,
      }),
    });
    const json = (await res.json()) as {
      error?: string;
      role?: UserItem["role"];
      counts?: { orders: number; chat_sessions: number; chat_messages: number };
    };
    setTransferring(false);
    if (!res.ok) {
      setMessage(json.error ?? "Не удалось передать");
      return;
    }
    if (json.role) {
      setRoles((prev) => ({ ...prev, [transferTargetId]: json.role! }));
    }
    const c = json.counts;
    const extra =
      c && transferMigrate
        ? ` Перенесено: заказов ${c.orders}, чатов ${c.chat_sessions}, сообщений ${c.chat_messages}.`
        : "";
    setMessage(`Роль выдана получателю.${extra} Обновите сессию (перелогин или жёсткое обновление страницы), чтобы JWT подтянул контекст.`);
  }

  const transferCandidates = users.filter((u) => u.id !== currentUserId);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.08] bg-gray-900/70 p-4">
        <p className="text-sm font-semibold text-gray-100">Передача роли и данных</p>
        <p className="mt-1 text-xs text-gray-400">
          Выберите уже зарегистрированный аккаунт. Ваша роль в системе не снимается; получателю
          выдаётся админ или оператор. При переносе данных заказы и чаты с вашего user_id
          привязываются к получателю (заметки и теги профиля объединяются).
        </p>
        {!currentUserId ? (
          <p className="mt-2 text-xs text-amber-400">Не удалось определить текущего пользователя.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#10a37f]"
            >
              <option value="">— Кому передать —</option>
              {transferCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email ?? u.id.slice(0, 8) + "…"} ({u.role})
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-4 text-xs text-gray-300">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="grant"
                  checked={transferGrant === "operator"}
                  onChange={() => setTransferGrant("operator")}
                  className="accent-[#10a37f]"
                />
                Оператор
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="grant"
                  checked={transferGrant === "admin"}
                  onChange={() => setTransferGrant("admin")}
                  className="accent-[#10a37f]"
                />
                Администратор
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={transferMigrate}
                onChange={(e) => setTransferMigrate(e.target.checked)}
                className="accent-[#10a37f]"
              />
              Перенести заказы, сессии чата и сообщения с моего аккаунта
            </label>
            <button
              type="button"
              onClick={() => void runTransfer()}
              disabled={transferring || !transferTargetId}
              className="w-fit rounded-lg bg-[#10a37f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {transferring ? "Передаём..." : "Передать"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-gray-900/70 p-4">
        <p className="text-sm font-semibold text-gray-100">Операторы поддержки</p>
        <p className="mt-1 text-xs text-gray-400">
          Введите email аккаунта и назначьте роль оператора одним кликом.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={operatorEmail}
            onChange={(e) => setOperatorEmail(e.target.value)}
            placeholder="operator@example.com"
            className="flex-1 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#10a37f]"
          />
          <button
            type="button"
            onClick={() => void addOperatorByEmail()}
            disabled={addingOperator || !operatorEmail.trim()}
            className="rounded-lg bg-[#10a37f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {addingOperator ? "Назначаем..." : "Назначить оператором"}
          </button>
        </div>
      </div>

      {message && <p className="text-xs text-gray-400">{message}</p>}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full">
          <thead className="border-b border-white/[0.07] bg-white/[0.02]">
            <tr className="text-left text-xs font-semibold uppercase tracking-widest text-gray-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Telegram</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Заказов</th>
              <th className="px-4 py-3">Оплачено</th>
              <th className="px-4 py-3">Последний заказ</th>
              <th className="px-4 py-3">Регистрация</th>
              <th className="px-4 py-3">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {users.map((u) => (
              <tr key={u.id} className="text-sm text-gray-300">
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.telegram_username ? `@${u.telegram_username}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={roles[u.id]}
                    onChange={(e) =>
                      setRoles((prev) => ({
                        ...prev,
                        [u.id]: e.target.value as UserItem["role"],
                      }))
                    }
                    className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1 text-xs text-gray-100"
                  >
                    <option value="client">client</option>
                    <option value="operator">operator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs">{u.ordersCount}</td>
                <td className="px-4 py-3 text-xs font-semibold text-emerald-300">
                  {u.paidTotal.toLocaleString("ru-RU")} ₽
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {u.lastOrderAt ? new Date(u.lastOrderAt).toLocaleDateString("ru-RU") : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void saveRole(u.id)}
                    disabled={savingId === u.id}
                    className="rounded-lg bg-[#10a37f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === u.id ? "Сохранение..." : "Сохранить"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
