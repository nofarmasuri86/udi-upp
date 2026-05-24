"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, Trash2, Edit2, Check, X, AlertTriangle } from "lucide-react"
import { saveCatalogItemAction, deleteCatalogItemAction } from "@/app/actions/quotes"

type CatalogItem = {
  id: string; name: string; category: string; unit: string
  unit_price: number; notes: string | null; updated_at: string
}

const UNITS = ["יחידה", "מ״ר", "מ״ל", "מטר", "שעה", "סט", "קומפלט"]

export function CatalogManager({ catalog, staleIds }: { catalog: CatalogItem[]; staleIds: Set<string> }) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const categories = Array.from(new Set(catalog.map(c => c.category))).sort()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await saveCatalogItemAction(fd)
        setShowAdd(false)
        setEditId(null)
        formRef.current?.reset()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "שגיאה")
      }
    })
  }

  function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    startTransition(async () => {
      await deleteCatalogItemAction(id)
      setConfirmDelete(null)
    })
  }

  const grouped: Record<string, CatalogItem[]> = {}
  for (const item of catalog) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(v => !v); setEditId(null) }}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-[#151515] text-sm font-bold px-4 py-2 rounded-none shadow-lg hover:scale-105 active:scale-95 transition-all border border-[#e5e5e5]">
          <Plus className="h-4 w-4" /> הוסף פריט
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <CatalogForm formRef={formRef} onSubmit={handleSave} isPending={isPending} error={error}
          onCancel={() => setShowAdd(false)} />
      )}

      {/* Catalog items by category */}
      {catalog.length === 0 ? (
        <div className="rounded-none border border-dashed border-[#e5e5e5] py-10 flex flex-col items-center gap-2">
          <span className="text-3xl">📦</span>
          <p className="text-[#151515]/40 text-sm">קטלוג ריק — הוסף פריטים ראשונים</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-[#151515]/50 uppercase tracking-widest mb-1.5 px-1">{cat}</p>
            <div className="flex flex-col gap-1.5">
              {items.map(item => {
                const isStale = staleIds.has(item.id)
                return (
                  <div key={item.id}>
                    {editId === item.id ? (
                      <div className="rounded-none bg-white border border-[#e5e5e5] p-3">
                        <CatalogForm formRef={formRef} onSubmit={handleSave} isPending={isPending}
                          error={error} onCancel={() => setEditId(null)} defaultValues={item} />
                      </div>
                    ) : (
                      <div className="rounded-none bg-white border border-[#e5e5e5] px-3 py-2.5 flex items-center gap-2">
                        {isStale && (
                          <AlertTriangle className="h-3.5 w-3.5 text-[#8B1A1A] shrink-0" aria-label="מחיר לא עודכן מזה 30 יום" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[#151515] text-sm font-semibold truncate">{item.name}</span>
                            <span className="text-[#8B1A1A] font-black text-sm shrink-0">
                              ₪{item.unit_price.toLocaleString("he-IL")}<span className="text-[#151515]/40 font-normal text-xs">/{item.unit}</span>
                            </span>
                          </div>
                          {item.notes && <p className="text-[#151515]/40 text-xs mt-0.5 truncate">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditId(item.id); setShowAdd(false) }}
                            className="w-7 h-7 rounded-none bg-white hover:bg-white/10 flex items-center justify-center transition-colors">
                            <Edit2 className="h-3.5 w-3.5 text-[#151515]/40" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} disabled={isPending}
                            className={`w-7 h-7 rounded-none flex items-center justify-center transition-colors ${
                              confirmDelete === item.id ? "bg-red-500/20 text-red-600" : "bg-white text-[#151515]/30 hover:bg-red-500/10 hover:text-red-600"
                            }`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function CatalogForm({
  formRef, onSubmit, isPending, error, onCancel, defaultValues,
}: {
  formRef: React.RefObject<HTMLFormElement | null>
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  error: string | null
  onCancel: () => void
  defaultValues?: { id?: string; name?: string; category?: string; unit?: string; unit_price?: number; notes?: string | null }
}) {
  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-2">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <div className="grid grid-cols-2 gap-2">
        <input name="name" required placeholder="שם פריט" defaultValue={defaultValues?.name}
          className="catalog-input col-span-2" />
        <input name="category" required placeholder="קטגוריה (למשל: ריהוט, עץ)" defaultValue={defaultValues?.category}
          className="catalog-input" />
        <select name="unit" defaultValue={defaultValues?.unit ?? "יחידה"} className="catalog-input">
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <input name="unit_price" type="number" min="0" step="0.01" required placeholder="מחיר ליחידה (₪)"
          defaultValue={defaultValues?.unit_price} className="catalog-input" dir="ltr" />
        <input name="notes" placeholder="הערות (אופציונלי)" defaultValue={defaultValues?.notes ?? ""}
          className="catalog-input" />
      </div>
      {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-none px-3 py-2">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-1.5 bg-purple-600 text-[#151515] text-sm font-bold px-4 py-2 rounded-none hover:bg-purple-500 transition-colors disabled:opacity-60">
          <Check className="h-4 w-4" /> {isPending ? "שומר..." : "שמור"}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 bg-white border border-[#e5e5e5] text-[#151515]/60 text-sm font-semibold px-4 py-2 rounded-none hover:bg-[#f3f3f3] transition-colors">
          <X className="h-4 w-4" /> ביטול
        </button>
      </div>
      <style jsx global>{`
        .catalog-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem; padding: 0.5rem 0.875rem; color: white; font-size: 0.875rem; outline: none;
        }
        .catalog-input::placeholder { color: rgba(255,255,255,0.3); }
        .catalog-input:focus { border-color: rgba(139,92,246,0.5); background: rgba(255,255,255,0.09); }
        .catalog-input option { background: #0d1020; color: white; }
      `}</style>
    </form>
  )
}

