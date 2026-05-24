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
  if (!data) return <p className="text-white/50 p-6">שגיאה בטעינת הנתונים.</p>

  const { totalClients, activeProjects, dueThisWeek, totalRevenue, recentProjects, weekStart, events } = data

  return (
    <div className="flex flex-col gap-5 pb-28" dir="rtl">

      {/* Hero */}
      <div className="rounded-3xl p-5 shadow-2xl text-white relative overflow-hidden border border-red-800/30"
        style={{ background: "linear-gradient(135deg, #3d0a0a 0%, #1a0606 60%, #2a0808 100%)" }}>
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-red-700/20 rounded-full blur-3xl" />
        <div className="absolute -top-6 right-6 w-24 h-24 bg-red-900/30 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-red-300/70 text-xs font-semibold">ברוך הבא בחזרה</p>
              <h1 className="text-2xl font-black mt-0.5">שלום, אודי 👋</h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-2xl shadow-lg shadow-red-700/40">🧩</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3.5 flex items-center justify-between border border-white/10">
            <div>
              <p className="text-blue-200 text-xs font-medium">סה״כ תשלומים</p>
              <p className="text-2xl font-black mt-0.5">₪{totalRevenue.toLocaleString("he-IL")}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2.5">
        <AddLeadDialog />
        <Link href="/dashboard/projects/new"
          className="flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-900 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-red-700/30 hover:scale-105 active:scale-95 transition-all border border-white/10">
          + עבודה חדשה
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl p-3.5 text-white border border-blue-500/30 bg-blue-500/10">
          <div className="text-xl mb-1.5">👤</div>
          <div className="text-2xl font-black">{totalClients}</div>
          <div className="text-blue-300 text-[11px] font-semibold">לקוחות</div>
        </div>
        <div className="rounded-2xl p-3.5 text-white border border-red-700/30 bg-red-700/10">
          <div className="text-xl mb-1.5">🔧</div>
          <div className="text-2xl font-black">{activeProjects}</div>
          <div className="text-red-300 text-[11px] font-semibold">פעילים</div>
        </div>
        <div className={`rounded-2xl p-3.5 text-white border ${dueThisWeek > 0 ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/[0.04]"}`}>
          <div className="text-xl mb-1.5">📅</div>
          <div className="text-2xl font-black">{dueThisWeek}</div>
          <div className="text-red-300 text-[11px] font-semibold">השבוע</div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            <h2 className="text-base font-black text-white">לוז השבוע</h2>
          </div>
          <Link href="/dashboard/calendar"
            className="flex items-center gap-1 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full hover:bg-blue-500/20 transition-colors">
            יומן מלא <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-6 flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-white/30 text-sm font-medium">אין אירועים השבוע</p>
          </div>
        ) : (
          <WeeklyCalendarGrid events={events} weekStart={weekStart} />
        )}

        {/* Legend */}
        <div className="flex gap-3 mt-2 px-1">
          {[
            { color: "bg-red-400", label: "מועד סיום" },
            { color: "bg-blue-400", label: "פולו-אפ" },
            { color: "bg-amber-400", label: "הצעת מחיר" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Recent projects — compact horizontal scroll */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-white">פרויקטים אחרונים</h2>
          <Link href="/dashboard/projects"
            className="flex items-center gap-1 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full hover:bg-blue-500/20 transition-colors">
            כולם <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 flex flex-col items-center gap-2">
            <span className="text-4xl">🪚</span>
            <p className="text-white/30 text-sm">אין פרויקטים עדיין</p>
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {recentProjects.map((project, i) => {
              const clientName = getClientName(project.client)
              const dot = PROJECT_STATUS_DOT[project.status]

              return (
                <div key={project.id} className="shrink-0 w-40 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden hover:border-white/[0.18] transition-all active:scale-[0.97]">
                  <Link href={`/dashboard/projects/${project.id}`} className="block p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{PROJECT_EMOJIS[i % PROJECT_EMOJIS.length]}</span>
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                    </div>
                    <p className="text-white text-xs font-bold leading-tight line-clamp-2 min-h-[2rem]">{project.title}</p>
                    {clientName && <p className="text-blue-300/60 text-[10px] mt-1 truncate">{clientName}</p>}
                    {project.price ? (
                      <p className="text-amber-400 text-sm font-black mt-1.5">₪{project.price.toLocaleString("he-IL")}</p>
                    ) : (
                      <p className="text-white/20 text-[10px] mt-1.5">{PROJECT_STATUS_LABELS[project.status]}</p>
                    )}
                  </Link>
                  <div className="px-2 pb-2.5 border-t border-white/[0.05] pt-2">
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
