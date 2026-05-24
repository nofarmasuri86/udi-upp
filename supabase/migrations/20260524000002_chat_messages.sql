-- ============================================================
-- Migration: chat_messages
-- שמירת היסטוריית שיחות עם הבוט
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON chat_messages(user_id, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat: owner" ON chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
