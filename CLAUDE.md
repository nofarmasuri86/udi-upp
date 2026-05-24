# Udi App — Claude Code Instructions

## Project Overview

אפליקציית ניהול עסק לאודי הנגר. בנויה על Next.js 15 App Router, Supabase (Auth + PostgreSQL + Storage), ו-Make.com לאוטומציות.

Stack: Next.js 15 · Supabase · Tailwind CSS · shadcn/ui · Vercel AI SDK · Make.com

---

## תקשורת חיצונית — Make.com Integration

**כל התקשורת החיצונית של האפליקציה מתבצעת דרך Make.com בלבד.**

### זרימת הנתונים

```
WhatsApp (אודי) → Make.com → POST /api/make/inbound  → Supabase DB
Supabase DB    → App Action → POST MAKE_WEBHOOK_URL  → Make.com → Morning (חשבונית ירוקה)
Make.com       → POST /api/make/receipt-confirm      → Supabase DB (עדכון מזהה קבלה)
```

### API Routes של Make.com

| Route | כיוון | תיאור |
|-------|-------|--------|
| `POST /api/make/inbound` | Make → App | Make דוחף נתונים מ-WhatsApp (לקוחות, פרויקטים, תשלומים) |
| `POST /api/make/receipt-confirm` | Make → App | Make מאשר שהקבלה הופקה ב-Morning ומספק את מזהה המסמך |

### Outbound Webhook

`updateProjectStatusAction` שולח webhook ל-`MAKE_WEBHOOK_URL` כאשר סטטוס פרויקט הופך ל-`paid`.

---

## חוקי אבטחה — MANDATORY

### 1. אימות בכל Route של Make.com

**כל** route תחת `/api/make/*` חייב לאמת את הסוד לפני כל פעולה:

```typescript
function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-make-secret")
  return !!process.env.MAKE_WEBHOOK_SECRET && secret === process.env.MAKE_WEBHOOK_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... rest of handler
}
```

### 2. Service Client — שימוש מוגבל

`lib/supabase/service.ts` עוקף RLS. **לעולם אל תשתמש בו** אלא ב-API Routes שמאומתים על ידי `x-make-secret`.

לעולם אל תייבא `createServiceClient` בתוך Server Actions, Client Components, או כל קוד שנחשף לדפדפן.

### 3. משתני סביבה

| משתנה | חשיפה | שימוש |
|-------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Server only | Service client — bypasses RLS |
| `MAKE_WEBHOOK_URL` | Server only | Outbound webhook ל-Make.com |
| `MAKE_WEBHOOK_SECRET` | Server only | אימות בקשות נכנסות מ-Make.com |
| `AI_GATEWAY_API_KEY` | Server only | Vercel AI Gateway |

`SUPABASE_SECRET_KEY` ו-`MAKE_WEBHOOK_SECRET` לעולם לא יופיעו בקוד client-side ולעולם לא יוגדרו עם prefix `NEXT_PUBLIC_`.

---

## חוקי Idempotency

### Outbound Webhook (הפקת קבלה)

לפני שליחת webhook ל-Make, תמיד בדוק:

```typescript
if (project?.receipt_webhook_sent_at) return // כבר נשלח
await supabase.from("projects").update({ receipt_webhook_sent_at: now }).eq("id", id)
await fetch(MAKE_WEBHOOK_URL, ...) // רק אחרי סימון ב-DB
```

הסימון נעשה **לפני** הקריאה כדי למנוע כפילויות במקביל.

### Inbound Messages (WhatsApp)

כל הודעה נכנסת מ-WhatsApp חייבת לעבור בדיקת כפילות על `msg_id`:

```typescript
const { error: logError } = await supabase
  .from("whatsapp_inbound_log")
  .insert({ msg_id, action_type, payload })

if (logError?.code === "23505") {
  return NextResponse.json({ ok: true, duplicate: true })
}
```

`whatsapp_inbound_log` מחזיק UNIQUE INDEX על `msg_id`.

---

## סכימת DB — טבלאות עיקריות

| טבלה | תיאור |
|------|--------|
| `projects` | פרויקטים עם סטטוס, מחיר, תאריכים, `receipt_webhook_sent_at`, `whatsapp_msg_id` |
| `clients` | לקוחות עם `whatsapp_phone`, `source` |
| `payments` | תשלומים עם `morning_doc_id`, `morning_doc_url`, `receipt_sent_at` |
| `gallery` | גלריית תמונות ב-Supabase Storage |
| `whatsapp_inbound_log` | לוג הודעות נכנסות עם UNIQUE על `msg_id` |
| `chat_messages` | הודעות צ'אט AI עם RLS per user |

---

## הוספת Route חדש של Make.com — Checklist

כאשר מוסיפים route חדש שמקבל בקשות מ-Make.com:

- [ ] הוסף `verifySecret(req)` כשורה הראשונה ב-handler
- [ ] השתמש ב-`createServiceClient()` (לא `createClient()`)
- [ ] הוסף בדיקת idempotency על מזהה ייחודי
- [ ] הוסף ל-`.env.example` אם נדרש משתנה חדש
- [ ] עדכן תיעוד זה

---

## Migrations — Run Manually in Supabase SQL Editor

ה-migrations שלהלן **לא מופעלים אוטומטית** — יש להריצם ידנית:

1. `supabase/migrations/20260524000001_check_image_waiting_deposit.sql`
2. `supabase/migrations/20260524000002_chat_messages.sql`
3. `supabase/migrations/20260524000003_make_integration.sql`
