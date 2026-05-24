-- ============================================================
-- Migration: finance_quotes
-- הוצאות, קטלוג מחירים, הצעות מחיר
-- ============================================================

-- ── expenses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  category     text NOT NULL DEFAULT 'general'
                 CHECK (category IN ('materials','tools','transport','subcontractor','marketing','general','other')),
  description  text NOT NULL,
  amount       numeric(10,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url  text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses: owner" ON expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON expenses(user_id, expense_date);

-- ── price_catalog ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_catalog (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'חומר',
  unit        text NOT NULL DEFAULT 'יח׳',
  unit_price  numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  notes       text,
  is_active   boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog: owner" ON price_catalog
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON price_catalog(user_id, category);

-- auto-update updated_at on price change
CREATE OR REPLACE FUNCTION update_catalog_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER price_catalog_updated
  BEFORE UPDATE ON price_catalog
  FOR EACH ROW EXECUTE FUNCTION update_catalog_timestamp();

-- ── quotes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id          uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_name         text,
  title               text NOT NULL,
  line_items          jsonb NOT NULL DEFAULT '[]',
  materials_checklist jsonb NOT NULL DEFAULT '[]',
  subtotal            numeric(10,2) NOT NULL DEFAULT 0,
  margin_pct          numeric(5,2)  NOT NULL DEFAULT 15,
  total               numeric(10,2) NOT NULL DEFAULT 0,
  notes               text,
  valid_days          integer NOT NULL DEFAULT 30,
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','accepted','rejected')),
  sent_at             timestamptz,
  accepted_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes: owner" ON quotes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON quotes(user_id, status);
CREATE INDEX ON quotes(project_id);
