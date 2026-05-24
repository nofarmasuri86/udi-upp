"use client"

import { useRouter, usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Show only on sub-pages (not top-level dashboard sections)
  const segments = pathname.split("/").filter(Boolean)
  const topLevel = [
    "/dashboard",
    "/dashboard/projects",
    "/dashboard/clients",
    "/dashboard/gallery",
    "/dashboard/calendar",
    "/dashboard/chat",
    "/dashboard/finance",
    "/dashboard/quotes",
  ]
  if (topLevel.includes(pathname)) return null

  return (
    <button
      onClick={() => router.back()}
      aria-label="חזור"
      className="flex items-center justify-center w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  )
}
