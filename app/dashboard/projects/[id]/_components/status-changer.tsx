"use client"

import { useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateProjectStatusAction } from "@/app/actions/projects"
import { PROJECT_STATUS_LABELS } from "@/types"
import type { ProjectStatus } from "@/types"

const STATUS_ORDER: ProjectStatus[] = [
  "new", "in_progress", "waiting_material", "ready", "delivered", "paid",
]

export function StatusChanger({ projectId, currentStatus }: { projectId: string; currentStatus: ProjectStatus }) {
  const [pending, startTransition] = useTransition()
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null

  function changeStatus(status: ProjectStatus) {
    startTransition(() => updateProjectStatusAction(projectId, status))
  }

  return (
    <div className="flex items-center gap-2">
      {prevStatus && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => changeStatus(prevStatus)}
        >
          <ChevronRight className="h-4 w-4" />
          {PROJECT_STATUS_LABELS[prevStatus]}
        </Button>
      )}
      {nextStatus && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => changeStatus(nextStatus)}
        >
          {PROJECT_STATUS_LABELS[nextStatus]}
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
