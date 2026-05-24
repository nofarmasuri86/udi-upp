"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Sparkles, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GeneratePostSheet } from "./generate-post-sheet"
import { deleteGalleryItemAction } from "@/app/actions/gallery"

type GalleryItemProps = {
  id: string
  title: string
  description: string | null
  image_url: string
  storage_path: string
  project: { id: string; title: string } | null
}

export function ImageCard({ item }: { item: GalleryItemProps }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    if (!confirm(`למחוק את "${item.title}"?`)) return
    startDelete(() => deleteGalleryItemAction(item.id, item.storage_path))
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Delete button — top corner */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute left-2 top-2 rounded-full bg-background/70 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
            aria-label="מחיקה"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 p-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold leading-tight line-clamp-1">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}
          </div>

          {item.project && (
            <Link
              href={`/dashboard/projects/${item.project.id}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
            >
              <ExternalLink className="h-3 w-3" />
              {item.project.title}
            </Link>
          )}

          {/* Generate post button */}
          <Button
            size="sm"
            className="w-full gap-2 mt-1"
            onClick={() => setSheetOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ייצר פוסט שיווקי
          </Button>
        </div>
      </div>

      <GeneratePostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        galleryItemId={item.id}
        title={item.title}
        description={item.description}
      />
    </>
  )
}
