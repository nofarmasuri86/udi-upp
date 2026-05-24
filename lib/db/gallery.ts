import { createClient } from '@/lib/supabase/client'
import type { GalleryItem } from '@/types'

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*, project:projects(id, title)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*, project:projects(id, title)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createGalleryItem(
  values: Omit<GalleryItem, 'id' | 'user_id' | 'created_at' | 'project'>
): Promise<GalleryItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGalleryItem(id: string, storagePath: string): Promise<void> {
  const supabase = createClient()
  await supabase.storage.from('gallery').remove([storagePath])
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) throw error
}

export async function uploadGalleryImage(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('gallery').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('gallery').getPublicUrl(path)
  return { url: data.publicUrl, path }
}
