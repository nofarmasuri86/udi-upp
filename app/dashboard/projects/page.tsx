import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarDays, ChevronLeft } from "lucide-react"
import { PROJECT_STATUS_LABELS } from "@/types"
import type { ProjectStatus } from "@/types"

const STATUS_FILTERS: { label: string; value: ProjectStatus | "all"; emoji: string }[] = [
  { label: "הכל",          value: "all",              emoji: "📋" },
  { label: "חדש",          value: "new",              emoji: "✨" },
  { label: "בביצוע",       value: "in_progress",      emoji: "🔨" },
  { label: "ממתין לחומר",  value: "waiting_material", emoji: "📦" },
  { label: "מוכן",         value: "ready",            emoji: "✅" },
  { label: "נמסר",         value: "delivered",        emoji: "🚚" },
  { label: "שולם",         value: "paid",             emoji: "💰" },
]

const STATUS_COLORS: Record<string, string> = {
  new:              "from-blue-400 to-indigo-500",
  in_progress:      "from-amber-400 to-orange-500",
  waiting_material: "from-orange-400 to-red-400",
  waiting_deposit:  "from-purple-400 to-violet-500",
  ready:            "from-emerald-400 to-green-500",
  delivered:        "from-slate-400 to-gray-500",
  paid:             "from-green-400 to-emerald-600",
  cancelled:        "from-red-400 to-rose-600",
}

const STATUS_GLOW: Record<string, string> = {
  new:              "shadow-blue-500/20 border-blue-500/20",
  in_progress:      "shadow-amber-500/20 border-amber-500/20",
  waiting_material: "shadow-orange-500/20 border-orange-500/20",
  waiting_deposit:  "shadow-purple-500/20 border-purple-500/20",
  ready:            "shadow-emerald-500/20 border-emerald-500/20",
  delivered:        "shadow-white/5 border-white/10",
  paid:             "shadow-green-500/20 border-green-500/20",
  cancelled:        "shadow-red-500/10 border-red-500/10",
}

const STATUS_EMOJI: Record<string, string> = {
  new:              "✨",
  in_progress:      "🔨",
  waiting_material: "📦",
  waiting_deposit:  "🏦",
  ready:            "✅",
  delivered:        "🚚",
  paid:             "💰",
  cancelled:        "❌",
}

type ProjectRow = {
  id: string
  title: string
  status: ProjectStatus
  price: number | null
  due_date: string | null
  client: { id: string; name: string } | { id: string; name: string }[] | null
}

async function getProjects(status?: ProjectStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from("projects")
    .select("id, title, status, price, due_date, client:clients(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  const { data } = await query
  return (data ?? []) as unknown as ProjectRow[]
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeStatus = (status as ProjectStatus | undefined) ?? undefined
  const projects = await getProjects(activeStatus)

  const getClientName = (client: ProjectRow["client"]): string | null => {
    if (!client) return null
    return Array.isArray(client) ? client[0]?.name ?? null : client.name
  }

  return (
    <div className="flex flex-col gap-5 pb-24" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">פרויקטים</h1>
          <p className="text-sm text-blue-300/70 font-medium">{projects.length} עבודות</p>
        </div>
        <Link href="/dashboard/projects/new">
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4" />
            עבודה חדשה
          </button>
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {STATUS_FILTERS.map(({ label, value, emoji }) => {
          const isActive = (!status && value === "all") || status === value
          return (
            <Link
              key={value}
              href={value === "all" ? "/dashboard/projects" : `/dashboard/projects?status=${value}`}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 border ${
                isActive
                  ? "bg-white text-slate-900 border-white shadow-lg shadow-white/20 scale-105"
                  : "bg-white/[0.05] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{emoji}</span>
              {label}
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center gap-4 py-16 text-center mt-4">
          <div className="text-6xl">🪚</div>
          <div>
            <p className="font-bold text-lg text-white">אין פרויקטים</p>
            <p className="text-sm text-white/40 mt-1">לחץ על ״עבודה חדשה״ כדי להתחיל</p>
          </div>
          <Link href="/dashboard/projects/new">
            <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
              עבודה חדשה
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const clientName = getClientName(project.client)
            const gradient = STATUS_COLORS[project.status] ?? "from-slate-400 to-gray-500"
            const glow = STATUS_GLOW[project.status] ?? "shadow-white/5 border-white/10"
            const emoji = STATUS_EMOJI[project.status] ?? "🔨"
            const isOverdue =
              project.due_date &&
              new Date(project.due_date) < new Date() &&
              !["paid", "delivered", "cancelled"].includes(project.status)

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all active:scale-[0.97] cursor-pointer border bg-white/[0.03] ${glow}`}>
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${gradient} px-5 py-5 relative`}>
                    <div className="text-4xl">{emoji}</div>
                    <div className="absolute top-3 left-3 bg-black/20 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {PROJECT_STATUS_LABELS[project.status]}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-base leading-tight flex-1 text-white">{project.title}</h3>
                      <ChevronLeft className="h-4 w-4 text-white/20 mt-0.5 shrink-0" />
                    </div>

                    {clientName && (
                      <p className="text-sm text-blue-300/70 font-medium">{clientName}</p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      {project.price ? (
                        <span className="text-xl font-black text-white">₪{project.price.toLocaleString("he-IL")}</span>
                      ) : (
                        <span className="text-sm text-white/30">ללא מחיר</span>
                      )}

                      {project.due_date && (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${
                          isOverdue ? "text-red-400" : "text-white/40"
                        }`}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(project.due_date).toLocaleDateString("he-IL")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
