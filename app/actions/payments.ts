"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { PaymentMethod } from "@/types"

export async function createPaymentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const projectId = formData.get("project_id") as string
  const method = formData.get("method") as PaymentMethod | null
  const checkFile = formData.get("check_image") as File | null

  let check_image_url: string | null = null
  let check_image_path: string | null = null

  if (method === "check" && checkFile && checkFile.size > 0) {
    const ext = checkFile.name.split(".").pop() ?? "jpg"
    const path = `${user.id}/${projectId}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("checks")
      .upload(path, checkFile, { upsert: false })

    if (uploadError) throw new Error("שגיאה בהעלאת צילום הצ'ק: " + uploadError.message)

    const { data: urlData } = supabase.storage.from("checks").getPublicUrl(path)
    check_image_path = path
    check_image_url = urlData.publicUrl
  }

  const record: Record<string, unknown> = {
    user_id: user.id,
    project_id: projectId,
    amount: Number(formData.get("amount")),
    payment_date: (formData.get("payment_date") as string) || new Date().toISOString().split("T")[0],
    method: method || null,
    notes: (formData.get("notes") as string) || null,
  }
  if (check_image_url) record.check_image_url = check_image_url
  if (check_image_path) record.check_image_path = check_image_path

  const { error } = await supabase.from("payments").insert(record)

  if (error) throw new Error(error.message)

  if (method === "check") {
    await supabase
      .from("projects")
      .update({ status: "waiting_deposit" })
      .eq("id", projectId)
      .eq("user_id", user.id)
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard")
}

export async function deletePaymentAction(paymentId: string, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { data: payment } = await supabase
    .from("payments")
    .select("check_image_path")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .single()

  if (payment?.check_image_path) {
    await supabase.storage.from("checks").remove([payment.check_image_path])
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard")
}
