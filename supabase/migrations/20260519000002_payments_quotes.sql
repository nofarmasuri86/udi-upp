-- ============================================================
-- Migration: payments_quotes
-- הוספת טבלאות תשלומים והצעות מחיר + סטטוס 'paid' לפרויקטים
-- ============================================================

-- הוספת סטטוס 'paid' לפרויקטים
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('new','in_progress','waiting_material','ready','delivered','cancelled','paid'));

-- טבלת הצעות מחיר
CREATE TABLE IF NOT EXISTS quotes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  line_items    jsonb NOT NULL DEFAULT '[]',
  total         numeric(10,2) NOT NULL DEFAULT 0,
  notes         text,
  sent_at       timestamptz,
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- טבלת תשלומים
CREATE TABLE IF NOT EXISTS payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount            numeric(10,2) NOT NULL,
  payment_date      date NOT NULL DEFAULT CURRENT_DATE,
  method            text CHECK (method IN ('cash','transfer','check','other')),
  morning_doc_id    text,
  morning_doc_url   text,
  receipt_sent_at   timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX ON quotes(project_id);
CREATE INDEX ON quotes(user_id);
CREATE INDEX ON payments(project_id);
CREATE INDEX ON payments(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE quotes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes: owner" ON quotes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments: owner" ON payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
