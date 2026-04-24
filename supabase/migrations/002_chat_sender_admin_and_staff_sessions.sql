-- Расширение чата: sender_type admin, тип сессии staff (админ ↔ оператор)
-- Выполнить в Supabase SQL Editor после 001_initial_schema.sql

-- sender_type: добавить admin
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_type_check
  CHECK (sender_type IN ('client', 'operator', 'admin', 'ai', 'auto'));

-- type сессии: добавить staff
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_type_check;
ALTER TABLE public.chat_sessions ADD CONSTRAINT chat_sessions_type_check
  CHECK (type IN ('operator', 'ai', 'staff'));

-- Участники внутреннего чата staff: user_id и staff_peer_id (канонический порядок uuid в коде)
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS staff_peer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS chat_sessions_staff_peer_idx ON public.chat_sessions(staff_peer_id);

-- Доступ к staff-сессии: оба участника (в дополнение к policies из 001)
DROP POLICY IF EXISTS "sessions_select_staff_participant" ON public.chat_sessions;
CREATE POLICY "sessions_select_staff_participant" ON public.chat_sessions
  FOR SELECT USING (
    type = 'staff'
    AND (auth.uid() = user_id OR auth.uid() = staff_peer_id)
  );

-- Сообщения: staff-чат только для двух участников; support (operator/ai) — клиент или сотрудники
DROP POLICY IF EXISTS "messages_select" ON public.chat_messages;
CREATE POLICY "messages_select" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id
        AND (
          (s.type = 'staff' AND (auth.uid() = s.user_id OR auth.uid() = s.staff_peer_id))
          OR (
            s.type IN ('operator', 'ai')
            AND (
              s.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'operator')
              )
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.chat_messages;
CREATE POLICY "messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id
        AND (
          (s.type = 'staff' AND (auth.uid() = s.user_id OR auth.uid() = s.staff_peer_id))
          OR (
            s.type IN ('operator', 'ai')
            AND (
              s.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'operator')
              )
            )
          )
        )
    )
  );
