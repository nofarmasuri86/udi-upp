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

  const inputCls = "w-full border border-[#151515] bg-[#f3f3f3] px-3 py-2 text-[#151515] text-sm placeholder:text-[#151515]/30 outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors"

  return (
    <div className="flex flex-col gap-4" dir="rtl">

      {/* Stale price alert */}
      {staleLines.length > 0 && (
        <div className="border border-amber-600 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm font-bold">שים לב — מחירים לא מעודכנים</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {staleLines.map(l => l.name).join(", ")} — המחירים לא עודכנו יותר מ-30 יום.
            </p>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="border border-[#151515] bg-white p-4 flex flex-col gap-3">
        <h3 className="text-sm font-black text-[#151515] uppercase tracking-wider border-b border-[#e5e5e5] pb-2">פרטי ההצעה</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-1 block">כותרת *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="התקנת ארון / הרכבת מדפים..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-1 block">שם הלקוח</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="ישראל ישראלי" className={inputCls} />
          </div>
        </div>
        {projects.length > 0 && (
          <div>
            <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-1 block">קשר לפרויקט</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="">— ללא פרויקט —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-1 block">מרווח רווח (%)</label>
            <input type="number" min={0} max={100} value={marginPct} onChange={e => setMarginPct(Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-1 block">תוקף (ימים)</label>
            <input type="number" min={1} value={validDays} onChange={e => setValidDays(Number(e.target.value))} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="border border-[#151515] bg-white p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
          <h3 className="text-sm font-black text-[#151515] uppercase tracking-wider">פריטי העבודה</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowCatalog(v => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#8B1A1A] border border-[#8B1A1A] px-3 py-1.5 hover:bg-[#8B1A1A] hover:text-[#f3f3f3] transition-colors">
              <ShoppingCart className="h-3.5 w-3.5" /> מהקטלוג
            </button>
            <button onClick={addCustomLine}
              className="flex items-center gap-1.5 text-xs font-bold text-[#151515] border border-[#151515] px-3 py-1.5 hover:bg-[#151515] hover:text-[#f3f3f3] transition-colors">
              <Plus className="h-3.5 w-3.5" /> פריט ידני
            </button>
          </div>
        </div>

        {/* Catalog picker */}
        {showCatalog && (
          <div className="border border-[#e5e5e5] bg-[#f3f3f3] p-3 flex flex-col gap-2">
            <input value={catFilter} onChange={e => setCatFilter(e.target.value)} placeholder="חפש בקטלוג..."
              className="w-full border border-[#151515] bg-white px-3 py-1.5 text-[#151515] text-xs placeholder:text-[#151515]/30 outline-none focus:border-[#8B1A1A]" />
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat === catFilter ? "" : cat)}
                  className={`text-[11px] font-bold px-2.5 py-1 border transition-colors ${catFilter === cat ? "bg-[#8B1A1A] text-[#f3f3f3] border-[#8B1A1A]" : "border-[#151515] text-[#151515] hover:bg-[#151515] hover:text-[#f3f3f3]"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
              {filteredCatalog.map(item => (
                <button key={item.id} onClick={() => addFromCatalog(item)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-white border border-transparent hover:border-[#e5e5e5] transition-colors text-right w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#151515] text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-[#151515]/50 text-[10px]">{item.category} · {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {staleIds.has(item.id) && <AlertTriangle className="h-3 w-3 text-amber-600" aria-label="מחיר לא מעודכן" />}
                    <span className="text-[#8B1A1A] text-xs font-black">{fmt(item.unit_price)}</span>
                    <span className="text-[10px] text-[#151515]/40">/{item.unit}</span>
                  </div>
                </button>
              ))}
              {filteredCatalog.length === 0 && <p className="text-[#151515]/40 text-xs text-center py-4">אין פריטים בקטלוג</p>}
            </div>
          </div>
        )}

        {/* Line items table */}
        {lineItems.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_60px_90px_70px_28px] gap-1 px-1 text-[10px] font-black text-[#151515]/40 uppercase tracking-wider">
              <span>פריט</span><span className="text-center">כמות</span><span className="text-center">מחיר/יח׳</span><span className="text-left">סה״כ</span><span />
            </div>
            {lineItems.map(line => (
              <div key={line._id} className={`grid grid-cols-[1fr_60px_90px_70px_28px] gap-1 items-center px-2 py-2 border ${line.stale ? "bg-amber-50 border-amber-400" : "bg-[#f3f3f3] border-[#e5e5e5]"}`}>
                <input value={line.name} onChange={e => updateLine(line._id, "name", e.target.value)}
                  placeholder="תיאור פריט"
                  className="bg-transparent text-[#151515] text-xs outline-none placeholder:text-[#151515]/30 w-full" />
                <input type="number" min={0.01} step={0.01} value={line.qty} onChange={e => updateLine(line._id, "qty", Number(e.target.value))}
                  className="bg-transparent text-[#151515] text-xs text-center outline-none w-full" />
                <input type="number" min={0} step={0.01} value={line.unit_price} onChange={e => updateLine(line._id, "unit_price", Number(e.target.value))}
                  className="bg-transparent text-[#151515] text-xs text-center outline-none w-full" />
                <span className="text-[#8B1A1A] text-xs font-bold text-left">{fmt(line.qty * line.unit_price)}</span>
                <button onClick={() => removeLine(line._id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-100 transition-colors">
                  <Trash2 className="h-3 w-3 text-[#151515]/30 hover:text-[#8B1A1A]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {lineItems.length === 0 && (
          <div className="py-6 flex flex-col items-center gap-2 border border-dashed border-[#151515]/20">
            <p className="text-[#151515]/30 text-sm">הוסף פריטים מהקטלוג או ידנית</p>
          </div>
        )}
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="border border-[#151515] bg-white p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-[#151515]/60">
            <span>סכום ביניים</span><span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#151515]/60">
            <span>מרווח ({marginPct}%)</span><span>+{fmt(marginAmt)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-[#151515] border-t border-[#e5e5e5] pt-2 mt-1">
            <span>סה״כ לתשלום</span><span className="text-[#8B1A1A]">{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* Materials checklist */}
      {checklist.length > 0 && (
        <div className="border border-[#151515] bg-white p-4 flex flex-col gap-3">
          <h3 className="text-sm font-black text-[#151515] uppercase tracking-wider border-b border-[#e5e5e5] pb-2">רשימת ציוד לרכישה</h3>
          <div className="flex flex-col gap-2">
            {checklist.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <button onClick={() => toggleBought(item._id)}
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-all shrink-0 ${item.bought ? "bg-green-600 border-green-600" : "border-[#151515] hover:border-[#8B1A1A]"}`}>
                  {item.bought && <Check className="h-3 w-3 text-[#151515]" />}
                </button>
                <span className={`text-sm flex-1 ${item.bought ? "line-through text-[#151515]/30" : "text-[#151515]"}`}>
                  {item.name} — {item.qty} {item.unit}
                </span>
                <button onClick={() => removeChecklistItem(item._id)} className="text-[#151515]/20 hover:text-[#8B1A1A] transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="border border-[#151515] bg-white p-4">
        <label className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider mb-2 block">הערות / שאלות ללקוח</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder={"שאלות לדיוק:\n• גודל מדויק?\n• צבע גימור?"}
          className="w-full border border-[#e5e5e5] bg-[#f3f3f3] px-3 py-2 text-[#151515] text-sm placeholder:text-[#151515]/30 outline-none focus:border-[#8B1A1A] resize-none" />
      </div>

      {/* WhatsApp message */}
      {lineItems.length > 0 && (
        <div className="border border-[#151515] bg-white p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-2">
            <MessageSquare className="h-4 w-4 text-[#8B1A1A]" />
            <h3 className="text-sm font-black text-[#151515] uppercase tracking-wider">הודעה לשליחה</h3>
          </div>
          <pre className="border border-[#e5e5e5] bg-[#f3f3f3] p-3 text-[#151515]/70 text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
            {generateMessage()}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyMessage}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 border transition-all ${copied ? "bg-green-600 border-green-600 text-[#151515]" : "border-[#151515] text-[#151515] hover:bg-[#151515] hover:text-[#f3f3f3]"}`}>
              {copied ? <><Check className="h-4 w-4" />הועתק!</> : <><Copy className="h-4 w-4" />העתק הודעה</>}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(generateMessage())}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 bg-green-600 text-[#151515] border border-green-600 hover:bg-green-700 transition-all">
              📱 שלח בוואטסאפ
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-[#8B1A1A] text-sm font-semibold border border-[#8B1A1A] bg-[#8B1A1A]/5 px-4 py-2">{error}</p>}

      {/* Save */}
      <button onClick={handleSave} disabled={isPending}
        className={`flex items-center justify-center gap-2 w-full py-3.5 font-black text-sm uppercase tracking-widest border transition-all ${saved ? "bg-green-600 border-green-600 text-[#151515]" : "bg-[#8B1A1A] border-[#8B1A1A] text-[#f3f3f3] hover:bg-[#6e1414] active:scale-[0.98]"} disabled:opacity-60`}>
        {isPending ? "שומר..." : saved ? <><Check className="h-5 w-5" />נשמר!</> : <><Save className="h-5 w-5" />שמור הצעת מחיר</>}
      </button>
    </div>
  )
}

