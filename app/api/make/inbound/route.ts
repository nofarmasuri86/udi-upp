/**
 * POST /api/make/inbound
 *
 * נקודת הכניסה המאובטחת מ-Make.com.
 * Make שולח לכאן נתונים מובנים שחולצו מהודעות WhatsApp של אודי.
 *
 * אימות: כותרת x-make-secret חייבת להתאים ל-MAKE_WEBHOOK_SECRET.
 * Idempotency: כל הודעת WhatsApp מזוהה לפי msg_id — עיבוד כפול מונע ב-DB.
 *
 * גוף הבקשה הצפוי:
 * {
 *   action:   "create_client" | "create_project" | "create_payment" | "update_project_status"
 *   user_id:  string  // מזהה המשתמש (אודי)
 *   msg_id:   string  // מזהה ייחודי של הודעת WhatsApp (למניעת כפילויות)
 *   phone:    string  // מספר השולח
 *   data:     object  // הנתונים המובנים לפי ה-action
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { triggerReceiptWebhook } from "@/lib/make"

// ── Auth helper ───────────────────────────────────────────
function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-make-secret")
  return !!process.env.MAKE_WEBHOOK_SECRET && secret === process.env.MAKE_WEBHOOK_SECRET
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status })
}

// ── Handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) return err("Unauthorized", 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err("Invalid JSON")
  }

  const { action, user_id, msg_id, phone, data } = body as {
    action:  string
    user_id: string
    msg_id:  string
    phone?:  string
    data:    Record<string, unknown>
  }

  if (!action || !user_id || !msg_id || !data) {
    return err("Missing required fields: action, user_id, msg_id, data")
  }

  const supabase = createServiceClient()

  // ── Idempotency check ─────────────────────────────────
  const { data: existing } = await supabase
    .from("whatsapp_inbound_log")
    .select("id, action_taken, entity_id")
    .eq("msg_id", msg_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      action_taken: existing.action_taken,
      entity_id: existing.entity_id,
    })
  }

  // ── Route by action ───────────────────────────────────
  let actionTaken = action
  let entityId: string | null = null

  switch (action) {
    case "create_client": {
      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          user_id,
          name:           data.name as string,
          phone:          (data.phone as string) || null,
          email:          (data.email as string) || null,
          address:        (data.address as string) || null,
          notes:          (data.notes as string) || null,
          whatsapp_phone: phone ?? (data.phone as string) ?? null,
          source:         "whatsapp",
        })
        .select("id")
        .single()

      if (error) return err(`DB error: ${error.message}`)
      entityId = client.id
      break
    }

    case "create_project": {
      // חיפוש לקוח לפי שם (fuzzy) אם סופק
      let clientId: string | null = null
      if (data.client_name) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user_id)
          .ilike("name", `%${data.client_name}%`)
          .limit(1)
        clientId = clients?.[0]?.id ?? null
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id,
          client_id:      clientId,
          title:          data.title as string,
          description:    (data.description as string) || null,
          price:          data.price ? Number(data.price) : null,
          estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : null,
          safety_margin:  data.safety_margin ? Number(data.safety_margin) : null,
          due_date:       (data.due_date as string) || null,
          material:       (data.material as string) || null,
          notes:          (data.notes as string) || null,
          follow_up_at:   (data.follow_up_at as string) || null,
          status:         "new",
          source:         "whatsapp",
          whatsapp_msg_id: msg_id,
        })
        .select("id")
        .single()

      if (error) return err(`DB error: ${error.message}`)
      entityId = project.id
      break
    }

    case "create_payment": {
      // מציאת פרויקט לפי שם
      const { data: projects } = await supabase
        .from("projects")
        .select("id, price")
        .eq("user_id", user_id)
        .ilike("title", `%${data.project_name}%`)
        .limit(1)

      if (!projects?.[0]) return err(`Project not found: "${data.project_name}"`)
      const project = projects[0]

      const { data: payment, error } = await supabase
        .from("payments")
        .insert({
          user_id,
          project_id:   project.id,
          amount:       Number(data.amount),
          method:       (data.method as string) || null,
          payment_date: (data.payment_date as string) || new Date().toISOString().split("T")[0],
          notes:        (data.notes as string) || null,
        })
        .select("id")
        .single()

      if (error) return err(`DB error: ${error.message}`)
      entityId = payment.id

      // בדיקה אם שולם במלואו → עדכון סטטוס
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("project_id", project.id)

      const totalPaid = (allPayments ?? []).reduce((s, p) => s + p.amount, 0)
      const fullyPaid = !!project.price && totalPaid >= project.price

      if (fullyPaid) {
        await supabase
          .from("projects")
          .update({ status: "paid", completed_at: new Date().toISOString() })
          .eq("id", project.id)

        // הפק קבלה: שלח webhook ל-Make → Morning
        const { data: fullProject } = await supabase
          .from("projects")
          .select("id, title, price, receipt_webhook_sent_at, client:clients(name, phone, email, address)")
          .eq("id", project.id).single()

        if (fullProject) {
          const { data: fullPayments } = await supabase
            .from("payments")
            .select("amount, method, payment_date, notes")
            .eq("project_id", project.id)
            .order("payment_date", { ascending: false })

          await triggerReceiptWebhook(
            fullProject,
            fullPayments ?? [],
            async () => {
              await supabase.from("projects")
                .update({ receipt_webhook_sent_at: new Date().toISOString() })
                .eq("id", project.id)
            }
          )
        }
      }
      break
    }

    case "update_project_status": {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user_id)
        .ilike("title", `%${data.project_name}%`)
        .limit(1)

      if (!projects?.[0]) return err(`Project not found: "${data.project_name}"`)

      const updates: Record<string, unknown> = { status: data.status }
      if (data.status === "paid" || data.status === "delivered") {
        updates.completed_at = new Date().toISOString()
      }
      if (data.follow_up_at) updates.follow_up_at = data.follow_up_at
      if (data.actual_hours !== undefined) updates.actual_hours = Number(data.actual_hours)

      await supabase.from("projects").update(updates).eq("id", projects[0].id)
      entityId = projects[0].id
      break
    }

    default:
      return err(`Unknown action: ${action}`)
  }

  // ── Log the processed message ─────────────────────────
  await supabase.from("whatsapp_inbound_log").insert({
    user_id,
    msg_id,
    phone_from:   phone ?? null,
    raw_payload:  body,
    action_taken: actionTaken,
    entity_id:    entityId,
  })

  return NextResponse.json({ ok: true, action: actionTaken, entity_id: entityId })
}
