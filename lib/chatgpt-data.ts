import {
  CheckCircle2,
  CreditCard,
  Mail,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react";

export type HeroContent = {
  badge: string;
  title: string;
  accentTitle: string;
  subtitle: string;
  trustBadges: string[];
  primaryCta: string;
  secondaryCta: string;
  meta: string;
};

export type TrustMetric = {
  value: string;
  label: string;
};

export type HowItWorksStep = {
  title: string;
  description: string;
  icon: typeof CreditCard;
};

export type SafetyMyth = {
  myth: string;
  fact: string;
};

export type Review = {
  name: string;
  city: string;
  initials: string;
  avatarColor: string;
  date: string;
  text: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  pricePerMonth?: number;
  badge?: string;
  description: string;
  features: string[];
  isPopular: boolean;
  cta: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const HERO_CONTENT: HeroContent = {
  badge: "Активация за 3-5 минут · Работает в России",
  title: "ChatGPT Plus",
  accentTitle: "без иностранной карты",
  subtitle:
    "Подключаем подписку на ваш аккаунт. Пароль не нужен, только email для безопасной активации.",
  trustBadges: ["Гарантия на весь срок", "Поддержка 24/7", "Ваш аккаунт"],
  primaryCta: "Подключить ChatGPT Plus",
  secondaryCta: "Узнать как это работает",
  meta: "Уже 1 200+ подключений · Средний рейтинг 4.9/5",
};

export const TRUST_METRICS: TrustMetric[] = [
  { value: "1 200+", label: "Успешных подключений" },
  { value: "4.9 / 5", label: "Средний рейтинг" },
  { value: "3-5 мин", label: "Время активации" },
  { value: "24/7", label: "Поддержка" },
  { value: "100%", label: "Без иностранной карты" },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: "Выбираете тариф",
    description: "Выбираете подходящий план и оплачиваете удобным способом.",
    icon: CreditCard,
  },
  {
    title: "Отправляете токен",
    description: "После оплаты отправляете временный токен — это не пароль, а ключ для активации. Объясним как.",
    icon: Mail,
  },
  {
    title: "Мы активируем",
    description: "Подключаем подписку на ваш аккаунт за 5–15 минут. Вы ничего не настраиваете.",
    icon: Rocket,
  },
  {
    title: "Готово",
    description: "Получаете уведомление и пользуетесь ChatGPT Plus без ограничений.",
    icon: Sparkles,
  },
];

export const SAFETY_MYTHS: SafetyMyth[] = [
  { myth: "Нам нужен пароль от аккаунта", fact: "Только email для активации" },
  { myth: "Мы видим ваши чаты", fact: "Никакого доступа к переписке" },
  { myth: "Аккаунт могут заблокировать", fact: "Активация через официальный механизм" },
  { myth: "Данные карты у нас", fact: "Оплата через защищенные платежные системы" },
];

export const RUSSIA_POINTS = [
  "Активация не зависит от вашего местоположения",
  "Не нужна иностранная карта или VPN для оплаты",
  "ChatGPT доступен через браузер или приложение как обычно",
];

export const WHY_CHEAPER_POINTS = [
  "ChatGPT Plus стоит $20/месяц при оплате картой США или Европы.",
  "Мы используем официальный механизм активации и даем выгодные условия для пользователей из России.",
  "Вы получаете полноценную подписку на ваш аккаунт с теми же возможностями.",
];

export const REVIEWS: Review[] = [
  {
    name: "Алексей М.",
    city: "Москва",
    initials: "АМ",
    avatarColor: "#3b82f6",
    date: "14 апреля",
    text: "Оформил за 4 минуты. Написал в чат, дал email - все. Уже пользуюсь второй месяц, ни разу не было проблем.",
  },
  {
    name: "Екатерина В.",
    city: "Санкт-Петербург",
    initials: "ЕВ",
    avatarColor: "#10a37f",
    date: "9 апреля",
    text: "Честно, думала что подвох. Но все реально работает. ChatGPT-4 полностью, без ограничений.",
  },
  {
    name: "Дмитрий К.",
    city: "Новосибирск",
    initials: "ДК",
    avatarColor: "#8b5cf6",
    date: "2 апреля",
    text: "Иностранная карта не нужна - это главное для меня. Поддержка отвечает быстро, вопросов не возникало.",
  },
  {
    name: "Марина Л.",
    city: "Краснодар",
    initials: "МЛ",
    avatarColor: "#f59e0b",
    date: "28 марта",
    text: "Пользуюсь для работы - пишу тексты и делаю анализ данных. Подписка работает стабильно уже 3 месяца.",
  },
  {
    name: "Игорь Р.",
    city: "Казань",
    initials: "ИР",
    avatarColor: "#ef4444",
    date: "21 марта",
    text: "Подписка слетела через 2 недели - написал в поддержку, восстановили бесплатно в тот же день.",
  },
  {
    name: "Анна С.",
    city: "Екатеринбург",
    initials: "АС",
    avatarColor: "#06b6d4",
    date: "15 марта",
    text: "Брала уже трижды. Каждый раз быстро и без вопросов. Это просто удобно и спокойно.",
  },
];

// Устаревший экспорт — для обратной совместимости (используй PLUS_PLANS)
export const PLANS: Plan[] = [];

// ─── Актуальные тарифы — только 1 месяц, 3 варианта Plus ─────────────────────

export const PLUS_PLANS_NEW: ExtendedPlan[] = [
  {
    id: "plus-new",
    productId: "chatgpt-plus",
    name: "Для новых аккаунтов",
    price: 1490,
    currency: "₽",
    period: "мес",
    description: "Для аккаунтов без истории Plus подписки",
    features: [
      "GPT-4o без ограничений",
      "Генерация изображений DALL·E 3",
      "Анализ файлов и данных",
      "Веб-поиск",
      "Поддержка 24/7",
      "Гарантия на весь срок",
    ],
    isPopular: false,
    cta: "Подключить за 1 490 ₽",
  },
  {
    id: "plus-std",
    productId: "chatgpt-plus",
    name: "Популярный",
    price: 1990,
    currency: "₽",
    period: "мес",
    badge: "Популярный",
    description: "Универсальный вариант, подходит всем",
    features: [
      "GPT-4o без ограничений",
      "Генерация изображений DALL·E 3",
      "Анализ файлов и данных",
      "Веб-поиск",
      "Поддержка 24/7",
      "Гарантия на весь срок",
      "Приоритетная поддержка",
    ],
    isPopular: true,
    cta: "Подключить за 1 990 ₽",
  },
  {
    id: "plus-fast",
    productId: "chatgpt-plus",
    name: "Быстрая активация",
    price: 2490,
    currency: "₽",
    period: "мес",
    badge: "Быстрее всего",
    description: "Активация в приоритетной очереди",
    features: [
      "GPT-4o без ограничений",
      "Генерация изображений DALL·E 3",
      "Анализ файлов и данных",
      "Веб-поиск",
      "Поддержка 24/7",
      "Гарантия на весь срок",
      "Приоритетная поддержка",
      "Активация в течение 5 минут",
    ],
    isPopular: false,
    cta: "Подключить за 2 490 ₽",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Это точно работает в России?",
    answer:
      "Да. Активация не зависит от вашего местоположения - подписка подключается на аккаунт ChatGPT напрямую.",
  },
  {
    question: "Нужна ли иностранная карта?",
    answer:
      "Нет. Оплата принимается картами российских банков, через СБП и ЮKassa. Никаких иностранных карт.",
  },
  {
    question: "Вы получите доступ к моему аккаунту?",
    answer:
      "Нет. Для активации нужен только email от аккаунта. Пароль мы не запрашиваем и не получаем.",
  },
  {
    question: "Сколько времени занимает активация?",
    answer:
      "В среднем 3-5 минут после оплаты. После активации вы получаете уведомление в чат или на почту.",
  },
  {
    question: "Что если подписка слетит?",
    answer:
      "Если это произошло, мы восстанавливаем подписку бесплатно в течение 24 часов. Это часть гарантии.",
  },
  {
    question: "Можно подключить на мой существующий аккаунт?",
    answer:
      "Да, подписка подключается на ваш текущий ChatGPT-аккаунт. Все данные и история остаются на месте.",
  },
  {
    question: "Чем отличаются тарифы?",
    answer:
      "Все тарифы дают одинаковый полный доступ к ChatGPT Plus. Разница только в сроке и цене.",
  },
  {
    question: "Почему у вас дешевле, чем напрямую?",
    answer:
      "Мы используем официальный механизм активации и помогаем оплатить подписку в рублях без потери качества.",
  },
  {
    question: "Чем ChatGPT Pro отличается от Plus?",
    answer:
      "Pro даёт доступ к o1 pro mode — самой мощной модели OpenAI без каких-либо лимитов. Кроме того, Pro включает расширенный Advanced Voice Mode и безлимитную генерацию изображений. Plus — отличный выбор для ежедневного использования, Pro — для профессиональных задач, где важна максимальная точность модели.",
  },
  {
    question: "Стоит ли переплачивать за Pro?",
    answer:
      "Если вы используете ChatGPT ежедневно для сложных задач — анализ данных, программирование, исследования — Pro окупится быстро. Для обычного использования Plus более чем достаточно. Можно начать с Plus и перейти на Pro в любое время.",
  },
  {
    question: "Что такое токен и зачем вы его просите?",
    answer:
      "Токен — это временный ключ доступа к вашему аккаунту ChatGPT. Он нужен нам только для одного действия — подключения подписки Plus к вашему аккаунту. Мы не получаем доступ к вашим чатам, переписке или личным данным. Токен действует ограниченное время, после активации подписки вы можете завершить все сессии в настройках ChatGPT для полного спокойствия.",
  },
  {
    question: "Не опасно ли отправлять токен?",
    answer:
      "Понимаем ваше беспокойство — это нормально. Токен — это НЕ ваш пароль. С токеном нельзя сменить пароль, удалить аккаунт или получить доступ к платёжным данным. Он используется только для подключения подписки. После активации рекомендуем зайти в Настройки → Безопасность → Завершить все сессии. Тысячи клиентов уже воспользовались нашим сервисом без каких-либо проблем с безопасностью.",
  },
  {
    question: "Что делать после того как отправил токен?",
    answer:
      "Ничего — просто ждите. Обычно активация занимает 5–15 минут. Вы получите уведомление в чате когда подписка будет активирована. Статус заказа также обновится в вашем личном кабинете в реальном времени.",
  },
  {
    question: "Как завершить все сессии после активации?",
    answer:
      "Зайдите на chat.openai.com → нажмите на иконку профиля → Настройки → раздел Безопасность → нажмите «Завершить все сессии». После этого войдите в аккаунт заново — ваша подписка Plus останется активной.",
  },
];

export const GUARANTEE_POINTS = [
  "Если подписка слетит - восстановим бесплатно в течение 24 часов",
  "Если активация не прошла - полный возврат средств",
  "Поддержка на связи 24/7 - не бросаем после оплаты",
];

// ─── Plus / Pro product system ───────────────────────────────────────────────

export type ProductId = "chatgpt-plus" | "chatgpt-pro";

export interface ExtendedPlan {
  id: string;
  productId: ProductId;
  name: string;
  price: number;
  currency: string;
  period: string;
  pricePerMonth?: number;
  badge?: string;
  description: string;
  features: string[];
  isPopular: boolean;
  cta: string;
}

// PLUS_PLANS — алиас на актуальные тарифы
export const PLUS_PLANS: ExtendedPlan[] = PLUS_PLANS_NEW;

// PRO_PLANS — один тариф на 1 месяц
export const PRO_PLANS: ExtendedPlan[] = [
  {
    id: "pro-1",
    productId: "chatgpt-pro",
    name: "1 месяц",
    price: 14990,
    currency: "₽",
    period: "мес",
    badge: "Pro",
    description: "Полная мощность без лимитов",
    features: [
      "o1 pro mode — без ограничений",
      "GPT-4o расширенный доступ",
      "Безлимитная генерация изображений",
      "Расширенный анализ данных",
      "Голосовой режим Advanced Voice",
      "Приоритетная поддержка",
      "Активация в течение 10 минут",
      "Гарантия на весь срок",
    ],
    isPopular: true,
    cta: "Подключить Pro за 14 990 ₽",
  },
];

export const CHATGPT_PLANS = {
  plus: PLUS_PLANS,
  pro: PRO_PLANS,
} as const;

export interface ProductInfo {
  id: ProductId;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  glowColor: string;
  badge?: string;
  features: string[];
}

export const PRODUCTS: ProductInfo[] = [
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    tagline: "Для личных задач",
    description:
      "Доступ к GPT-4o, генерации изображений и анализу данных. Идеально для ежедневного использования.",
    accentColor: "#10a37f",
    glowColor: "rgba(16,163,127,0.15)",
    features: ["GPT-4o", "DALL·E 3", "Анализ файлов", "Веб-поиск"],
  },
  {
    id: "chatgpt-pro",
    name: "ChatGPT Pro",
    tagline: "Для профессионалов",
    description:
      "o1 pro mode без лимитов, расширенный GPT-4o и Advanced Voice. Для тех, кто работает с ИИ серьёзно.",
    accentColor: "#10a37f",
    glowColor: "rgba(16,163,127,0.2)",
    badge: "Новинка",
    features: ["o1 pro mode", "Advanced Voice", "Безлимитно", "Приоритет"],
  },
];

export const RUSSIA_DISCLAIMER =
  "Для использования ChatGPT может потребоваться VPN - это зависит от вашего провайдера и не связано с нашим сервисом.";

export const SAFETY_PRINCIPLES = [
  { icon: Shield, text: "Активация без передачи пароля" },
  { icon: Mail, text: "Работаем только с email" },
  { icon: CheckCircle2, text: "Гарантия возврата при любой проблеме" },
];
