"use client"

import Link from "next/link"
import { GCalButton } from "@/components/gcal-button"

export type CalendarEvent = {
  projectId: string
  title: string
  clientName: string | null
  type: "due" | "followup" | "quote"
  dateKey: string   // YYYY-MM-DD
}

type WeeklyCalendarGridProps = {
  events: CalendarEvent[]
  weekStart: string  // YYYY-MM-DD — always a Sunday
}

const DAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]

const EVENT_STYLE = {
  due:      { bg: "bg-red-500/20 border-red-500/30",    text: "text-red-200",    emoji: "⏰", label: "מועד" },
  followup: { bg: "bg-blue-500/20 border-blue-500/30",  text: "text-blue-200",   emoji: "📞", label: "פולו-אפ" },
  quote:    { bg: "bg-amber-500/20 border-amber-500/30", text: "text-amber-200", emoji: "💬", label: "הצעה" },
}

export function WeeklyCalendarGrid({ events, weekStart }: WeeklyCalendarGridProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Build 7 day objects from weekStart
  const days = Array.from({ length: 7 }, (_, i) => {
    const [y, m, d] = weekStart.split("-").map(Number)
    const date = new Date(y, m - 1, d + i)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const isToday = date.getTime() === today.getTime()
    const isPast = date < today
    const dayEvents = events.filter(e => e.dateKey === key)
    return { date, key, isToday, isPast, dayEvents, dayNum: date.getDay() }
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]" style={{ scrollbarWidth: "none" }}>
      <div className="min-w-[560px]">

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.07]">
          {days.map(({ date, isToday, isPast, dayNum }, i) => (
            <div key={i} className={`flex flex-col items-center py-2.5 gap-1 border-r border-white/[0.05] last:border-r-0 ${isToday ? "bg-blue-500/10" : ""}`}>
              <span className={`text-[11px] font-bold ${isToday ? "text-blue-400" : isPast ? "text-white/25" : "text-white/50"}`}>
                {DAY_SHORT[dayNum]}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                isToday
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/50"
                  : isPast
                  ? "text-white/25"
                  : "text-white"
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-7 min-h-[120px]">
          {days.map(({ key, isToday, isPast, dayEvents }, i) => (
            <div key={i} className={`border-r border-white/[0.05] last:border-r-0 p-1.5 flex flex-col gap-1 ${isToday ? "bg-blue-500/[0.04]" : ""}`}>
              {dayEvents.length === 0 ? (
                <div className="h-full min-h-[80px]" />
              ) : (
                dayEvents.map((event, ei) => {
                  const s = EVENT_STYLE[event.type]
                  return (
                    <Link key={ei} href={`/dashboard/projects/${event.projectId}`}>
                      <div className={`rounded-lg border px-1.5 py-1 text-[10px] font-semibold leading-tight ${s.bg} ${s.text} hover:opacity-80 transition-opacity cursor-pointer ${isPast ? "opacity-50" : ""}`}>
                        <span className="mr-0.5">{s.emoji}</span>
                        <span className="block truncate mt-0.5">{event.title}</span>
                        {event.clientName && (
                          <span className="block truncate opacity-70 text-[9px]">{event.clientName}</span>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          ))}
        </div>

        {/* GCal links row — only days with due events */}
        {days.some(d => d.dayEvents.some(e => e.type === "due")) && (
          <div className="grid grid-cols-7 border-t border-white/[0.05]">
            {days.map(({ key, dayEvents }, i) => {
              const dueEvents = dayEvents.filter(e => e.type === "due")
              return (
                <div key={i} className="border-r border-white/[0.04] last:border-r-0 p-1 flex flex-col gap-0.5">
                  {dueEvents.map((e, ei) => (
                    <GCalButton key={ei} title={e.title} date={key} clientName={e.clientName} />
                  ))}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
