"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadDialog } from "./upload-dialog"
import { ImageCard } from "./image-card"

type GalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  storage_path: string
  project: { id: string; title: string } | null
}

type Project = { id: string; title: string }

export function GalleryClient({
  items,
  projects,
}: {
  items: GalleryItem[]
  projects: Project[]
}) {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      {/* Upload button (fixed on mobile for easy access) */}
      <div className="flex items-center justify-between" dir="rtl">
        <p className="text-sm text-muted-foreground">{items.length} תמונות</p>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Camera className="h-4 w-4" />
          העלאת תמונה
        </Button>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-none border-2 border-dashed border-muted-foreground/20 py-20 text-center cursor-pointer"
          onClick={() => setUploadOpen(true)}
          dir="rtl"
        >
          <Camera className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-muted-foreground">אין תמונות עדיין</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              לחץ כאן כדי להעלות תמונה ראשונה
            </p>
          </div>
          <Button variant="outline">העלאת תמונה ראשונה</Button>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" dir="rtl">
          {items.map((item) => (
            <ImageCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projects={projects}
      />
    </>
  )
}

