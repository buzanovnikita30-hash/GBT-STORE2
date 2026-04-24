-- Промокоды (структурированно; использование лимитируется)
CREATE TABLE IF NOT EXISTS public.promocodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  integer NOT NULL CHECK (discount_value >= 0),
  plan_ids        text[] DEFAULT NULL,
  max_uses        integer,
  uses_count      integer NOT NULL DEFAULT 0,
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promocodes_code_active_idx ON public.promocodes (code) WHERE is_active = true;

-- Скидки для лендинга / тарифов (витрина)
CREATE TABLE IF NOT EXISTS public.landing_discounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  integer NOT NULL CHECK (discount_value >= 0),
  applies_to      text NOT NULL DEFAULT 'all',
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landing_discounts_active_idx ON public.landing_discounts (is_active);

-- Этап клиента (ручная метка; допустимые значения в приложении)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_stage text;

-- Связь отзыва с профилем сайта (опционально)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reviews_profile_id_idx ON public.reviews(profile_id);

ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_discounts ENABLE ROW LEVEL SECURITY;

-- Чтение промокодов/скидок: только админ (операторы не управляют)
CREATE POLICY "promocodes_select_admin" ON public.promocodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "promocodes_write_admin" ON public.promocodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "landing_discounts_select_admin" ON public.landing_discounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "landing_discounts_write_admin" ON public.landing_discounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Сервисная роль обходит RLS; анонимный клиент не читает таблицу напрямую
