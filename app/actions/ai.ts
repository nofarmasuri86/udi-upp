"use server"

import { generateMarketingPost } from "@/lib/ai"
import type { Platform } from "@/types"

export async function generatePostAction(
  title: string,
  description: string | null,
  platform: Platform
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "מפתח ANTHROPIC_API_KEY חסר — הוסף אותו ל-.env.local וכבה/הפעל מחדש את השרת"
    )
  }
  return generateMarketingPost(title, description, platform)
}
