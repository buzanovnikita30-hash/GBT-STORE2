import { NextRequest, NextResponse } from "next/server";

type ChatRole = "user" | "assistant";
type KnownTopic =
  | "how_order"
  | "price"
  | "guarantee"
  | "activate_plus"
  | "plus_vs_pro"
  | "token_transfer"
  | "ready_when"
  | "pay_rf"
  | "work_weekend"
  | "contact"
  | "login_issue"
  | "renewal_discount"
  | "cancel_autorenew"
  | "order_status"
  | "refund";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  clientHasAccount?: boolean;
}

const SUPPORT_TELEGRAM = "t.me/subs_support";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function shouldTransferToOperator(text: string): boolean {
  return hasAny(text, [
    "хочу оплатить",
    "как купить",
    "давай оформим",
    "готов оплатить",
    "оформляем",
    "беру",
    "переведи на оператора",
    "позови оператора",
    "нужен оператор",
  ]);
}

function detectKnownTopic(text: string): KnownTopic | null {
  if (hasAny(text, ["как оформить заказ", "как заказать", "как купить", "оформить"])) return "how_order";
  if (hasAny(text, ["сколько стоит", "цена", "стоимость", "тариф"])) return "price";
  if (hasAny(text, ["гарантия", "гарантии"])) return "guarantee";
  if (hasAny(text, ["как активировать", "активировать chatgpt plus", "активация plus"])) return "activate_plus";
  if (hasAny(text, ["чем отличается plus от pro", "plus от pro", "plus или pro"])) return "plus_vs_pro";
  if (hasAny(text, ["как передать данные", "отправить токен", "передать токен", "токен"])) return "token_transfer";
  if (hasAny(text, ["когда будет готова", "когда готово", "когда будет подписка"])) return "ready_when";
  if (hasAny(text, ["оплатить картой рф", "карта рф", "сбп", "оплата"])) return "pay_rf";
  if (hasAny(text, ["работаете ли вы в выходные", "в выходные", "график работы"])) return "work_weekend";
  if (hasAny(text, ["как связаться с поддержкой", "связаться с поддержкой", "оператор", "telegram"])) return "contact";
  if (hasAny(text, ["не работает вход", "не могу войти", "проблема со входом", "логин"])) return "login_issue";
  if (hasAny(text, ["скидки на продление", "скидка на продление", "продление"])) return "renewal_discount";
  if (hasAny(text, ["как отменить автопродление", "отменить автопродление", "автопродление"])) return "cancel_autorenew";
  if (hasAny(text, ["где посмотреть статус заказа", "статус заказа", "мой заказ"])) return "order_status";
  if (hasAny(text, ["как оформить возврат", "возврат средств", "вернуть деньги"])) return "refund";
  return null;
}

function getTopicFromHistory(messages: ChatMessage[]): KnownTopic | null {
  const userTexts = messages
    .filter((message) => message.role === "user")
    .map((message) => normalizeText(message.content));

  const last = userTexts[userTexts.length - 1] ?? "";
  const direct = detectKnownTopic(last);
  if (direct) return direct;

  for (let i = userTexts.length - 2; i >= 0; i -= 1) {
    const topic = detectKnownTopic(userTexts[i] ?? "");
    if (topic) return topic;
  }
  return null;
}

function pickNonRepeatingVariant(variants: string[], previousAssistant: string): string {
  const prev = normalizeText(previousAssistant);
  for (const variant of variants) {
    if (normalizeText(variant) !== prev) return variant;
  }
  return variants[0] ?? "";
}

function topicReply(topic: KnownTopic, previousAssistant: string): string {
  const variants: Record<KnownTopic, string[]> = {
    how_order: [
      "✨ Оформление простое: выбираете тариф, оплачиваете, передаете данные для активации, и мы подключаем подписку.\nОбычно это 5-15 минут.\nПодберем вам лучший вариант прямо сейчас?",
      "🧾 По шагам: 1) выбор тарифа, 2) оплата, 3) передача данных, 4) активация.\nВ среднем подключаем за ~15 минут.\nОформляем подходящий тариф?",
    ],
    price: [
      "💳 По ценам: Plus — 1 490 / 1 990 / 2 490 ₽, Pro — 14 990 ₽.\nДля средней нагрузки обычно оптимален Plus 1 990 ₽.\nЧто важнее: минимальная цена или скорость?",
      "💰 Рекомендация по цене: в большинстве случаев берут Plus 1 990 ₽, а Pro 14 990 ₽ — для высокой интенсивности.\nПодскажите вашу нагрузку, и я скажу точнее.",
    ],
    guarantee: [
      "🛡️ Гарантия есть: если активация не проходит по нашей стороне, делаем возврат.\nПароль не нужен, аккаунт остается вашим, подтверждение приходит от OpenAI.\nХотите, подскажу самый безопасный вариант?",
      "✅ Работаем с гарантией результата: при проблеме по нашей стороне возвращаем оплату.\nВы не передаете пароль и не теряете доступ к аккаунту.\nПродолжим и подберем тариф?",
    ],
    activate_plus: [
      "⚡ Для активации Plus: оплата -> передача данных -> подключение, обычно за ~15 минут.\nВы ничего сложного не настраиваете.\nПодключаем сейчас?",
      "🚀 Plus активируется быстро: после оплаты и данных запускаем сразу, обычно 5-15 минут.\nПароль не нужен.\nГотовы оформить?",
    ],
    plus_vs_pro: [
      "🤖 Plus — лучший баланс цены и возможностей для большинства задач.\nPro — для интенсивной ежедневной работы и максимальной производительности.\nУ вас нагрузка средняя или высокая?",
      "📌 Если пользуетесь умеренно — берите Plus, если много и ежедневно — Pro.\nМогу сразу дать точную рекомендацию.\nКак часто используете ChatGPT?",
    ],
    token_transfer: [
      "🔐 Передается только токен/данные для активации, пароль не нужен.\nАккаунт остается вашим, доступ к переписке мы не берем.\nПоказать коротко, как передать данные?",
      "🧩 Нужен только технический токен для подключения, без передачи пароля.\nПосле активации можете завершить все сессии.\nДать инструкцию в 3 шага?",
    ],
    ready_when: [
      "⏱️ Обычно готово за 5-15 минут после оплаты и передачи данных.\nЕсли выбран приоритетный вариант, часто быстрее.\nЗапускаем подключение?",
      "⌛ После оплаты ориентир по времени — около 15 минут.\nСтатус можно отслеживать в чате.\nНачинаем оформление?",
    ],
    pay_rf: [
      "💸 Да, можно оплатить из РФ: карта, СБП, крипта.\nИностранная карта не нужна.\nПодсказать самый быстрый способ оплаты?",
      "🏦 Для РФ доступны карта, СБП и крипта.\nВыберите удобный способ — и сразу запустим активацию.\nКак удобнее оплатить?",
    ],
    work_weekend: [
      "📆 Да, работаем ежедневно, включая выходные.\nЕсли запрос срочный, ставим в приоритет.\nХотите оформить прямо сейчас?",
      "🟢 На связи и в выходные тоже.\nМожем быстро принять и запустить заявку.\nПодключаем сегодня?",
    ],
    contact: [
      `📩 Поддержка: вкладка «Оператор» или Telegram ${SUPPORT_TELEGRAM}.\nДля срочных кейсов Telegram обычно быстрее.\nПеревести вас к оператору?`,
      `🤝 Оператор доступен во вкладке «Оператор» и в Telegram ${SUPPORT_TELEGRAM}.\nЕсли нужно, сразу передам.\nПодключать оператора?`,
    ],
    login_issue: [
      "🔎 Если не работает вход, проверьте email и повторите авторизацию.\nЕсли ошибка сохраняется, оператор быстро решит вручную.\nПеревести к оператору?",
      "🔐 При проблеме со входом обновите страницу и зайдите снова.\nЕсли не поможет, подключим оператора для ручного решения.\nНужен перевод?",
    ],
    renewal_discount: [
      "🏷️ На продление подбираем выгодный вариант под нагрузку.\nЧаще всего для средней нагрузки подходит Plus 1 990 ₽.\nСмотрим Plus или сразу Pro?",
      "♻️ Продление можно сделать без переплаты.\nНапишите вашу текущую нагрузку, и дам точный вариант.\nКак часто пользуетесь?",
    ],
    cancel_autorenew: [
      "⚙️ Автопродление отключается в настройках аккаунта OpenAI в пару кликов.\nПодписка останется активной до конца периода.\nПоказать короткий путь, где отключить?",
      "🧭 Отключить автопродление можно самостоятельно в настройках OpenAI.\nЭто быстро и безопасно.\nНужна пошаговая инструкция?",
    ],
    order_status: [
      "📦 Статус заказа проверим быстро.\nНапишите время оплаты и контакт из заявки — сразу скажу текущий этап.\nПроверяем?",
      "📍 Для проверки статуса нужен ориентир: время оплаты + контакт из заказа.\nПосле этого дам точный статус.\nОтправите данные?",
    ],
    refund: [
      "↩️ Возврат оформляем, если активация не прошла по нашей стороне.\nНапишите номер/время заказа — проверим кейс.\nПередать вас оператору для быстрого решения?",
      "🧾 По возврату поможем: проверим заявку и условия, после чего дадим точный ответ.\nПришлите время оплаты и контакт.\nПодключать оператора сейчас?",
    ],
  };

  return pickNonRepeatingVariant(variants[topic], previousAssistant);
}

function formatForChatStyle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;
  const hasEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(trimmed);
  return hasEmoji ? trimmed : `✨ ${trimmed}`;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Неверный JSON в запросе" }, { status: 400 });
  }

  const messages: ChatMessage[] = (body.messages ?? [])
    .filter(
      (message): message is ChatMessage =>
        (message?.role === "user" || message?.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Последнее сообщение должно быть от пользователя" },
      { status: 400 }
    );
  }

  if (body.clientHasAccount === false) {
    return NextResponse.json({
      content:
        "🔐 Чтобы продолжить с ассистентом, войдите в аккаунт.\nПосле входа сразу помогу подобрать тариф и быстро оформить подключение.",
    });
  }

  const lastUserMessage = normalizeText(messages[messages.length - 1]?.content ?? "");
  if (shouldTransferToOperator(lastUserMessage)) {
    return NextResponse.json({
      content: "Отлично, сейчас передам вас оператору для быстрого оформления 👇",
    });
  }

  const topic = getTopicFromHistory(messages);
  if (!topic) {
    return NextResponse.json({
      content: `Чтобы не дать неточную информацию, лучше сразу подключу оператора: вкладка «Оператор» или Telegram ${SUPPORT_TELEGRAM}.`,
    });
  }

  const previousAssistant =
    [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const content = formatForChatStyle(topicReply(topic, previousAssistant));
  return NextResponse.json({ content });
}
