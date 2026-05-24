"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ── Price Catalog ─────────────────────────────────────────

export async function saveCatalogItemAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const id = formData.get("id") as string | null

  const payload = {
    name:       formData.get("name") as string,
    category:   formData.get("category") as string,
    unit:       formData.get("unit") as string,
    unit_price: Number(formData.get("unit_price")),
    notes:      (formData.get("notes") as string) || null,
  }

  if (id) {
    const { error } = await supabase
      .from("price_catalog")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from("price_catalog")
      .insert({ ...payload, user_id: user.id })
    if (error) throw new Error(error.message)
  }

  revalidatePath("/dashboard/quotes")
}

export async function deleteCatalogItemAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase
    .from("price_catalog")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/quotes")
}

// ── Quotes ────────────────────────────────────────────────

export type QuoteLineItem = {
  name:       string
  unit:       string
  qty:        number
  unit_price: number
  total:      number
  catalogId?: string
}

export type MaterialChecklistItem = {
  name:     string
  qty:      number
  unit:     string
  bought:   boolean
}

export async function saveQuoteAction(data: {
  id?:                 string
  project_id?:         string
  client_name:         string
  title:               string
  line_items:          QuoteLineItem[]
  materials_checklist: MaterialChecklistItem[]
  subtotal:            number
  margin_pct:          number
  total:               number
  notes:               string
  valid_days:          number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const payload = {
    project_id:          data.project_id || null,
    client_name:         data.client_name,
    title:               data.title,
    line_items:          data.line_items,
    materials_checklist: data.materials_checklist,
    subtotal:            data.subtotal,
    margin_pct:          data.margin_pct,
    total:               data.total,
    notes:               data.notes,
    valid_days:          data.valid_days,
  }

  if (data.id) {
    const { error } = await supabase
      .from("quotes")
      .update(payload)
      .eq("id", data.id)
      .eq("user_id", user.id)
    if (error) throw new Error(error.message)
  } else {
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({ ...payload, user_id: user.id })
      .select("id")
      .single()
    if (error) throw new Error(error.message)
    revalidatePath("/dashboard/quotes")
    return quote.id as string
  }

  revalidatePath("/dashboard/quotes")
}

export async function updateQuoteStatusAction(id: string, status: "sent" | "accepted" | "rejected") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const extra: Record<string, unknown> = {}
  if (status === "sent")     extra.sent_at     = new Date().toISOString()
  if (status === "accepted") extra.accepted_at  = new Date().toISOString()

  const { error } = await supabase
    .from("quotes")
    .update({ status, ...extra })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/quotes")
}

export async function deleteQuoteAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase.from("quotes").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/quotes")
}
