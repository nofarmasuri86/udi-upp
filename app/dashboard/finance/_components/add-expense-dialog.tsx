"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, X } from "lucide-react"
import { addExpenseAction } from "@/app/actions/finance"
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/finance-constants"

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]

export function AddExpenseDialog({ projects }: { projects: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const today = new Date().toISOString().split("T")[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addExpenseAction(formData)
        setOpen(false)
        formRef.current?.reset()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "שגיאה")
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all border border-white/10"
      >
        <Plus className="h-4 w-4" /> הוסף הוצאה
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col gap-4"
            style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2d1010 100%)" }}>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">הוסף הוצאה 💸</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input name="description" required placeholder="תיאור ההוצאה" className="input-dark" />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-red-300 font-semibold mb-1 block">סכום (₪) *</label>
                  <input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"
                    className="input-dark text-left" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs text-red-300 font-semibold mb-1 block">תאריך</label>
                  <input name="expense_date" type="date" defaultValue={today} className="input-dark" />
                </div>
              </div>

              <div>
                <label className="text-xs text-red-300 font-semibold mb-1 block">קטגוריה</label>
                <select name="category" className="input-dark">
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="text-xs text-red-300 font-semibold mb-1 block">פרויקט קשור (אופציונלי)</label>
                  <select name="project_id" className="input-dark">
                    <option value="">— ללא פרויקט ספציפי —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              )}

              <input name="notes" placeholder="הערות (אופציונלי)" className="input-dark" />

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

              <button type="submit" disabled={isPending}
                className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
                {isPending ? "שומר..." : "שמור הוצאה"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-dark {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
        }
        .input-dark::placeholder { color: rgba(255,255,255,0.3); }
        .input-dark:focus { border-color: rgba(239,68,68,0.5); background: rgba(255,255,255,0.09); }
        .input-dark option { background: #1a0a0a; color: white; }
      `}</style>
    </>
  )
}
