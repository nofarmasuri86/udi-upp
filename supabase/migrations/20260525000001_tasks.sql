CREATE TABLE IF NOT EXISTS tasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'general'
               CHECK (type IN ('daily', 'weekly', 'general')),
  is_done    boolean     NOT NULL DEFAULT false,
  priority   text        NOT NULL DEFAULT 'normal'
               CHECK (priority IN ('low', 'normal', 'high')),
  project_id uuid        REFERENCES projects(id) ON DELETE SET NULL,
  source     text        NOT NULL DEFAULT 'manual'
               CHECK (source IN ('manual', 'agent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at    timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: users manage own"
  ON tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
