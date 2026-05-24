-- ============================================================
-- Migration: make_integration
-- תמיכה מלאה באוטומציה עם Make.com / WhatsApp
-- ============================================================

-- ── projects: עמודות נוספות לתמיכה ב-Make ─────────────────

-- מקור יצירת הפרויקט
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'whatsapp', 'ai'));

-- שעות עבודה לתמחור חכם
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(6,2);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS actual_hours numeric(6,2);

-- מרווח ביטחון בהצעת מחיר (אחוז, למשל 15 = 15%)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS safety_margin numeric(5,2);

-- מזהה הודעת WhatsApp המקורית — למניעת כפילויות (idempotency)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS whatsapp_msg_id text UNIQUE;

-- חותמת זמן שליחת ה-webhook ל-Make (להפקת קבלה) — למניעת שליחה כפולה
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS receipt_webhook_sent_at timestamptz;

-- תאריך פולו-אפ — Make יכול לשלוח תזכורת בתאריך זה
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS follow_up_at date;

-- ── clients: עמודות נוספות ────────────────────────────────

-- מקור יצירת הלקוח
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'whatsapp', 'ai'));

-- מספר WhatsApp (עשוי להיות שונה ממספר הטלפון הרגיל)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- ── whatsapp_inbound_log: לוגינג + idempotency ────────────

CREATE TABLE IF NOT EXISTS whatsapp_inbound_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  msg_id        text NOT NULL,                    -- מזהה ייחודי מ-WhatsApp
  direction     text NOT NULL DEFAULT 'inbound'
                  CHECK (direction IN ('inbound', 'outbound')),
  phone_from    text,
  raw_payload   jsonb,                            -- הגוף המלא מ-Make
  action_taken  text,                             -- "created_project", "created_client", etc.
  entity_id     uuid,                             -- ה-ID של הרשומה שנוצרה
  processed_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ON whatsapp_inbound_log(msg_id);  -- מניעת עיבוד כפול
CREATE INDEX ON whatsapp_inbound_log(user_id);

ALTER TABLE whatsapp_inbound_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wil: owner" ON whatsapp_inbound_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
