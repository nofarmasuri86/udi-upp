export type ProjectStatus =
  | 'new'
  | 'in_progress'
  | 'waiting_material'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'paid'
  | 'waiting_deposit'

export type Platform = 'facebook' | 'instagram'

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  status: ProjectStatus
  material: string | null
  price: number | null
  deposit_paid: number
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  client?: Pick<Client, 'id' | 'name' | 'phone'>
}

export interface GalleryItem {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  image_url: string
  storage_path: string
  created_at: string
  project?: Pick<Project, 'id' | 'title'>
}

export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'other'

export interface QuoteLineItem {
  description: string
  quantity: number
  unit_price: number
}

export interface Quote {
  id: string
  user_id: string
  project_id: string
  line_items: QuoteLineItem[]
  total: number
  notes: string | null
  sent_at: string | null
  accepted_at: string | null
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  project_id: string
  amount: number
  payment_date: string
  method: PaymentMethod | null
  check_image_url: string | null
  check_image_path: string | null
  morning_doc_id: string | null
  morning_doc_url: string | null
  receipt_sent_at: string | null
  notes: string | null
  created_at: string
}

export interface MarketingPost {
  id: string
  user_id: string
  gallery_item_id: string
  platform: Platform
  content: string
  created_at: string
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  new: 'חדש',
  in_progress: 'בביצוע',
  waiting_material: 'ממתין לחומר',
  ready: 'מוכן',
  delivered: 'נמסר',
  cancelled: 'בוטל',
  paid: 'שולם',
  waiting_deposit: 'ממתין להפקדה',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_material: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  waiting_deposit: 'bg-purple-100 text-purple-800',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'מזומן',
  transfer: 'העברה בנקאית',
  check: "צ'ק",
  other: 'אחר',
}
