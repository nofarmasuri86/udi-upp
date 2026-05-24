"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2, Copy, Check, AlertTriangle, ShoppingCart, MessageSquare, Save } from "lucide-react"
import { saveQuoteAction, type QuoteLineItem, type MaterialChecklistItem } from "@/app/actions/quotes"

type CatalogItem = {
  id: string; name: string; category: string; unit: string; unit_price: number; notes: string | null; updated_at: string
}
type Project = { id: string; title: string }

type Props = {
  catalog:  CatalogItem[]
  projects: Project[]
  staleIds: Set<string>   // catalog IDs not updated in >30 days
}

function fmt(n: number) { return `₪${Math.round(n).toLocaleString("he-IL")}` }

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function QuoteBuilder({ catalog, projects, staleIds }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved]   = useState(false)
  const [copied, setCopied] = useState(false)

  const [title,      setTitle]      = useState("")
  const [clientName, setClientName] = useState("")
  const [projectId,  setProjectId]  = useState("")
  const [notes,      setNotes]      = useState("")
  const [marginPct,  setMarginPct]  = useState(15)
  const [validDays,  setValidDays]  = useState(30)

  const [lineItems,   setLineItems]   = useState<(QuoteLineItem & { _id: string; stale?: boolean })[]>([])
  const [checklist,   setChecklist]   = useState<(MaterialChecklistItem & { _id: string })[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [catFilter,   setCatFilter]   = useState("")
  const [error,       setError]       = useState<string | null>(null)

  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.unit_price, 0)
  const marginAmt = subtotal * (marginPct / 100)
  const total     = subtotal + marginAmt

  function addFromCatalog(item: CatalogItem) {
    const isStale = staleIds.has(item.id)
    setLineItems(prev => [...prev, {
      _id: crypto.randomUUID(), name: item.name, unit: item.unit,
      qty: 1, unit_price: item.unit_price, total: item.unit_price,
      catalogId: item.id, stale: isStale,
    }])
    setChecklist(prev => {
      if (prev.find(c => c.name === item.name)) return prev
      return [...prev, { _id: crypto.randomUUID(), name: item.name, qty: 1, unit: item.unit, bought: false }]
    })
    setShowCatalog(false)
  }

  function addCustomLine() {
    setLineItems(prev => [...prev, { _id: crypto.randomUUID(), name: "", unit: "יח׳", qty: 1, unit_price: 0, total: 0 }])
  }

  function updateLine(id: string, field: string, value: string | number) {
    setLineItems(prev => prev.map(l => {
      if (l._id !== id) return l
      const updated = { ...l, [field]: value }
      updated.total = updated.qty * updated.unit_price
      return updated
    }))
  }

  function removeLine(id: string) { setLineItems(prev => prev.filter(l => l._id !== id)) }
  function toggleBought(id: string) { setChecklist(prev => prev.map(c => c._id === id ? { ...c, bought: !c.bought } : c)) }
  function removeChecklistItem(id: string) { setChecklist(prev => prev.filter(c => c._id !== id)) }

  function generateMessage() {
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)
    const lines = lineItems.map(l => `• ${l.name} — ${l.qty} ${l.unit} × ${fmt(l.unit_price)} = ${fmt(l.qty * l.unit_price)}`).join("\n")
    return `📋 *הצעת מחיר — ${title || "עבודת הרכבה"}*
━━━━━━━━━━━━━━━━━━━
${clientName ? `לכבוד: ${clientName}\n` : ""}
📌 *פירוט העבודה:*
${lines}
━━━━━━━━━━━━━━━━━━━
💰 סכום ביניים: ${fmt(subtotal)}
${marginPct > 0 ? `📈 מרווח (${marginPct}%): ${fmt(marginAmt)}\n` : ""}✅ *סה"כ לתשלום: ${fmt(total)}*
━━━━━━━━━━━━━━━━━━━
📅 תוקף ההצעה עד: ${validUntil.toLocaleDateString("he-IL")}
${notes ? `\n📝 הערות: ${notes}` : ""}

לשאלות ניתן לפנות בכל עת 🙏
אודי הרכבות`
  }

  function copyMessage() {
    navigator.clipboard.writeText(generateMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleSave() {
    if (!title.trim()) { setError("חסר כותרת להצעה"); return }
    if (lineItems.length === 0) { setError("יש להוסיף לפחות פריט אחד"); return }
    setError(null)
    startTransition(async () => {
      try {
        await saveQuoteAction({
          project_id: projectId || undefined,
          client_name: clientName,
          title,
          line_items: lineItems.map(({ _id, stale, ...l }) => l),
          materials_checklist: checklist.map(({ _id, ...c }) => c),
          subtotal, margin_pct: marginPct, total, notes, valid_days: validDays,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "שגיאה בשמירה")
      }
    })
  }

  const staleLines = lineItems.filter(l => l.stale)
  const filteredCatalog = catalog.filter(c =>
    !catFilter || c.name.includes(catFilter) || c.category.includes(catFilter)
  )
  const categories = [...new Set(catalog.map(c => c.category))]

  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* Stale price alert */}
      {staleLines.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-bold">שים לב — מחירים לא מעודכנים</p>
            <p className="text-amber-300/70 text-xs mt-0.5">
              {staleLines.map(l => l.name).join(", ")} — המחירים לא עודכנו יותר מ-30 יום. מומלץ לבדוק לפני שליחה.
            </p>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
        <h3 className="text-sm font-black text-white">פרטי ההצעה</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-blue-300 font-semibold mb-1 block">כותרת *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ארון מטבח / מדפי ספרים..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-xs text-blue-300 font-semibold mb-1 block">שם הלקוח</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="ישראל ישראלי"
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50" />
          </div>
        </div>
        {projects.length > 0 && (
          <div>
            <label className="text-xs text-blue-300 font-semibold mb-1 block">קשר לפרויקט</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 [&>option]:bg-[#0d1535]">
              <option value="">— ללא פרויקט —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-blue-300 font-semibold mb-1 block">מרווח רווח (%)</label>
            <input type="number" min={0} max={100} value={marginPct} onChange={e => setMarginPct(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-xs text-blue-300 font-semibold mb-1 block">תוקף (ימים)</label>
            <input type="number" min={1} value={validDays} onChange={e => setValidDays(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">פריטי העבודה</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowCatalog(v => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl hover:bg-blue-500/20 transition-colors">
              <ShoppingCart className="h-3.5 w-3.5" /> מהקטלוג
            </button>
            <button onClick={addCustomLine}
              className="flex items-center gap-1.5 text-xs font-bold text-white/60 bg-white/[0.06] border border-white/10 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <Plus className="h-3.5 w-3.5" /> פריט ידני
            </button>
          </div>
        </div>

        {/* Catalog picker */}
        {showCatalog && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 flex flex-col gap-2">
            <input value={catFilter} onChange={e => setCatFilter(e.target.value)} placeholder="חפש בקטלוג..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 outline-none" />
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat === catFilter ? "" : cat)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${catFilter === cat ? "bg-blue-500 text-white border-blue-500" : "border-white/10 text-white/50 hover:border-white/20"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {filteredCatalog.map(item => (
                <button key={item.id} onClick={() => addFromCatalog(item)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.07] transition-colors text-right w-full group">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-white/40 text-[10px]">{item.category} · {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {staleIds.has(item.id) && <AlertTriangle className="h-3 w-3 text-amber-400" aria-label="מחיר לא מעודכן" />}
                    <span className="text-amber-400 text-xs font-black">{fmt(item.unit_price)}</span>
                    <span className="text-[10px] text-white/30">/{item.unit}</span>
                  </div>
                </button>
              ))}
              {filteredCatalog.length === 0 && <p className="text-white/30 text-xs text-center py-4">אין פריטים בקטלוג</p>}
            </div>
          </div>
        )}

        {/* Line items table */}
        {lineItems.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-[1fr_60px_90px_70px_28px] gap-1 px-1 text-[10px] font-bold text-white/30">
              <span>פריט</span><span className="text-center">כמות</span><span className="text-center">מחיר/יח׳</span><span className="text-left">סה״כ</span><span />
            </div>
            {lineItems.map(line => (
              <div key={line._id} className={`grid grid-cols-[1fr_60px_90px_70px_28px] gap-1 items-center rounded-lg px-2 py-1.5 ${line.stale ? "bg-amber-500/5 border border-amber-500/20" : "bg-white/[0.03] border border-white/[0.05]"}`}>
                <input value={line.name} onChange={e => updateLine(line._id, "name", e.target.value)}
                  placeholder="תיאור פריט"
                  className="bg-transparent text-white text-xs outline-none placeholder:text-white/30 w-full" />
                <input type="number" min={0.01} step={0.01} value={line.qty} onChange={e => updateLine(line._id, "qty", Number(e.target.value))}
                  className="bg-transparent text-white text-xs text-center outline-none w-full" />
                <input type="number" min={0} step={0.01} value={line.unit_price} onChange={e => updateLine(line._id, "unit_price", Number(e.target.value))}
                  className="bg-transparent text-white text-xs text-center outline-none w-full" />
                <span className="text-amber-400 text-xs font-bold text-left">{fmt(line.qty * line.unit_price)}</span>
                <button onClick={() => removeLine(line._id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors">
                  <Trash2 className="h-3 w-3 text-white/30 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {lineItems.length === 0 && (
          <div className="py-6 flex flex-col items-center gap-2">
            <p className="text-white/20 text-sm">הוסף פריטים מהקטלוג או ידנית</p>
          </div>
        )}
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-white/60">
            <span>סכום ביניים</span><span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>מרווח ({marginPct}%)</span><span>+{fmt(marginAmt)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-white border-t border-white/10 pt-2 mt-1">
            <span>סה״כ לתשלום</span><span className="text-amber-400">{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* Materials checklist */}
      {checklist.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
          <h3 className="text-sm font-black text-white">✅ רשימת ציוד לרכישה</h3>
          <div className="flex flex-col gap-2">
            {checklist.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <button onClick={() => toggleBought(item._id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${item.bought ? "bg-green-500 border-green-500" : "border-white/20 hover:border-white/40"}`}>
                  {item.bought && <Check className="h-3 w-3 text-white" />}
                </button>
                <span className={`text-sm flex-1 ${item.bought ? "line-through text-white/30" : "text-white"}`}>
                  {item.name} — {item.qty} {item.unit}
                </span>
                <button onClick={() => removeChecklistItem(item._id)} className="text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
        <label className="text-xs text-blue-300 font-semibold mb-2 block">הערות / שאלות ללקוח</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder={"שאלות לדיוק:\n• גודל מדויק?\n• סוג עץ מועדף?\n• צבע גימור?"}
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50 resize-none" />
      </div>

      {/* Message preview + actions */}
      {lineItems.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-black text-white">הודעה לשליחה</h3>
          </div>
          <pre className="bg-black/30 rounded-xl p-3 text-white/70 text-xs whitespace-pre-wrap leading-relaxed border border-white/[0.05] max-h-48 overflow-y-auto font-sans">
            {generateMessage()}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyMessage}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl border transition-all ${copied ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-white/[0.07] border-white/10 text-white hover:bg-white/10"}`}>
              {copied ? <><Check className="h-4 w-4" />הועתק!</> : <><Copy className="h-4 w-4" />העתק הודעה</>}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(generateMessage())}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl bg-green-600/80 border border-green-500/30 text-white hover:bg-green-600 transition-all">
              📱 שלח בוואטסאפ
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

      {/* Save button */}
      <button onClick={handleSave} disabled={isPending}
        className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-base border transition-all ${saved ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 border-white/10 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"} disabled:opacity-60`}>
        {isPending ? "שומר..." : saved ? <><Check className="h-5 w-5" />נשמר בהצלחה!</> : <><Save className="h-5 w-5" />שמור הצעת מחיר</>}
      </button>
    </div>
  )
}
