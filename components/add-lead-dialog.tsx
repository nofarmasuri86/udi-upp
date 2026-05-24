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
        className="flex items-center gap-2 bg-[#151515] text-[#f3f3f3] text-sm font-bold px-4 py-2.5 border border-[#151515] hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
      >
        <UserPlus className="h-4 w-4" />
        ליד חדש
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" dir="rtl">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative w-full max-w-md border border-[#151515] bg-white p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
              <h2 className="text-lg font-black text-[#151515]">ליד חדש</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 border border-[#151515] flex items-center justify-center hover:bg-[#f3f3f3] transition-colors">
                <X className="h-4 w-4 text-[#151515]" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-[#151515] uppercase tracking-wider mb-1 block">שם הלקוח *</label>
                <input
                  name="name"
                  required
                  placeholder="ישראל ישראלי"
                  className="w-full border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-[#151515] placeholder:text-[#151515]/30 text-sm outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#151515] uppercase tracking-wider mb-1 block">טלפון</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="050-0000000"
                  dir="ltr"
                  className="w-full border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-[#151515] placeholder:text-[#151515]/30 text-sm outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#151515] uppercase tracking-wider mb-1 block">מה הם צריכים?</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="הרכבת ארון, התקנת מדפים..."
                  className="w-full border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-[#151515] placeholder:text-[#151515]/30 text-sm outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#151515] uppercase tracking-wider mb-1 block">תאריך פולו-אפ</label>
                <input
                  name="follow_up_at"
                  type="date"
                  className="w-full border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-[#151515] text-sm outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-[#8B1A1A] font-semibold border border-[#8B1A1A] bg-[#8B1A1A]/5 px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#8B1A1A] text-[#f3f3f3] font-black py-3 text-sm uppercase tracking-widest hover:bg-[#6e1414] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
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
