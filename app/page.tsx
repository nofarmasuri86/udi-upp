"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun, ArrowLeft, Hammer } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Page() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center" dir="rtl">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 left-4 rounded-lg p-2 hover:bg-muted transition-colors text-muted-foreground"
        aria-label="החלפת ערכת נושא"
      >
        {mounted && (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
      </button>

      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Hammer className="h-8 w-8 text-primary-foreground" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">אודי נגרות</h1>
          <p className="text-muted-foreground leading-relaxed">
            ניהול לקוחות, פרויקטים ותשלומים — הכל במקום אחד
          </p>
        </div>

        <Link href="/login" className="w-full">
          <Button size="lg" className="w-full gap-2 text-base h-12">
            <ArrowLeft className="h-4 w-4" />
            כניסה למערכת
          </Button>
        </Link>
      </div>
    </div>
  )
}
