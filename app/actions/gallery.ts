"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function uploadGalleryItemAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const file = formData.get("image") as File | null
  if (!file || file.size === 0) throw new Error("לא נבחר קובץ")
  if (file.size > 10 * 1024 * 1024) throw new Error("הקובץ גדול מדי (מקסימום 10MB)")

  const title = (formData.get("title") as string)?.trim()
  if (!title) throw new Error("שם התמונה הוא שדה חובה")

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Upload file to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("gallery")
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (storageError) throw new Error(`שגיאת אחסון: ${storageError.message}`)

  const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(storagePath)

  // Save metadata to DB
  const { error: dbError } = await supabase.from("gallery_items").insert({
    user_id: user.id,
    project_id: (formData.get("project_id") as string) || null,
    title,
    description: (formData.get("description") as string) || null,
    image_url: urlData.publicUrl,
    storage_path: storagePath,
  })

  if (dbError) {
    // Rollback storage upload on DB failure
    await supabase.storage.from("gallery").remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath("/dashboard/gallery")
}

export async function deleteGalleryItemAction(id: string, storagePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  await supabase.storage.from("gallery").remove([storagePath])
  const { error } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/gallery")
}

export async function saveMarketingPostAction(
  galleryItemId: string,
  platform: "facebook" | "instagram",
  content: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase.from("marketing_posts").insert({
    user_id: user.id,
    gallery_item_id: galleryItemId,
    platform,
    content,
  })
  if (error) throw new Error(error.message)
}
