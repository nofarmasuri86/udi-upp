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
import { deleteProjectAction } from "@/app/actions/projects"

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרויקט</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הפרויקט לצמיתות. אי אפשר לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => startTransition(() => deleteProjectAction(projectId))}>
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
