const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function resolveSupportEmail(): string | null {
  if (process.env.SUPPORT_NOTIFICATION_EMAIL?.trim()) {
    return process.env.SUPPORT_NOTIFICATION_EMAIL.trim().toLowerCase();
  }
  const fromAdminList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .find(Boolean);
  return fromAdminList ?? null;
}

async function sendSupportEmail(subject: string, text: string, html?: string) {
  const supportEmail = resolveSupportEmail();
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "GBT STORE <noreply@gbt-store.ru>";

  if (!supportEmail || !resendKey) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [supportEmail],
        subject,
        text,
        html: html ?? `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${text}</pre>`,
      }),
    });
    if (!res.ok) {
      console.error("[Email] Ошибка отправки:", await res.text());
    }
  } catch (error) {
    console.error("[Email] Сетевая ошибка:", error);
  }
}

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "GBT STORE <noreply@gbt-store.ru>";
  if (!to || !resendKey) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text,
        html: html ?? `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${text}</pre>`,
      }),
    });
    if (!res.ok) {
      console.error("[Email] Ошибка отправки:", await res.text());
    }
  } catch (error) {
    console.error("[Email] Сетевая ошибка:", error);
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN || !chatId) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[Telegram] Ошибка отправки:", await res.text());
    }
  } catch (err) {
    console.error("[Telegram] Сетевая ошибка:", err);
  }
}

export async function notifyNewUser(user: {
  id?: string;
  username?: string | null;
  email?: string | null;
  telegram_username?: string | null;
}) {
  const text = `🆕 <b>Новый пользователь</b>
📧 Email: ${user.email ?? "не указан"}
📱 Telegram: ${user.telegram_username ? "@" + user.telegram_username : "нет"}
🔗 <a href="${APP_URL}/admin/users">Открыть в админке</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    "Новый пользователь в GBT STORE",
    `Новый пользователь\nEmail: ${user.email ?? "не указан"}\nTelegram: ${user.telegram_username ? "@" + user.telegram_username : "нет"}\nОткрыть: ${APP_URL}/admin/users`
  );
}

export async function notifyNewOrder(
  order: { id: string; plan_name?: string; price: number; account_email?: string },
  user: { email?: string | null }
) {
  const text = `📦 <b>Новый заказ</b>
🛒 Тариф: ${order.plan_name ?? order.id}
💰 Сумма: ${order.price} ₽
📧 Клиент: ${user.email ?? "неизвестен"}
📧 ChatGPT: ${order.account_email ?? "не указан"}
🔗 <a href="${APP_URL}/admin/orders">Открыть заказ</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    "Новый заказ клиента",
    `Новый заказ\nТариф: ${order.plan_name ?? order.id}\nСумма: ${order.price} ₽\nКлиент: ${user.email ?? "неизвестен"}\nChatGPT email: ${order.account_email ?? "не указан"}\nОткрыть: ${APP_URL}/admin/orders`
  );
}

export async function notifyCustomerOrderCreated(payload: {
  customerEmail: string;
  orderId: string;
  planName: string;
  price: number;
  accountEmail?: string;
}) {
  const text = `Здравствуйте!

Ваш заказ успешно создан.

Номер заказа: ${payload.orderId}
Тариф: ${payload.planName}
Сумма: ${payload.price} ₽
Email аккаунта ChatGPT: ${payload.accountEmail ?? "не указан"}

Статус заказа можно смотреть в личном кабинете:
${APP_URL}/dashboard/orders

Поддержка:
${APP_URL}/dashboard/chat`;

  await sendEmail(payload.customerEmail, "Ваш заказ в GBT STORE создан", text);
}

export async function notifyPaymentStatus(
  order: { id: string; plan_name?: string; price: number; account_email?: string },
  status: string
) {
  const emoji = {
    paid: "✅",
    activating: "🔵",
    active: "🟢",
    failed: "❌",
    refunded: "↩️",
    waiting_client: "⏳",
  }[status] ?? "📋";

  const statusNames: Record<string, string> = {
    paid: "Оплачен",
    activating: "В активации",
    active: "Активирован",
    failed: "Ошибка",
    refunded: "Возврат",
    waiting_client: "Ждём токен",
  };

  const text = `${emoji} <b>Статус заказа изменился</b>
📋 Заказ: ${order.id.slice(0, 8)}...
🛒 Тариф: ${order.plan_name ?? "неизвестен"}
💰 Сумма: ${order.price} ₽
📊 Статус: <b>${statusNames[status] ?? status}</b>
📧 ChatGPT: ${order.account_email ?? "не указан"}
🔗 <a href="${APP_URL}/admin/orders">Открыть в админке</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    `Статус заказа: ${statusNames[status] ?? status}`,
    `Статус заказа изменился\nЗаказ: ${order.id}\nТариф: ${order.plan_name ?? "неизвестен"}\nСумма: ${order.price} ₽\nСтатус: ${statusNames[status] ?? status}\nОткрыть: ${APP_URL}/admin/orders`
  );
}

export async function notifyCustomerOrderStatus(payload: {
  customerEmail: string;
  orderId: string;
  planName?: string;
  status: string;
  price: number;
}) {
  const statusNames: Record<string, string> = {
    paid: "Оплачен",
    activating: "В активации",
    active: "Активирован",
    failed: "Ошибка",
    refunded: "Возврат",
    waiting_client: "Ждем данные от клиента",
    pending: "Ожидает оплаты",
  };
  const statusLabel = statusNames[payload.status] ?? payload.status;
  const reviewHint =
    payload.status === "active"
      ? `\nЕсли все понравилось, пожалуйста, оставьте отзыв: ${APP_URL}/reviews`
      : "";

  const text = `Здравствуйте!

Статус вашего заказа обновился.

Номер заказа: ${payload.orderId}
Тариф: ${payload.planName ?? "Подписка"}
Сумма: ${payload.price} ₽
Текущий статус: ${statusLabel}

Проверить статус:
${APP_URL}/dashboard/orders
${reviewHint}

Если нужна помощь:
${APP_URL}/dashboard/chat`;

  await sendEmail(payload.customerEmail, `Статус заказа: ${statusLabel}`, text);
}

export async function notifyNewMessage(
  sessionId: string,
  userEmail: string | null,
  messagePreview: string
) {
  const text = `💬 <b>Новое сообщение от клиента</b>
👤 Клиент: ${userEmail ?? "неизвестен"}
💬 "${messagePreview.slice(0, 100)}${messagePreview.length > 100 ? "..." : ""}"
🔗 <a href="${APP_URL}/admin/chat">Ответить в админке</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    "Новое сообщение в поддержку",
    `Новое сообщение клиента\nКлиент: ${userEmail ?? "неизвестен"}\nСообщение: ${messagePreview.slice(0, 200)}\nОтветить: ${APP_URL}/admin/chat`
  );
}

export async function notifyNewReview(review: {
  author_name?: string | null;
  content: string;
}) {
  const text = `⭐ <b>Новый отзыв на модерации</b>
👤 Автор: ${review.author_name ?? "Аноним"}
💬 "${review.content.slice(0, 150)}..."
🔗 <a href="${APP_URL}/admin/reviews">Модерировать</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    "Новый отзыв на модерации",
    `Новый отзыв\nАвтор: ${review.author_name ?? "Аноним"}\nТекст: ${review.content.slice(0, 200)}\nОткрыть: ${APP_URL}/admin/reviews`
  );
}

export async function notifyDelayedSession(sessionId: string, delayMinutes: number) {
  const text = `🚨 <b>Нет ответа оператора</b>
📋 Сессия: ${sessionId}
⏱ Ожидание: ${delayMinutes} мин
🔗 <a href="${APP_URL}/admin/chat">Открыть чат</a>`;
  await sendTelegramMessage(ADMIN_CHAT_ID, text);
  await sendSupportEmail(
    "Нет ответа оператора",
    `Сессия без ответа оператора\nСессия: ${sessionId}\nОжидание: ${delayMinutes} мин\nОткрыть: ${APP_URL}/admin/chat`
  );
}
