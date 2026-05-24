"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientForm } from "../../_components/client-form"
import { updateClientAction } from "@/app/actions/clients"
import type { Client } from "@/types"

export function EditClientButton({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        עריכה
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת {client.name}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            action={(formData) => updateClientAction(client.id, formData)}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
