"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientForm } from "./client-form"
import { createClientAction } from "@/app/actions/clients"

export function AddClientButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        לקוח חדש
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת לקוח חדש</DialogTitle>
          </DialogHeader>
          <ClientForm action={createClientAction} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
