"use client"

import { useTransition, useState } from "react"
import { ContactRound, Check, AlertCircle } from "lucide-react"
import { importContactsAction } from "@/app/actions/leads"

type RawContact = {
  name?: string[]
  tel?: string[]
  email?: string[]
}

type ImportResult = { imported: number; skipped: number }

export function ImportContactsButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [unsupported, setUnsupported] = useState(false)

  async function handleImport() {
    // Contact Picker API — supported on Chrome Android & Safari iOS 14.5+
    if (!("contacts" in navigator) || !("ContactsManager" in window)) {
      setUnsupported(true)
      setTimeout(() => setUnsupported(false), 4000)
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contacts: RawContact[] = await (navigator as any).contacts.select(
        ["name", "tel", "email"],
        { multiple: true }
      )
      if (!contacts || contacts.length === 0) return

      const mapped = contacts.map((c) => ({
        name: c.name?.[0] ?? "",
        phone: c.tel?.[0] ?? null,
        email: c.email?.[0] ?? null,
      }))

      startTransition(async () => {
        const res = await importContactsAction(mapped)
        setResult(res)
        setTimeout(() => setResult(null), 4000)
      })
    } catch {
      // user cancelled — do nothing
    }
  }

  if (unsupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>תכונה זו זמינה רק ב-Chrome/Safari במובייל</span>
      </div>
    )
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-300 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-2xl font-semibold">
        <Check className="h-4 w-4" />
        {result.imported} נוספו
        {result.skipped > 0 && <span className="text-white/40">· {result.skipped} דולגו</span>}
      </div>
    )
  }

  return (
    <button
      onClick={handleImport}
      disabled={isPending}
      className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all border border-white/10 disabled:opacity-60"
    >
      {isPending ? (
        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
      ) : (
        <ContactRound className="h-4 w-4" />
      )}
      {isPending ? "מייבא..." : "ייבא אנשי קשר"}
    </button>
  )
}
