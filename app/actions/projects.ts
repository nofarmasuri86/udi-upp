"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { ProjectStatus } from "@/types"

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      client_id: (formData.get("client_id") as string) || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: "new" as ProjectStatus,
      material: (formData.get("material") as string) || null,
      price: formData.get("price") ? Number(formData.get("price")) : null,
      deposit_paid: Number(formData.get("deposit_paid") ?? 0),
      due_date: (formData.get("due_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/projects")
  redirect(`/dashboard/projects/${data.id}`)
}

export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase
    .from("projects")
    .update({
      client_id: (formData.get("client_id") as string) || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      material: (formData.get("material") as string) || null,
      price: formData.get("price") ? Number(formData.get("price")) : null,
      deposit_paid: Number(formData.get("deposit_paid") ?? 0),
      due_date: (formData.get("due_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/projects")
  revalidatePath(`/dashboard/projects/${id}`)
}

export async function updateProjectStatusAction(id: string, status: ProjectStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const updates: Record<string, unknown> = { status }
  if (status === "paid" || status === "delivered") {
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  if (status === "paid") {
    const [{ data: project }, { data: payments }] = await Promise.all([
      supabase
        .from("projects")
        .select("*, client:clients(id, name, phone, email, address)")
        .eq("id", id)
        .single(),
      supabase
        .from("payments")
        .select("amount, method, payment_date, notes")
        .eq("project_id", id)
        .order("payment_date", { ascending: false }),
    ])

    // idempotency: אל תשלח webhook אם כבר נשלח
    if (project?.receipt_webhook_sent_at) {
      revalidatePath("/dashboard/projects")
      revalidatePath(`/dashboard/projects/${id}`)
      revalidatePath("/dashboard")
      return
    }

    if (project && process.env.MAKE_WEBHOOK_URL) {
      const totalPaid = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
      const lastPayment = payments?.[0] ?? null

      const PAYMENT_METHOD_LABELS: Record<string, string> = {
        cash: "מזומן",
        transfer: "העברה בנקאית",
        check: "צ'ק",
        other: "אחר",
      }

      // סמן שהwebhook נשלח לפני הקריאה עצמה — מונע כפילויות
      await supabase
        .from("projects")
        .update({ receipt_webhook_sent_at: new Date().toISOString() })
        .eq("id", id)

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
          payment_method_label: lastPayment?.method ? (PAYMENT_METHOD_LABELS[lastPayment.method] ?? lastPayment.method) : null,
          payment_date:         lastPayment?.payment_date ?? null,
          payment_notes:        lastPayment?.notes ?? null,
          client_name:          project.client?.name ?? null,
          client_phone:         project.client?.phone ?? null,
          client_email:         project.client?.email ?? null,
          client_address:       project.client?.address ?? null,
        }),
      }).catch(() => null)
    }
  }

  revalidatePath("/dashboard/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  revalidatePath("/dashboard")
}

export async function deleteProjectAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/projects")
  redirect("/dashboard/projects")
}
