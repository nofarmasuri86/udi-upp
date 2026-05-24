"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Client } from "@/types"

interface ProjectFormProps {
  clients: Pick<Client, "id" | "name">[]
  defaultClientId?: string
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
}

export function ProjectForm({ clients, defaultClientId, action, submitLabel = "שמירה" }: ProjectFormProps) {
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const [selectedClient, setSelectedClient] = useState(defaultClientId ?? "")
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const formData = new FormData(formRef.current!)
    formData.set("client_id", selectedClient)
    startTransition(async () => {
      try {
        await action(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה")
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">שם העבודה *</Label>
        <Input id="title" name="title" required placeholder="פרגולה, דק, הרכבת רהיטים..." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>לקוח</Label>
        <Select value={selectedClient} onValueChange={(v) => setSelectedClient(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="בחר לקוח (אופציונלי)" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input id="price" name="price" type="number" min="0" placeholder="0" dir="ltr" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit_paid">מקדמה ששולמה (₪)</Label>
          <Input id="deposit_paid" name="deposit_paid" type="number" min="0" defaultValue="0" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due_date">תאריך יעד</Label>
          <Input id="due_date" name="due_date" type="date" dir="ltr" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="material">חומר</Label>
          <Input id="material" name="material" placeholder="עץ אורן, מרנטי..." />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">תיאור</Label>
        <Textarea id="description" name="description" placeholder="פרטי העבודה..." rows={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">הערות פנימיות</Label>
        <Textarea id="notes" name="notes" placeholder="הערות..." rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "שומר..." : submitLabel}
      </Button>
    </form>
  )
}

