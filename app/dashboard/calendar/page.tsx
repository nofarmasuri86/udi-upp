import { createClient } from "@/lib/supabase/server"
import { CalendarView } from "./_components/calendar-view"

async function getProjectsForCalendar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("projects")
    .select("id, title, status, price, due_date, client:clients(name)")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .not("status", "in", '("cancelled")')
    .order("due_date", { ascending: true })

  if (!data) return []

  return data.map((p) => ({
    id: p.id as string,
    title: p.title as string,
    status: p.status as string,
    price: p.price as number | null,
    due_date: p.due_date as string,
    clientName: Array.isArray(p.client)
      ? (p.client[0]?.name ?? null)
      : (p.client as { name: string } | null)?.name ?? null,
  })) as Parameters<typeof CalendarView>[0]["projects"]
}

export default async function CalendarPage() {
  const projects = await getProjectsForCalendar()

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">יומן עבודות</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} עבודות עם תאריך יעד
        </p>
      </div>
      <CalendarView projects={projects} />
    </div>
  )
}

