"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type TaskType = "daily" | "weekly" | "general"

export type Task = {
  id: string
  title: string
  type: TaskType
  is_done: boolean
  priority: string
  source: string
  project_id: string | null
  created_at: string
}

export async function addTaskAction(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const title = (formData.get("title") as string)?.trim()
  const type = (formData.get("type") as TaskType) || "general"
  const projectId = (formData.get("project_id") as string) || null

  if (!title) throw new Error("חסר תיאור משימה")

  await supabase.from("tasks").insert({
    user_id: user.id, title, type, project_id: projectId, source: "manual",
  })

  revalidatePath("/dashboard")
}

export async function toggleTaskAction(id: string, done: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("tasks")
    .update({ is_done: done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id).eq("user_id", user.id)

  revalidatePath("/dashboard")
}

export async function deleteTaskAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id)
  revalidatePath("/dashboard")
}

export async function clearDoneTasksAction(type: TaskType): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("tasks").delete()
    .eq("user_id", user.id).eq("type", type).eq("is_done", true)

  revalidatePath("/dashboard")
}

// Called by the AI agent
export async function addTaskFromAgentAction(
  title: string,
  type: TaskType = "general",
  projectId?: string
): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { data, error } = await supabase.from("tasks").insert({
    user_id: user.id, title: title.trim(), type,
    project_id: projectId ?? null, source: "agent",
  }).select("id, title").single()

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
  return data.title
}
