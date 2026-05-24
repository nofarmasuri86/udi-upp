"use client"

import { useState, useTransition } from "react"
import { Trash2, CheckCircle, Send, XCircle, Clock } from "lucide-react"
import { deleteQuoteAction, updateQuoteStatusAction } from "@/app/actions/quotes"

type Quote = {
  id: string
  title: string
  client_name: string
  total: number
  status: string
  created_at: string
  valid_days: number
  project_id: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: "טיוטה",   color: "text-white/40 bg-white border-[#e5e5e5]",       icon: <Clock className="h-3 w-3" /> },
  sent:     { label: "נשלחה",   color: "text-[#8B1A1A] bg-blue-500/10 border-blue-500/20",      icon: <Send className="h-3 w-3" /> },
  accepted: { label: "אושרה",   color: "text-green-300 bg-green-500/10 border-green-500/20",  icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "נדחתה",   color: "text-red-300 bg-red-500/10 border-red-500/20",        icon: <XCircle className="h-3 w-3" /> },
}

export function QuoteList({ quotes }: { quotes: Quote[] }) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    startTransition(async () => {
      await deleteQuoteAction(id)
      setConfirmDelete(null)
    })
  }

  function handleStatus(id: string, status: "sent" | "accepted" | "rejected") {
    startTransition(async () => { await updateQuoteStatusAction(id, status) })
  }

  return (
    <div className="flex flex-col gap-2">
      {quotes.map(q => {
        const st = STATUS_MAP[q.status] ?? STATUS_MAP.draft
        const expiresAt = new Date(q.created_at)
        expiresAt.setDate(expiresAt.getDate() + q.valid_days)
        const isExpired = q.status === "sent" && expiresAt < new Date()

        return (
          <div key={q.id} className="rounded-none bg-white border border-[#e5e5e5] px-4 py-3 flex items-center gap-3">
            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none border text-xs font-bold shrink-0 ${st.color}`}>
              {st.icon}
              {st.label}
              {isExpired && <span className="text-[#8B1A1A] mr-1">· פגה</span>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[#151515] text-sm font-bold truncate">{q.title}</p>
              <p className="text-white/40 text-xs mt-0.5">{q.client_name} · ₪{Math.round(q.total).toLocaleString("he-IL")}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {q.status === "draft" && (
                <button onClick={() => handleStatus(q.id, "sent")} disabled={isPending}
                  className="text-[10px] font-bold px-2 py-1 rounded-none bg-blue-500/20 text-[#8B1A1A] hover:bg-blue-500/30 transition-colors">
                  סמן נשלח
                </button>
              )}
              {q.status === "sent" && (
                <>
                  <button onClick={() => handleStatus(q.id, "accepted")} disabled={isPending}
                    className="text-[10px] font-bold px-2 py-1 rounded-none bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                    אושר ✓
                  </button>
                  <button onClick={() => handleStatus(q.id, "rejected")} disabled={isPending}
                    className="text-[10px] font-bold px-2 py-1 rounded-none bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                    נדחה ✗
                  </button>
                </>
              )}
              <button onClick={() => handleDelete(q.id)} disabled={isPending}
                className={`w-7 h-7 rounded-none flex items-center justify-center transition-colors ${
                  confirmDelete === q.id ? "bg-red-500/30 text-red-300" : "bg-white text-white/30 hover:bg-red-500/20 hover:text-red-400"
                }`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

