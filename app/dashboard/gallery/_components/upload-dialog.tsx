"use client"

import { useRef, useState, useTransition } from "react"
import { ImagePlus, X, Upload } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { uploadGalleryItemAction } from "@/app/actions/gallery"

type Project = { id: string; title: string }

interface UploadDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  projects: Project[]
}

export function UploadDialog({ open, onOpenChange, projects }: UploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleClose() {
    setPreview(null)
    setSelectedProject("")
    setError("")
    formRef.current?.reset()
    onOpenChange(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const formData = new FormData(formRef.current!)
    formData.set("project_id", selectedProject)
    startTransition(async () => {
      try {
        await uploadGalleryItemAction(formData)
        handleClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בהעלאה")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>העלאת תמונת עבודה</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Image picker */}
          <div
            className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer overflow-hidden"
            style={{ minHeight: 180 }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  className="absolute top-2 left-2 rounded-full bg-background/80 p-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview(null)
                    if (fileRef.current) fileRef.current.value = ""
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                <ImagePlus className="h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">לחץ לבחירת תמונה</p>
                <p className="text-xs opacity-60">JPG, PNG, WEBP עד 10MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={handleFileChange}
              required
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">שם העבודה *</Label>
            <Input id="title" name="title" required placeholder="פרגולה בגינה, הרכבת ארון..." />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">תיאור קצר (לפוסט AI)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="פרטים שיעזרו ל-AI לכתוב פוסט מושך..."
            />
          </div>

          {/* Link to project */}
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>קישור לפרויקט (אופציונלי)</Label>
              <Select value={selectedProject} onValueChange={(v) => setSelectedProject(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט קשור" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending} size="lg" className="w-full gap-2">
            <Upload className="h-4 w-4" />
            {pending ? "מעלה..." : "העלאה"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
