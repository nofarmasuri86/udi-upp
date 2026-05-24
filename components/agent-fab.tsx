"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Sparkles } from "lucide-react"

export function AgentFab() {
  const pathname = usePathname()
  if (pathname === "/dashboard/chat") return null

  return (
    <Link href="/dashboard/chat" className="fixed bottom-6 left-6 z-50" dir="rtl">
      <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 text-white font-bold px-5 py-3.5 rounded-2xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20">
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-400 rounded-full animate-pulse border-2 border-[#07091a]" />
        <Sparkles className="h-4 w-4 text-yellow-300" />
        <span className="text-sm font-bold">עוזר AI</span>
        <MessageSquare className="h-4 w-4 opacity-70" />
      </div>
    </Link>
  )
}
