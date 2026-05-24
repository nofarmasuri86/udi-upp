import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectStatus } from '@/types'

export async function getProjects(status?: ProjectStatus): Promise<Project[]> {
  const supabase = createClient()
  let query = supabase
    .from('projects')
    .select('*, client:clients(id, name, phone)')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(id, name, phone)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProject(
  values: Omit<Project, 'id' | 'user_id' | 'created_at' | 'client'>
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  values: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'client'>>
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
