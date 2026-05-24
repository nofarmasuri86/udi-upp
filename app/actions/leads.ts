"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function importContactsAction(
  contacts: { name: string; phone: string | null; email: string | null }[]
): Promise<{ imported: number; skipped: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  let imported = 0
  let skipped = 0

  for (const contact of contacts) {
    if (!contact.name?.trim()) { skipped++; continue }

    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name: contact.name.trim(),
      phone: contact.phone?.trim() || null,
      email: contact.email?.trim() || null,
    })

    if (error) skipped++
    else imported++
  }

  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard")
  return { imported, skipped }
}

export async function addLeadAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const description = (formData.get("description") as string) || null
  const followUpAt = (formData.get("follow_up_at") as string) || null

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ user_id: user.id, name, phone })
    .select("id")
    .single()

  if (clientError) throw new Error(clientError.message)

  const { error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      client_id: client.id,
      title: `ליד — ${name}`,
      description,
      status: "new",
      follow_up_at: followUpAt || null,
    })

  if (projectError) throw new Error(projectError.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard/projects")
}
