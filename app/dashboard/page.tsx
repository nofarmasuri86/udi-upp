import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { TrendingUp, ArrowLeft, CalendarDays } from "lucide-react"
import { type ProjectStatus } from "@/types"
import { AddLeadDialog } from "@/components/add-lead-dialog"
import { QuickGalleryUpload } from "@/components/quick-gallery-upload"
import { WeeklyCalendarGrid, type CalendarEvent } from "@/components/weekly-calendar-grid"

type ProjectRow = {
  id: string
  status: ProjectStatus
  price: number | null
  due_date: string | null
  follow_up_at: string | null
  title: string
  client: { name: string } | { name: string }[] | null
}

function getClientName(client: ProjectRow["client"]): string | null {
  if (!client) return null
  return Array.isArray(client)
    ? (client[0] as { name: string })?.name ?? null
    : (client as { name: string }).name
}

/** Sunday of the week that contains `date` */
function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())  // back to Sunday
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekStart = getWeekStart(today)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + (6 - today.getDay()))
  const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`
  const todayStr = today.toISOString().split("T")[0]

  const [clientsRes, projectsRes, paymentsRes, dueRes, followUpRes, quotesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("id, status, price, due_date, follow_up_at, title, client:clients(name)")
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("amount"),
    // due dates this week
    supabase
      .from("projects")
      .select("id, title, due_date, client:clients(name)")
      .in("status", ["new", "in_progress", "waiting_material", "ready", "waiting_deposit"])
      .not("due_date", "is", null)
      .gte("due_date", weekStart).lte("due_date", weekEndStr)
      .order("due_date", { ascending: true }),
    // follow-ups this week
    supabase
      .from("projects")
      .select("id, title, follow_up_at, client:clients(name)")
      .not("follow_up_at", "is", null)
      .gte("follow_up_at", weekStart).lte("follow_up_at", weekEndStr)
      .order("follow_up_at", { ascending: true }),
    // new projects needing a quote
    supabase
      .from("projects")
      .select("id, title, client:clients(name)")
      .eq("status", "new").is("price", null)
      .order("created_at", { ascending: false }).limit(5),
  ])

  const projects = (projectsRes.data ?? []) as unknown as ProjectRow[]
  const totalClients = clientsRes.count ?? 0
  const active = projects.filter(p =>
    ["new", "in_progress", "waiting_material", "ready", "waiting_deposit"].includes(p.status)
  )
  const dueThisWeek = active.filter(p => {
    if (!p.due_date) return false
    const diff = (new Date(p.due_date).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 7
  })
  const totalRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)

  // Build calendar events
  const events: CalendarEvent[] = []

  for (const p of (dueRes.data ?? [])) {
    events.push({
      projectId: p.id,
      title: p.title,
      clientName: getClientName(p.client as ProjectRow["client"]),
      type: "due",
      dateKey: p.due_date!.slice(0, 10),
    })
  }
  for (const p of (followUpRes.data ?? [])) {
    const key = p.follow_up_at!.slice(0, 10)
    if (!events.find(e => e.projectId === p.id && e.dateKey === key)) {
      events.push({
        projectId: p.id,
        title: p.title,
        clientName: getClientName(p.client as ProjectRow["client"]),
        type: "followup",
        dateKey: key,
      })
    }
  }
  for (const p of (quotesRes.data ?? [])) {
    if (!events.find(e => e.projectId === p.id)) {
      events.push({
        projectId: p.id,
        title: p.title,
        clientName: getClientName(p.client as ProjectRow["client"]),
        type: "quote",
        dateKey: todayStr,
      })
    }
  }

  return {
    totalClients,
    activeProjects: active.length,
    dueThisWeek: dueThisWeek.length,
    totalRevenue,
    recentProjects: projects.slice(0, 8),
    weekStart,
    events,
  }
}

const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  new:              "bg-blue-400",
  in_progress:      "bg-amber-400",
  waiting_material: "bg-orange-400",
  waiting_deposit:  "bg-purple-400",
  ready:            "bg-emerald-400",
  delivered:        "bg-slate-400",
  paid:             "bg-green-400",
  cancelled:        "bg-red-400",
}
const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  new: "חדש", in_progress: "בביצוע", waiting_material: "ממתין לחומר",
  ready: "מוכן", delivered: "נמסר", cancelled: "בוטל", paid: "שולם", waiting_deposit: "ממתין הפקדה",
}
const PROJECT_EMOJIS = ["🔧", "🔩", "🪛", "🧩", "⚙️", "🔨", "🪚", "🏠"]

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) return <p className="text-[#151515]/50 p-6">שגיאה בטעינת הנתונים.</p>

  const { totalClients, activeProjects, dueThisWeek, totalRevenue, recentProjects, weekStart, events } = data

  return (
    <div className="flex flex-col gap-6 pb-28 max-w-3xl" dir="rtl">

      {/* Hero — industrial header block */}
      <div className="border border-[#151515] bg-[#151515] p-5 text-[#f3f3f3]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[#8B1A1A] text-xs font-bold tracking-widest uppercase">ברוך הבא בחזרה</p>
            <h1 className="text-3xl font-black mt-1 leading-none">שלום, אודי</h1>
          </div>
          <div className="w-12 h-12 bg-[#8B1A1A] flex items-center justify-center text-2xl shrink-0">🧩</div>
        </div>
        {/* Revenue strip */}
        <div className="border border-[#2a2a2a] bg-[#1e1e1e] p-3 flex items-center justify-between">
          <div>
            <p className="text-[#999] text-xs font-semibold">סה״כ תשלומים</p>
            <p className="text-2xl font-black mt-0.5">₪{totalRevenue.toLocaleString("he-IL")}</p>
          </div>
          <TrendingUp className="h-6 w-6 text-[#8B1A1A]" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <AddLeadDialog />
        <Link href="/dashboard/projects/new"
          className="flex items-center gap-2 bg-[#8B1A1A] text-[#f3f3f3] text-sm font-bold px-4 py-2.5 border border-[#8B1A1A] hover:bg-[#6e1414] active:scale-[0.98] transition-all">
          + עבודה חדשה
        </Link>
      </div>

      {/* Stats — sharp bordered cards */}
      <div className="grid grid-cols-3 gap-0 border border-[#151515]">
        <div className="p-4 border-l border-[#151515]">
          <p className="text-xs font-bold text-[#151515]/50 uppercase tracking-wider mb-2">לקוחות</p>
          <p className="text-3xl font-black text-[#151515]">{totalClients}</p>
        </div>
        <div className="p-4 border-l border-[#151515]">
          <p className="text-xs font-bold text-[#151515]/50 uppercase tracking-wider mb-2">פעילים</p>
          <p className="text-3xl font-black text-[#8B1A1A]">{activeProjects}</p>
        </div>
        <div className="p-4">
          <p className="text-xs font-bold text-[#151515]/50 uppercase tracking-wider mb-2">השבוע</p>
          <p className={`text-3xl font-black ${dueThisWeek > 0 ? "text-[#8B1A1A]" : "text-[#151515]"}`}>{dueThisWeek}</p>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[#151515] pb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#8B1A1A]" />
            <h2 className="text-base font-black text-[#151515] uppercase tracking-wide">לוז השבוע</h2>
          </div>
          <Link href="/dashboard/calendar"
            className="flex items-center gap-1 text-xs font-bold text-[#8B1A1A] border border-[#8B1A1A] px-2.5 py-1 hover:bg-[#8B1A1A] hover:text-[#f3f3f3] transition-colors">
            יומן מלא <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="border border-dashed border-[#151515]/30 py-8 flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-[#151515]/40 text-sm font-medium">אין אירועים השבוע</p>
          </div>
        ) : (
          <WeeklyCalendarGrid events={events} weekStart={weekStart} />
        )}

        <div className="flex gap-4 mt-2">
          {[
            { color: "bg-[#8B1A1A]", label: "מועד סיום" },
            { color: "bg-blue-500", label: "פולו-אפ" },
            { color: "bg-amber-500", label: "הצעת מחיר" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#151515]/40 font-semibold">
              <span className={`w-2 h-2 ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[#151515] pb-2">
          <h2 className="text-base font-black text-[#151515] uppercase tracking-wide">פרויקטים אחרונים</h2>
          <Link href="/dashboard/projects"
            className="flex items-center gap-1 text-xs font-bold text-[#8B1A1A] border border-[#8B1A1A] px-2.5 py-1 hover:bg-[#8B1A1A] hover:text-[#f3f3f3] transition-colors">
            כולם <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="border border-dashed border-[#151515]/30 py-10 flex flex-col items-center gap-2">
            <span className="text-4xl">🔧</span>
            <p className="text-[#151515]/40 text-sm">אין פרויקטים עדיין</p>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {recentProjects.map((project, i) => {
              const clientName = getClientName(project.client)
              const dot = PROJECT_STATUS_DOT[project.status]

              return (
                <div key={project.id} className="shrink-0 w-40 border border-[#151515] bg-white overflow-hidden hover:border-[#8B1A1A] transition-all active:scale-[0.97]">
                  <Link href={`/dashboard/projects/${project.id}`} className="block p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{PROJECT_EMOJIS[i % PROJECT_EMOJIS.length]}</span>
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                    </div>
                    <p className="text-[#151515] text-xs font-bold leading-tight line-clamp-2 min-h-[2rem]">{project.title}</p>
                    {clientName && <p className="text-[#151515]/50 text-[10px] mt-1 truncate">{clientName}</p>}
                    {project.price ? (
                      <p className="text-[#8B1A1A] text-sm font-black mt-1.5">₪{project.price.toLocaleString("he-IL")}</p>
                    ) : (
                      <p className="text-[#151515]/30 text-[10px] mt-1.5">{PROJECT_STATUS_LABELS[project.status]}</p>
                    )}
                  </Link>
                  <div className="px-2 pb-2.5 border-t border-[#e5e5e5] pt-2">
                    <QuickGalleryUpload projectId={project.id} projectTitle={project.title} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

