import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

export async function getClients(): Promise<Client[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createClient_(
  values: Omit<Client, 'id' | 'user_id' | 'created_at'>
): Promise<Client> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(
  id: string,
  values: Partial<Omit<Client, 'id' | 'user_id' | 'created_at'>>
): Promise<Client> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
