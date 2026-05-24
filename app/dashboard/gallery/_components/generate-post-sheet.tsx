"use client"

import { useState, useTransition } from "react"
import { Copy, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { generatePostAction } from "@/app/actions/ai"
import { saveMarketingPostAction } from "@/app/actions/gallery"
import type { Platform } from "@/types"

interface GeneratePostSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  galleryItemId: string
  title: string
  description: string | null
}

const PLATFORMS: { value: Platform; label: string; emoji: string }[] = [
  { value: "instagram", label: "אינסטגרם", emoji: "📸" },
  { value: "facebook", label: "פייסבוק", emoji: "👥" },
]

export function GeneratePostSheet({
  open,
  onOpenChange,
  galleryItemId,
  title,
  description,
}: GeneratePostSheetProps) {
  const [platform, setPlatform] = useState<Platform>("instagram")
  const [generatedText, setGeneratedText] = useState("")
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [generating, startGenerating] = useTransition()
  const [saving, startSaving] = useTransition()

  function handleGenerate() {
    setError("")
    setGeneratedText("")
    setSaved(false)
    startGenerating(async () => {
      try {
        const text = await generatePostAction(title, description, platform)
        setGeneratedText(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה ביצירת הפוסט")
      }
    })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    startSaving(async () => {
      try {
        await saveMarketingPostAction(galleryItemId, platform, generatedText)
        setSaved(true)
      } catch {
        setError("שגיאה בשמירת הפוסט")
      }
    })
  }

  function handleClose() {
    setGeneratedText("")
    setError("")
    setSaved(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" dir="rtl" className="max-h-[90dvh] rounded-t-2xl overflow-y-auto pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ייצור פוסט שיווקי
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-right">{title}</p>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Platform selector */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">פלטפורמה</p>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setPlatform(p.value); setGeneratedText(""); setSaved(false) }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                    platform === p.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            size="lg"
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "כותב פוסט..." : generatedText ? "ייצר מחדש" : "ייצר פוסט"}
          </Button>

          {/* Generated text */}
          {generating && (
            <div className="flex flex-col gap-2 items-center justify-center py-6 text-muted-foreground">
              <Sparkles className="h-6 w-6 animate-pulse text-primary" />
              <p className="text-sm">Claude כותב פוסט מותאם...</p>
            </div>
          )}

          {generatedText && !generating && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  {PLATFORMS.find((p) => p.value === platform)?.emoji}{" "}
                  {PLATFORMS.find((p) => p.value === platform)?.label}
                </Badge>
                <p className="text-xs text-muted-foreground">{generatedText.length} תווים</p>
              </div>

              <Textarea
                value={generatedText}
                onChange={(e) => { setGeneratedText(e.target.value); setSaved(false) }}
                rows={8}
                className="resize-none text-sm leading-relaxed"
                dir="rtl"
              />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "הועתק!" : "העתק"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleSave}
                  disabled={saving || saved}
                >
                  {saved ? <Check className="h-4 w-4 text-green-500" /> : null}
                  {saved ? "נשמר" : saving ? "שומר..." : "שמור"}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
