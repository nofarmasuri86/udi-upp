"use client"

import { useRef, useTransition, useState } from "react"
import { Camera, Check } from "lucide-react"
import { uploadGalleryItemAction } from "@/app/actions/gallery"

export function QuickGalleryUpload({
  projectId,
  projectTitle,
}: {
  projectId: string
  projectTitle: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)
    formData.append("title", `${projectTitle} — ${new Date().toLocaleDateString("he-IL")}`)
    formData.append("project_id", projectId)

    startTransition(async () => {
      try {
        await uploadGalleryItemAction(formData)
        setDone(true)
        setTimeout(() => setDone(false), 2500)
      } catch {
        alert("שגיאה בהעלאת התמונה")
      } finally {
        if (inputRef.current) inputRef.current.value = ""
      }
    })
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click() }}
        disabled={isPending}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
          done
            ? "bg-green-500/20 border-green-500/30 text-green-300"
            : "bg-white/[0.06] border-white/10 text-blue-300 hover:bg-white/[0.10] hover:border-white/20"
        }`}
        title="העלה תמונה לגלריה"
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 rounded-full border border-blue-400 border-t-transparent animate-spin" />
        ) : done ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {isPending ? "שומר..." : done ? "נשמר!" : "צלם"}
      </button>
    </>
  )
}
