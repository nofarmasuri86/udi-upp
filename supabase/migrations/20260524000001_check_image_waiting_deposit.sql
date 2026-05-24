-- ============================================================
-- Migration: check_image_waiting_deposit
-- הוספת תמיכה בצילום צ'ק + סטטוס 'ממתין להפקדה'
-- ============================================================

-- שדות צילום צ'ק בטבלת תשלומים
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS check_image_url  text,
  ADD COLUMN IF NOT EXISTS check_image_path text;

-- סטטוס 'waiting_deposit' לפרויקטים
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('new','in_progress','waiting_material','ready','delivered','cancelled','paid','waiting_deposit'));

-- bucket לצילומי צ'קים (פרטי — רק המשתמש שלו)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checks', 'checks', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "checks_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'checks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "checks_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'checks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "checks_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'checks' AND (storage.foldername(name))[1] = auth.uid()::text);
