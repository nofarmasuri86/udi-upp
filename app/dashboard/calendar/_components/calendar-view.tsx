"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { he } from "react-day-picker/locale"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, ChevronLeft } from "lucide-react"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/types"
import type { ProjectStatus } from "@/types"
import type { DayButtonProps } from "react-day-picker"

type ProjectItem = {
  id: string
  title: string
  status: ProjectStatus
  price: number | null
  due_date: string
  clientName: string | null
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function CalendarView({ projects }: { projects: ProjectItem[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Group projects by date key
  const projectsByDate = projects.reduce<Record<string, ProjectItem[]>>((acc, p) => {
    const key = p.due_date.slice(0, 10)
    acc[key] = [...(acc[key] ?? []), p]
    return acc
  }, {})

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Selected day's projects
  const selectedKey = selectedDate ? toLocalDateKey(selectedDate) : null
  const selectedProjects = selectedKey ? (projectsByDate[selectedKey] ?? []) : []

  // Upcoming: next 14 days, sorted
  const upcoming = projects
    .filter((p) => {
      const d = new Date(p.due_date)
      d.setHours(0, 0, 0, 0)
      const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 14
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  // Overdue: past + not paid/delivered/cancelled
  const overdue = projects.filter((p) => {
    const d = new Date(p.due_date)
    d.setHours(0, 0, 0, 0)
    return d < today && !["paid", "delivered", "cancelled"].includes(p.status)
  })

  // Custom DayButton with project dots
  const DayButtonWithDots = useCallback(
    ({ day, modifiers, children, ...props }: DayButtonProps) => {
      const key = toLocalDateKey(day.date)
      const dayProjects = projectsByDate[key] ?? []
      const hasOverdue = dayProjects.some(
        (p) => new Date(p.due_date) < today && !["paid", "delivered", "cancelled"].includes(p.status)
      )
      const count = dayProjects.length

      return (
        <CalendarDayButton day={day} modifiers={modifiers} {...props}>
          {children}
          {count > 0 && (
            <span className="flex justify-center gap-0.5">
              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-1 rounded-full ${
                    hasOverdue ? "bg-destructive" : count > 1 ? "bg-orange-500" : "bg-primary"
                  }`}
                />
              ))}
            </span>
          )}
        </CalendarDayButton>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectsByDate]
  )

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start" dir="rtl">
      {/* Calendar */}
      <Card className="w-fit">
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={he}
            captionLayout="label"
            components={{ DayButton: DayButtonWithDots }}
            className="[--cell-size:--spacing(10)]"
          />
        </CardContent>
      </Card>

      {/* Right panel */}
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Overdue warning */}
        {overdue.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                ⚠️ {overdue.length} עבודות באיחור
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="flex flex-col gap-1">
                {overdue.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="flex items-center justify-between text-sm hover:text-foreground text-muted-foreground transition-colors"
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="shrink-0 mr-2 text-xs">
                        {new Date(p.due_date).toLocaleDateString("he-IL")}
                      </span>
                    </Link>
                  </li>
                ))}
                {overdue.length > 3 && (
                  <li className="text-xs text-muted-foreground">ועוד {overdue.length - 3}...</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Selected day */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {selectedDate
                ? selectedDate.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })
                : "בחר יום"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {selectedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין עבודות ביום זה</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selectedProjects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium truncate">{p.title}</span>
                        {p.clientName && (
                          <span className="text-xs text-muted-foreground">{p.clientName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mr-2">
                        {p.price && (
                          <span className="text-xs text-muted-foreground">
                            ₪{p.price.toLocaleString("he-IL")}
                          </span>
                        )}
                        <Badge className={PROJECT_STATUS_COLORS[p.status]} variant="outline">
                          {PROJECT_STATUS_LABELS[p.status]}
                        </Badge>
                        <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming 14 days */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">14 הימים הקרובים ({upcoming.length} עבודות)</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין עבודות ב-14 הימים הקרובים</p>
            ) : (
              <ul className="flex flex-col gap-1 divide-y">
                {upcoming.map((p) => {
                  const dueDate = new Date(p.due_date)
                  const diffDays = Math.round(
                    (dueDate.setHours(0, 0, 0, 0) - today.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const dayLabel =
                    diffDays === 0 ? "היום" : diffDays === 1 ? "מחר" : `בעוד ${diffDays} ימים`

                  return (
                    <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="flex items-center justify-between gap-2 hover:text-foreground transition-colors"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm truncate">{p.title}</span>
                          {p.clientName && (
                            <span className="text-xs text-muted-foreground">{p.clientName}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-0.5">
                          <span className="text-xs font-medium">{dayLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.due_date).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

