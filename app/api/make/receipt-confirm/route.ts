/**
 * POST /api/make/receipt-confirm
 *
 * Make.com קורא ל-endpoint זה לאחר שהפיק קבלה ב-Morning בהצלחה.
 * מעדכן את הפרויקט / התשלום עם מזהה המסמך ו-URL.
 *
 * גוף הבקשה:
 * {
 *   project_id:   string
 *   payment_id?:  string   // אם רלוונטי לתשלום ספציפי
 *   morning_doc_id:  string
 *   morning_doc_url: string
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-make-secret")
  return !!process.env.MAKE_WEBHOOK_SECRET && secret === process.env.MAKE_WEBHOOK_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { project_id, payment_id, morning_doc_id, morning_doc_url } = body as {
    project_id:      string
    payment_id?:     string
    morning_doc_id:  string
    morning_doc_url: string
  }

  if (!project_id || !morning_doc_id || !morning_doc_url) {
    return NextResponse.json(
      { error: "Missing required fields: project_id, morning_doc_id, morning_doc_url" },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // עדכון התשלום הרלוונטי (האחרון בפרויקט, אם לא צוין ספציפי)
  if (payment_id) {
    await supabase
      .from("payments")
      .update({
        morning_doc_id,
        morning_doc_url,
        receipt_sent_at: now,
      })
      .eq("id", payment_id)
  } else {
    // עדכון התשלום האחרון של הפרויקט
    const { data: payments } = await supabase
      .from("payments")
      .select("id")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (payments?.[0]) {
      await supabase
        .from("payments")
        .update({
          morning_doc_id,
          morning_doc_url,
          receipt_sent_at: now,
        })
        .eq("id", payments[0].id)
    }
  }

  // סימון שהקבלה הופקה בפרויקט
  await supabase
    .from("projects")
    .update({ receipt_webhook_sent_at: now })
    .eq("id", project_id)

  return NextResponse.json({ ok: true, morning_doc_id, project_id })
}
