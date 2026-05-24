import { createClient } from '@/lib/supabase/client'
import type { MarketingPost, Platform } from '@/types'

export async function getMarketingPosts(galleryItemId: string): Promise<MarketingPost[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .eq('gallery_item_id', galleryItemId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveMarketingPost(
  galleryItemId: string,
  platform: Platform,
  content: string
): Promise<MarketingPost> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketing_posts')
    .insert({ gallery_item_id: galleryItemId, platform, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMarketingPost(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('marketing_posts').delete().eq('id', id)
  if (error) throw error
}
