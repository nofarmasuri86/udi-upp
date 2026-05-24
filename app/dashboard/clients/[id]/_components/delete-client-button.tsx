"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteClientAction } from "@/app/actions/clients"
import { useRouter } from "next/navigation"

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deleteClientAction(clientId)
      router.push("/dashboard/clients")
    })
  }

  return (
    <>
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        מחיקה
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת {clientName}</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הלקוח וכל הפרויקטים שלו. אי אפשר לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>מחיקה</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
