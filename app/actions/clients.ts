"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    address: (formData.get("address") as string) || null,
    notes: (formData.get("notes") as string) || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard")
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/clients")
  revalidatePath(`/dashboard/clients/${id}`)
  revalidatePath("/dashboard")
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard")
}
