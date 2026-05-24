"use server"

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { PROJECT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/types"
import type { PaymentMethod, ProjectStatus } from "@/types"
import { revalidatePath } from "next/cache"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ChatMessage = { role: "user" | "assistant"; content: string }

// ─── System Prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `אתה "מנהל העבודה" — העוזר האישי של אודי, נגר ואמן עץ מאילת. אודי איש שטח, שונא ניירת.

תפקידך:
- לענות על שאלות על פרויקטים, לקוחות, תשלומים ולוח זמנים
- לעדכן נתונים בדשבורד (הוספת לקוח, פרויקט, תשלום, עדכון סטטוס)
- לעזור בתמחור חכם ולמנוע הפסדים

כללי טון: קצר, תכל'ס, גובה עיניים. שפה חברית ("קלטתי", "סגור", "אפשר ללכת לנוח"). ללא רשמיות.

כשאודי מבקש להוסיף/לעדכן נתונים — השתמש בכלים (tools) המוגדרים. לפני הפקת מסמך רשמי, הצג סיכום ושאל אישור.

כשאתה מוסיף נתונים — אשר בקצרה מה עשית ("קלטתי — פתחתי כרטיס ל[שם]").

נתוני העסק בזמן אמת:
`

// ─── Tools ────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_client",
    description: "יצירת לקוח חדש במערכת",
    input_schema: {
      type: "object" as const,
      properties: {
        name:    { type: "string", description: "שם הלקוח" },
        phone:   { type: "string", description: "טלפון" },
        email:   { type: "string", description: "אימייל" },
        address: { type: "string", description: "כתובת" },
        notes:   { type: "string", description: "הערות" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_project",
    description: "יצירת פרויקט/עבודה חדשה",
    input_schema: {
      type: "object" as const,
      properties: {
        title:       { type: "string", description: "שם הפרויקט" },
        client_name: { type: "string", description: "שם הלקוח (לחיפוש קיים)" },
        price:       { type: "number", description: "מחיר בשקלים" },
        due_date:    { type: "string", description: "תאריך יעד YYYY-MM-DD" },
        description: { type: "string", description: "תיאור" },
        material:    { type: "string", description: "חומר" },
        notes:       { type: "string", description: "הערות" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_project_status",
    description: "עדכון סטטוס פרויקט",
    input_schema: {
      type: "object" as const,
      properties: {
        project_name: { type: "string", description: "שם הפרויקט" },
        status: {
          type: "string",
          enum: ["new","in_progress","waiting_material","ready","delivered","paid","waiting_deposit","cancelled"],
          description: "הסטטוס החדש",
        },
      },
      required: ["project_name", "status"],
    },
  },
  {
    name: "add_payment",
    description: "רישום תשלום שהתקבל",
    input_schema: {
      type: "object" as const,
      properties: {
        project_name:  { type: "string", description: "שם הפרויקט" },
        amount:        { type: "number", description: "סכום בשקלים" },
        method:        { type: "string", enum: ["cash","transfer","check","other"], description: "אמצעי תשלום" },
        payment_date:  { type: "string", description: "תאריך YYYY-MM-DD" },
        notes:         { type: "string", description: "הערות" },
      },
      required: ["project_name", "amount"],
    },
  },
  {
    name: "update_project",
    description: "עדכון פרטי פרויקט (מחיר, תאריך, הערות)",
    input_schema: {
      type: "object" as const,
      properties: {
        project_name: { type: "string", description: "שם הפרויקט" },
        price:        { type: "number", description: "מחיר חדש" },
        due_date:     { type: "string", description: "תאריך יעד חדש YYYY-MM-DD" },
        notes:        { type: "string", description: "הערות חדשות" },
        material:     { type: "string", description: "חומר" },
      },
      required: ["project_name"],
    },
  },
]

// ─── DB Context ───────────────────────────────────────────────
async function buildDbContext(userId: string): Promise<string> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [{ data: projects }, { data: clients }, { data: payments }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, status, price, deposit_paid, due_date, notes, material, client:clients(name, phone)")
      .eq("user_id", userId)
      .not("status", "in", '("cancelled","paid")')
      .order("due_date", { ascending: true }),
    supabase
      .from("clients")
      .select("id, name, phone, email, address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("payments")
      .select("project_id, amount, method, payment_date")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .limit(30),
  ])

  const paidByProject: Record<string, number> = {}
  for (const p of payments ?? []) {
    paidByProject[p.project_id] = (paidByProject[p.project_id] ?? 0) + p.amount
  }

  const lines: string[] = [`📅 היום: ${today}\n`]

  lines.push("## פרויקטים פתוחים:")
  if (!projects?.length) {
    lines.push("אין פרויקטים פתוחים.")
  } else {
    for (const p of projects) {
      const client = p.client as { name?: string; phone?: string } | null
      const paid = paidByProject[p.id] ?? p.deposit_paid ?? 0
      const balance = (p.price ?? 0) - paid
      lines.push(
        `- ID:${p.id.slice(0,8)} | [${PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status}] "${p.title}"` +
        (client?.name ? ` | לקוח: ${client.name}` : "") +
        (client?.phone ? ` (${client.phone})` : "") +
        (p.price ? ` | מחיר: ₪${p.price}` : "") +
        (balance > 0 ? ` | יתרה: ₪${balance}` : " | שולם") +
        (p.due_date ? ` | יעד: ${p.due_date}` : "") +
        (p.material ? ` | חומר: ${p.material}` : "") +
        (p.notes ? ` | הערות: ${p.notes}` : "")
      )
    }
  }

  lines.push("\n## לקוחות:")
  for (const c of (clients ?? [])) {
    lines.push(`- ID:${c.id.slice(0,8)} | ${c.name}${c.phone ? ` | ${c.phone}` : ""}${c.email ? ` | ${c.email}` : ""}${c.address ? ` | ${c.address}` : ""}`)
  }

  return lines.join("\n")
}

// ─── Make.com Webhook ─────────────────────────────────────────
async function triggerMakeWebhook(projectId: string, userId: string) {
  if (!process.env.MAKE_WEBHOOK_URL) return
  const supabase = await createClient()

  // idempotency: בדוק אם ה-webhook כבר נשלח
  const { data: check } = await supabase
    .from("projects")
    .select("receipt_webhook_sent_at")
    .eq("id", projectId)
    .single()

  if (check?.receipt_webhook_sent_at) return

  // סמן לפני שליחה — מונע כפילויות גם אם הבקשה תיכשל
  await supabase
    .from("projects")
    .update({ receipt_webhook_sent_at: new Date().toISOString() })
    .eq("id", projectId)

  const [{ data: project }, { data: payments }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(name, phone, email, address)")
      .eq("id", projectId)
      .single(),
    supabase
      .from("payments")
      .select("amount, method, payment_date, notes")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("payment_date", { ascending: false }),
  ])

  if (!project) return
  const totalPaid = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const lastPayment = payments?.[0] ?? null
  const client = project.client as Record<string, string> | null
  const LABELS: Record<string, string> = { cash: "מזומן", transfer: "העברה בנקאית", check: "צ'ק", other: "אחר" }

  await fetch(process.env.MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id:           project.id,
      project_title:        project.title,
      price:                project.price,
      total_paid:           totalPaid,
      balance_due:          (project.price ?? 0) - totalPaid,
      completed_at:         new Date().toISOString(),
      payment_method:       lastPayment?.method ?? null,
      payment_method_label: lastPayment?.method ? (LABELS[lastPayment.method] ?? lastPayment.method) : null,
      payment_date:         lastPayment?.payment_date ?? null,
      payment_notes:        lastPayment?.notes ?? null,
      client_name:          client?.name ?? null,
      client_phone:         client?.phone ?? null,
      client_email:         client?.email ?? null,
      client_address:       client?.address ?? null,
    }),
  }).catch(() => null)
}

// ─── Tool Executor ────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>, userId: string): Promise<string> {
  const supabase = await createClient()

  if (name === "create_client") {
    const { data, error } = await supabase.from("clients").insert({
      user_id: userId,
      name: input.name as string,
      phone: (input.phone as string) || null,
      email: (input.email as string) || null,
      address: (input.address as string) || null,
      notes: (input.notes as string) || null,
    }).select("id, name").single()
    if (error) return `שגיאה: ${error.message}`
    revalidatePath("/dashboard/clients")
    revalidatePath("/dashboard")
    return `נוצר לקוח: ${data.name} (ID: ${data.id.slice(0,8)})`
  }

  if (name === "create_project") {
    let clientId: string | null = null
    if (input.client_name) {
      const { data: clients } = await supabase
        .from("clients").select("id, name")
        .eq("user_id", userId)
        .ilike("name", `%${input.client_name}%`)
        .limit(1)
      clientId = clients?.[0]?.id ?? null
    }
    const { data, error } = await supabase.from("projects").insert({
      user_id: userId,
      title: input.title as string,
      client_id: clientId,
      price: input.price as number || null,
      due_date: (input.due_date as string) || null,
      description: (input.description as string) || null,
      material: (input.material as string) || null,
      notes: (input.notes as string) || null,
      status: "new",
    }).select("id, title").single()
    if (error) return `שגיאה: ${error.message}`
    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard")
    return `נוצר פרויקט: "${data.title}" (ID: ${data.id.slice(0,8)})${clientId ? "" : " — לקוח לא נמצא, ניתן לשייך ידנית"}`
  }

  if (name === "update_project_status") {
    const { data: projects } = await supabase
      .from("projects").select("id, title")
      .eq("user_id", userId)
      .ilike("title", `%${input.project_name}%`)
      .limit(1)
    if (!projects?.[0]) return `לא נמצא פרויקט בשם "${input.project_name}"`
    const proj = projects[0]
    const newStatus = input.status as ProjectStatus
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === "paid" || newStatus === "delivered") {
      updates.completed_at = new Date().toISOString()
    }
    await supabase.from("projects").update(updates).eq("id", proj.id)

    if (newStatus === "paid") {
      await triggerMakeWebhook(proj.id, userId)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/projects")
    revalidatePath(`/dashboard/projects/${proj.id}`)
    return `עודכן סטטוס "${proj.title}" ← ${PROJECT_STATUS_LABELS[newStatus]}${newStatus === "paid" ? " ✅ שלחתי ל-Make" : ""}`
  }

  if (name === "add_payment") {
    const { data: projects } = await supabase
      .from("projects").select("id, title, price, deposit_paid, status")
      .eq("user_id", userId)
      .ilike("title", `%${input.project_name}%`)
      .limit(1)
    if (!projects?.[0]) return `לא נמצא פרויקט בשם "${input.project_name}"`
    const proj = projects[0]

    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      project_id: proj.id,
      amount: input.amount as number,
      method: (input.method as PaymentMethod) || null,
      payment_date: (input.payment_date as string) || new Date().toISOString().split("T")[0],
      notes: (input.notes as string) || null,
    })
    if (error) return `שגיאה: ${error.message}`

    // חשב כל התשלומים שהתקבלו
    const { data: allPayments } = await supabase
      .from("payments").select("amount").eq("project_id", proj.id)
    const totalPaid = (allPayments ?? []).reduce((s, p) => s + p.amount, 0)
    const price = proj.price ?? 0
    const fullyPaid = price > 0 && totalPaid >= price

    let statusMsg = ""
    if (fullyPaid && proj.status !== "paid") {
      await supabase.from("projects")
        .update({ status: "paid", completed_at: new Date().toISOString() })
        .eq("id", proj.id)
      await triggerMakeWebhook(proj.id, userId)
      statusMsg = " ✅ שולם במלואו — שלחתי ל-Make להפקת קבלה"
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/projects")
    revalidatePath(`/dashboard/projects/${proj.id}`)

    const methodLabel = input.method ? PAYMENT_METHOD_LABELS[input.method as PaymentMethod] : ""
    return `נרשם תשלום ₪${input.amount}${methodLabel ? ` (${methodLabel})` : ""} עבור "${proj.title}"${statusMsg}`
  }

  if (name === "update_project") {
    const { data: projects } = await supabase
      .from("projects").select("id, title")
      .eq("user_id", userId)
      .ilike("title", `%${input.project_name}%`)
      .limit(1)
    if (!projects?.[0]) return `לא נמצא פרויקט בשם "${input.project_name}"`
    const proj = projects[0]
    const updates: Record<string, unknown> = {}
    if (input.price !== undefined) updates.price = input.price
    if (input.due_date) updates.due_date = input.due_date
    if (input.notes) updates.notes = input.notes
    if (input.material) updates.material = input.material
    await supabase.from("projects").update(updates).eq("id", proj.id)
    revalidatePath(`/dashboard/projects/${proj.id}`)
    revalidatePath("/dashboard/projects")
    return `עודכן פרויקט "${proj.title}"`
  }

  return "פעולה לא מוכרת"
}

// ─── Load History ─────────────────────────────────────────────
export async function loadChatHistory(): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50)

  return (data ?? []) as ChatMessage[]
}

// ─── Send Message ─────────────────────────────────────────────
export async function sendChatMessage(
  _history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  // שמור הודעת משתמש
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: userMessage })

  // טען היסטוריה מ-DB (50 אחרונות)
  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50)

  const dbContext = await buildDbContext(user.id)
  const systemWithContext = SYSTEM_PROMPT + dbContext

  const messages: Anthropic.MessageParam[] = (historyRows ?? []).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }))

  // לולאת Tool Use
  let reply = ""
  let loopMessages = [...messages]

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemWithContext,
      tools: TOOLS,
      messages: loopMessages,
    })

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(b => b.type === "tool_use")
      const textBlocks = response.content.filter(b => b.type === "text")

      loopMessages.push({ role: "assistant", content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input as Record<string, unknown>, user.id)
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result })
        }
      }

      loopMessages.push({ role: "user", content: toolResults })

      if (textBlocks.length > 0) {
        reply += textBlocks.map(b => b.type === "text" ? b.text : "").join("") + "\n"
      }
    } else {
      const textBlock = response.content.find(b => b.type === "text")
      if (textBlock?.type === "text") reply += textBlock.text.trim()
      break
    }
  }

  // שמור תגובת הבוט
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply.trim() })

  return reply.trim()
}

// ─── Clear History ────────────────────────────────────────────
export async function clearChatHistory(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("chat_messages").delete().eq("user_id", user.id)
}
