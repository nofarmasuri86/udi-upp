import Anthropic from '@anthropic-ai/sdk'
import type { Platform } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const PLATFORM_TIPS: Record<Platform, string> = {
  facebook:
    'הפוסט לפייסבוק — כתוב בטון אישי וחמים, עד 3 פסקאות קצרות, עם קריאה לפעולה בסוף (לייק, שיתוף, פנייה בהודעה).',
  instagram:
    'הפוסט לאינסטגרם — כתוב בטון השראתי ויזואלי, עד 150 מילים, עם 5-8 hashtags רלוונטיים בסוף בעברית ואנגלית.',
}

export async function generateMarketingPost(
  title: string,
  description: string | null,
  platform: Platform
): Promise<string> {
  const prompt = `אתה מומחה שיווק דיגיטלי לנגרים ואנשי מקצוע בתחום הרהיטים.
כתוב פוסט שיווקי מרשים בעברית עבור הפלטפורמה הבאה:

${PLATFORM_TIPS[platform]}

פרטי העבודה:
שם: ${title}
${description ? `תיאור: ${description}` : ''}

הנחיות:
- כתוב בשם אחד (אודי) — נגר ומרכיב רהיטים מקצועי
- הדגש אומנות, איכות, ומסירות ללקוח
- אל תמציא פרטים שלא נמסרו
- כתוב רק את הפוסט עצמו, ללא הקדמות`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected AI response type')
  return block.text.trim()
}
