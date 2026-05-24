import { createClient } from "@/lib/supabase/server"
import { GalleryClient } from "./_components/gallery-client"

async function getGalleryData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], projects: [] }

  const [itemsRes, projectsRes] = await Promise.all([
    supabase
      .from("gallery_items")
      .select("id, title, description, image_url, storage_path, project:projects(id, title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", user.id)
      .in("status", ["delivered", "paid", "ready"])
      .order("created_at", { ascending: false }),
  ])

  type RawItem = {
    id: string
    title: string
    description: string | null
    image_url: string
    storage_path: string
    project: { id: string; title: string } | { id: string; title: string }[] | null
  }

  const items = ((itemsRes.data ?? []) as unknown as RawItem[]).map((item) => ({
    ...item,
    project: Array.isArray(item.project) ? (item.project[0] ?? null) : item.project,
  }))

  return {
    items,
    projects: (projectsRes.data ?? []) as { id: string; title: string }[],
  }
}

export default async function GalleryPage() {
  const { items, projects } = await getGalleryData()

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">גלריה ושיווק</h1>
        <p className="text-sm text-muted-foreground">
          העלה תמונות מהשטח וייצר פוסטים שיווקיים בלחיצה אחת
        </p>
      </div>

      <GalleryClient items={items} projects={projects} />
    </div>
  )
}

