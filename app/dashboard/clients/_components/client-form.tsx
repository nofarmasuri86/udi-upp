"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/types"

interface ClientFormProps {
  client?: Client
  action: (formData: FormData) => Promise<void>
  onSuccess: () => void
}

export function ClientForm({ client, action, onSuccess }: ClientFormProps) {
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      try {
        await action(formData)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה")
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">שם *</Label>
        <Input id="name" name="name" defaultValue={client?.name} required placeholder="ישראל ישראלי" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">טלפון</Label>
        <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} placeholder="050-0000000" dir="ltr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} placeholder="mail@example.com" dir="ltr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">כתובת</Label>
        <Input id="address" name="address" defaultValue={client?.address ?? ""} placeholder="רחוב, עיר" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">הערות</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} placeholder="הערות חופשיות..." rows={2} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "שומר..." : client ? "עדכון" : "הוספה"}
      </Button>
    </form>
  )
}

