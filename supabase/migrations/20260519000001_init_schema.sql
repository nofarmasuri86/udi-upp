-- ============================================================
-- Migration: init_schema
-- יצירת הטבלאות הבסיסיות לאפליקציית ניהול אודי
-- ============================================================

-- טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text,
  email       text,
  address     text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- טבלת עבודות / הזמנות
CREATE TABLE IF NOT EXISTS projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','in_progress','waiting_material','ready','delivered','cancelled')),
  material      text,
  price         numeric(10,2),
  deposit_paid  numeric(10,2) NOT NULL DEFAULT 0,
  due_date      date,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- טבלת פריטי גלריה
CREATE TABLE IF NOT EXISTS gallery_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  image_url     text NOT NULL,
  storage_path  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- טבלת פוסטים שיווקיים
CREATE TABLE IF NOT EXISTS marketing_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_item_id  uuid NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
  platform         text NOT NULL CHECK (platform IN ('facebook','instagram')),
  content          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX ON clients(user_id);
CREATE INDEX ON projects(user_id);
CREATE INDEX ON projects(client_id);
CREATE INDEX ON projects(status);
CREATE INDEX ON gallery_items(user_id);
CREATE INDEX ON gallery_items(project_id);
CREATE INDEX ON marketing_posts(gallery_item_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;

-- clients
CREATE POLICY "clients: owner" ON clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- projects
CREATE POLICY "projects: owner" ON projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- gallery_items
CREATE POLICY "gallery_items: owner" ON gallery_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- marketing_posts
CREATE POLICY "marketing_posts: owner" ON marketing_posts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket (run via Supabase dashboard or SQL editor)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gallery', 'gallery', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS
-- CREATE POLICY "gallery upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
-- CREATE POLICY "gallery read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'gallery');
-- CREATE POLICY "gallery delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
