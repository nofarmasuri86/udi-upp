"use client"

import { useState, useTransition, useRef } from "react"
import { UserPlus, X } from "lucide-react"
import { addLeadAction } from "@/app/actions/leads"

export function AddLeadDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addLeadAction(formData)
        setOpen(false)
        formRef.current?.reset()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "שגיאה בשמירה")
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all border border-white/10"
      >
        <UserPlus className="h-4 w-4" />
        ליד חדש
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" dir="rtl">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-6 flex flex-col gap-4"
            style={{ background: "linear-gradient(135deg, #1a0505 0%, #2a0808 100%)" }}>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">הוספת ליד חדש ✨</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-blue-300 font-semibold mb-1 block">שם הלקוח *</label>
                <input
                  name="name"
                  required
                  placeholder="ישראל ישראלי"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.09] transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-blue-300 font-semibold mb-1 block">טלפון</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="050-0000000"
                  dir="ltr"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.09] transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-blue-300 font-semibold mb-1 block">מה הם צריכים?</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="ארון לחדר שינה, מדפים..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.09] transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-blue-300 font-semibold mb-1 block">תאריך פולו-אפ</label>
                <input
                  name="follow_up_at"
                  type="date"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.09] transition-all"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-red-700 to-red-900 text-white font-bold py-3 rounded-2xl shadow-lg shadow-red-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
              >
                {isPending ? "שומר..." : "הוסף ליד"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
