"use client"

import { CalendarPlus } from "lucide-react"

type GCalButtonProps = {
  title: string
  date: string        // YYYY-MM-DD
  description?: string | null
  clientName?: string | null
}

export function GCalButton({ title, date, description, clientName }: GCalButtonProps) {
  function buildUrl() {
    const [y, m, d] = date.split("-").map(Number)
    const start = `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`
    const nextDay = new Date(y, m - 1, d + 1)
    const end = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, "0")}${String(nextDay.getDate()).padStart(2, "0")}`

    const details = [
      clientName ? `לקוח: ${clientName}` : "",
      description ?? "",
    ].filter(Boolean).join("\n")

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${start}/${end}`,
      details,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  return (
    <a
      href={buildUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      הוסף ל-Google Calendar
    </a>
  )
}
