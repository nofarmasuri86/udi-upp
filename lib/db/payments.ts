import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentMethod } from '@/types'

export async function getPaymentsByProject(projectId: string): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createPayment(values: {
  project_id: string
  amount: number
  payment_date?: string
  method?: PaymentMethod
  notes?: string
}): Promise<Payment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePaymentMorningDoc(
  id: string,
  morning_doc_id: string,
  morning_doc_url: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('payments')
    .update({ morning_doc_id, morning_doc_url, receipt_sent_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
