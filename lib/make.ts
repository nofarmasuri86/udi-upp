/**
 * Shared Make.com webhook utilities.
 * Used by: app/actions/projects.ts, app/actions/ai-chat.ts, app/api/make/inbound/route.ts
 */

const METHOD_LABELS: Record<string, string> = {
  cash: "מזומן",
  transfer: "העברה בנקאית",
  check: "צ'ק",
  other: "אחר",
}

type ClientRow = { name?: string; phone?: string; email?: string; address?: string }

export type ProjectForWebhook = {
  id: string
  title: string
  price: number | null
  receipt_webhook_sent_at: string | null
  client: ClientRow | ClientRow[] | null
}

export type PaymentForWebhook = {
  amount: number
  method: string | null
  payment_date: string
  notes: string | null
}

/**
 * Sends the outbound webhook to Make.com to trigger Morning receipt generation.
 *
 * @param project  - Project row (with client join)
 * @param payments - All payments for this project, ordered by payment_date DESC
 * @param markSent - Callback that marks `receipt_webhook_sent_at` in DB (called BEFORE the fetch)
 * @returns true if the webhook was sent, false if skipped (no URL, or already sent)
 */
export async function triggerReceiptWebhook(
  project: ProjectForWebhook,
  payments: PaymentForWebhook[],
  markSent: () => Promise<void>
): Promise<boolean> {
  if (!process.env.MAKE_WEBHOOK_URL) return false
  if (project.receipt_webhook_sent_at) return false   // idempotency guard

  // Mark BEFORE the fetch — prevents duplicates under concurrent triggers
  await markSent()

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const last = payments[0] ?? null
  const rawClient = project.client
  const client: ClientRow | null = Array.isArray(rawClient) ? (rawClient[0] ?? null) : rawClient

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
      payment_method:       last?.method ?? null,
      payment_method_label: last?.method ? (METHOD_LABELS[last.method] ?? last.method) : null,
      payment_date:         last?.payment_date ?? null,
      payment_notes:        last?.notes ?? null,
      client_name:          client?.name ?? null,
      client_phone:         client?.phone ?? null,
      client_email:         client?.email ?? null,
      client_address:       client?.address ?? null,
    }),
  }).catch(() => null)

  return true
}
