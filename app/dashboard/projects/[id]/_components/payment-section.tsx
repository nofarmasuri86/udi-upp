"use client"

import { useRef, useState, useTransition } from "react"
import { createPaymentAction, deletePaymentAction } from "@/app/actions/payments"
import { Input } from "@/components/ui/input"
import { Banknote, Camera, Trash2, Plus, X } from "lucide-react"
import { PAYMENT_METHOD_LABELS } from "@/types"
import type { Payment, PaymentMethod } from "@/types"

const METHODS: PaymentMethod[] = ["cash", "transfer", "check", "other"]

const METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  transfer: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  check: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  other: "border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export function PaymentSection({ projectId, payments }: { projectId: string; payments: Payment[] }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    startTransition(async () => {
      await createPaymentAction(fd)
      formRef.current?.reset()
      setOpen(false)
      setPreview(null)
      setMethod("cash")
    })
  }

  function handleDelete(paymentId: string) {
    startTransition(() => deletePaymentAction(paymentId, projectId))
  }

  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">תשלומים שהתקבלו</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "ביטול" : "הוסף תשלום"}
        </button>
      </div>

      {/* Add Form */}
      {open && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-3 border-b border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <input type="hidden" name="project_id" value={projectId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">סכום (₪)</p>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">תאריך</p>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">אמצעי תשלום</p>
            <div className="flex flex-wrap gap-2">
              {METHODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    method === m
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
            <input type="hidden" name="method" value={method} />
          </div>

          {method === "check" && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">צילום צ&#39;ק</p>
              <input
                ref={fileRef}
                name="check_image"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
              >
                <Camera className="h-3.5 w-3.5" />
                {preview ? "שנה תמונה" : "צלם / בחר תמונה"}
              </button>
              {preview && (
                <img
                  src={preview}
                  alt="צילום צ'ק"
                  className="h-32 w-auto rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">הערות</p>
            <Input id="notes" name="notes" placeholder="אופציונלי..." />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? "שומר..." : "שמור תשלום"}
          </button>
        </form>
      )}

      {/* Payments List */}
      <div className="px-5 py-4">
        {payments.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">אין תשלומים עדיין</p>
        ) : (
          <div className="space-y-0">
            {payments.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0 dark:border-neutral-900"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    ₪{p.amount.toLocaleString("he-IL")}
                  </span>
                  {p.method && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${METHOD_COLORS[p.method as PaymentMethod]}`}
                    >
                      {PAYMENT_METHOD_LABELS[p.method as PaymentMethod]}
                    </span>
                  )}
                  {p.check_image_url && (
                    <a
                      href={p.check_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 underline"
                    >
                      צ&#39;ק
                    </a>
                  )}
                  <span className="font-mono text-[11px] text-neutral-400">
                    {new Date(p.payment_date).toLocaleDateString("he-IL")}
                  </span>
                  {p.notes && (
                    <span className="max-w-[120px] truncate text-[11px] text-neutral-400">{p.notes}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={pending}
                  className="text-neutral-300 transition-colors hover:text-red-500 disabled:opacity-50 dark:text-neutral-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">סה&quot;כ התקבל</p>
              <span className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
                ₪{total.toLocaleString("he-IL")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
